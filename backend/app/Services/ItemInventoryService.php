<?php

namespace App\Services;

use App\Models\InventoryMovement;
use App\Models\Item;
use App\Models\ItemAdditionalCharge;
use App\Models\ItemBatch;
use App\Models\PurchaseItem;
use App\Models\SaleItem;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\DB;

class ItemInventoryService
{
    public function __construct(
        private CompanySettingService $companySettingService,
        private InventorySettingService $inventorySettingService,
        private ItemService $itemService,
    ) {
    }

    public function getHistoryForUser(User $user, int $itemId, int $limit = 100): array
    {
        $item = $this->findItemForUser($user, $itemId);
        $companyId = $item->company_id;

        $movements = InventoryMovement::where('company_id', $companyId)
            ->where('item_id', $item->id)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(fn (InventoryMovement $m) => $this->formatMovement($m));

        $sales = SaleItem::where('item_id', $item->id)
            ->whereHas('sale', fn ($q) => $q->where('company_id', $companyId))
            ->with('sale:id,sales_id,sale_date,location,transaction_type')
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(function (SaleItem $line) {
                $sale = $line->sale;
                $isReturn = $sale && ($sale->transaction_type ?? '') === '1002';

                return [
                    'source' => 'sale',
                    'movement_type' => $isReturn ? 'return' : 'sale',
                    'reference_label' => $sale?->sales_id ?? '—',
                    'reference_id' => $sale?->id,
                    'location' => $sale?->location,
                    'qty_change' => $isReturn ? (float) $line->qty : -(float) $line->qty,
                    'unit_cost' => (float) ($line->purchase_price ?? $line->unit_price ?? 0),
                    'notes' => $line->description,
                    'created_at' => $line->created_at?->format('Y-m-d H:i:s'),
                ];
            });

        $purchases = PurchaseItem::where('item_id', $item->id)
            ->whereHas('purchase', fn ($q) => $q->where('company_id', $companyId))
            ->with('purchase:id,invoice_id,purchase_date,location,purchase_type')
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(function (PurchaseItem $line) {
                $purchase = $line->purchase;
                $isReturn = $purchase && PurchaseService::isPurchaseReturn($purchase->purchase_type);

                return [
                    'source' => 'purchase',
                    'movement_type' => $isReturn ? 'purchase_return' : 'purchase',
                    'reference_label' => $purchase?->invoice_id ?? '—',
                    'reference_id' => $purchase?->id,
                    'location' => $purchase?->location,
                    'qty_change' => $isReturn ? -(float) $line->qty : (float) $line->qty,
                    'unit_cost' => (float) $line->unit_price,
                    'notes' => $line->description,
                    'created_at' => $line->created_at?->format('Y-m-d H:i:s'),
                ];
            });

        $rows = collect()
            ->merge($movements)
            ->merge($sales)
            ->merge($purchases)
            ->sortByDesc('created_at')
            ->values()
            ->take($limit)
            ->all();

        return [
            'item' => $this->itemService->getForUser($user, $itemId),
            'history' => $rows,
        ];
    }

    public function getCostViewForUser(User $user, int $itemId): array
    {
        $item = $this->itemService->getForUser($user, $itemId);
        $qty = (float) ($item['qty'] ?? 0);
        $unitCost = (float) ($item['unit_cost'] ?? 0);
        $purchase = (float) ($item['purchase_price'] ?? 0);
        $selling = (float) ($item['selling_price'] ?? 0);

        return [
            'item' => $item,
            'costing' => [
                'costing_method' => $item['costing_method'] ?? 'FIFO',
                'bid' => $item['bid'] ?? $unitCost,
                'unit_cost' => $unitCost,
                'last_purchase_price' => $item['last_purchase_price'] ?? $purchase,
                'purchase_price' => $purchase,
                'selling_price' => $selling,
                'qty_on_hand' => $qty,
                'inventory_value' => round(max(0, $qty) * $unitCost, 2),
                'margin_percent' => $item['margin_percent'] ?? 0,
                'markup_percent' => $item['markup_percent'] ?? 0,
                'profit_per_unit' => $item['profit'] ?? round($selling - $purchase, 2),
            ],
        ];
    }

    public function adjustInventoryForUser(User $user, int $itemId, array $data): array
    {
        $item = $this->findItemForUser($user, $itemId);

        if (!$item->track_with_inventory) {
            throw new Exception('This item is not tracked with inventory.');
        }

        return DB::transaction(function () use ($user, $item, $data) {
            $item->refresh();
            $qtyBefore = (float) $item->qty;
            $newQty = isset($data['new_qty'])
                ? max(0, (float) $data['new_qty'])
                : $qtyBefore + (float) ($data['qty_change'] ?? 0);
            $newQty = max(0, $newQty);
            $qtyChange = round($newQty - $qtyBefore, 2);

            if ($qtyChange == 0.0) {
                throw new Exception('Quantity did not change.');
            }

            $settings = $this->inventorySettingService->getForUser($user);
            $unitCost = $this->resolveUnitCostFromItem($item, $settings['costing_method'] ?? 'FIFO');

            $item->qty = $newQty;
            $item->save();

            InventoryMovement::create([
                'company_id' => $item->company_id,
                'item_id' => $item->id,
                'movement_type' => InventoryMovement::TYPE_ADJUSTMENT,
                'reference_label' => 'Manual adjustment',
                'location' => $item->location,
                'qty_before' => $qtyBefore,
                'qty_change' => $qtyChange,
                'qty_after' => $newQty,
                'unit_cost' => $unitCost,
                'notes' => $data['notes'] ?? null,
                'user_id' => $user->id,
            ]);

            return $this->itemService->getForUser($user, $item->id);
        });
    }

    public function writeOffForUser(User $user, int $itemId, array $data): array
    {
        $item = $this->findItemForUser($user, $itemId);

        if (!$item->track_with_inventory) {
            throw new Exception('This item is not tracked with inventory.');
        }

        $batchLines = $this->normalizeWriteOffBatchLines($data['batches'] ?? null);
        $mainQty = round(max(0, (float) ($data['main_qty'] ?? 0)), 2);
        $batchTotal = $batchLines !== []
            ? round(array_sum(array_column($batchLines, 'qty')), 2)
            : 0.0;

        if ($batchLines !== [] || $mainQty > 0) {
            $writeOffQty = round($batchTotal + $mainQty, 2);
        } else {
            $writeOffQty = max(0.01, (float) ($data['qty'] ?? 0));
        }

        if ($writeOffQty <= 0) {
            throw new Exception('Write-off quantity must be greater than zero.');
        }

        return DB::transaction(function () use ($user, $item, $data, $writeOffQty, $batchLines, $mainQty) {
            $item = Item::where('id', $item->id)->lockForUpdate()->firstOrFail();
            $qtyBefore = (float) $item->qty;
            if ($writeOffQty > $qtyBefore) {
                throw new Exception('Write-off quantity cannot exceed stock on hand.');
            }

            if ($mainQty > 0) {
                $batchedTotal = (float) ItemBatch::query()
                    ->where('item_id', $item->id)
                    ->where('qty', '>', 0)
                    ->sum('qty');
                $unbatched = round(max(0, $qtyBefore - $batchedTotal), 2);
                if ($mainQty > $unbatched + 0.001) {
                    throw new Exception(
                        "Main item write-off qty ({$mainQty}) exceeds unbatched stock ({$unbatched})."
                    );
                }
            }

            if ($batchLines !== []) {
                $this->deductWriteOffFromSelectedBatches($item, $batchLines);
            } elseif ($mainQty <= 0) {
                $this->deductWriteOffFromBatches($item, $writeOffQty);
            }

            $newQty = round($qtyBefore - $writeOffQty, 2);
            $settings = $this->inventorySettingService->getForUser($user);
            $unitCost = $this->resolveUnitCostFromItem($item, $settings['costing_method'] ?? 'FIFO');

            $item->qty = $newQty;
            $item->save();

            $this->itemService->syncItemExpiryFromBatches($item->fresh());

            if ($newQty <= 0) {
                $item->refresh();
                $item->expiry_date = null;
                $item->save();
            }

            InventoryMovement::create([
                'company_id' => $item->company_id,
                'item_id' => $item->id,
                'movement_type' => InventoryMovement::TYPE_WRITE_OFF,
                'reference_label' => 'Write-off',
                'location' => $item->location,
                'qty_before' => $qtyBefore,
                'qty_change' => -$writeOffQty,
                'qty_after' => $newQty,
                'unit_cost' => $unitCost,
                'notes' => $data['notes'] ?? null,
                'user_id' => $user->id,
            ]);

            return $this->itemService->getForUser($user, $item->id);
        });
    }

    public function getBatchesForUser(User $user, int $itemId): array
    {
        $item = $this->findItemForUser($user, $itemId);

        ItemBatch::where('company_id', $item->company_id)
            ->where('item_id', $item->id)
            ->where('qty', '<=', 0)
            ->delete();

        $batches = ItemBatch::where('company_id', $item->company_id)
            ->where('item_id', $item->id)
            ->where('qty', '>', 0)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (ItemBatch $b) => $this->formatBatch($b));

        return [
            'item' => $this->itemService->getForUser($user, $itemId),
            'batches' => $batches,
        ];
    }

    public function getInventoryBreakdownForUser(User $user, int $itemId): array
    {
        $item = $this->findItemForUser($user, $itemId);
        $this->itemService->syncItemExpiryFromBatches($item);
        $item->refresh();
        $companyId = $item->company_id;
        $itemNumber = $item->item_number;

        $variants = Item::where('company_id', $companyId)
            ->where('item_number', $itemNumber)
            ->orderBy('location')
            ->get();

        $variantIds = $variants->pluck('id')->all();

        ItemBatch::where('company_id', $companyId)
            ->whereIn('item_id', $variantIds)
            ->where('qty', '<=', 0)
            ->delete();

        $allBatches = ItemBatch::where('company_id', $companyId)
            ->whereIn('item_id', $variantIds)
            ->where('qty', '>', 0)
            ->orderBy('location')
            ->orderBy('expiry_date')
            ->orderBy('batch_number')
            ->get();

        $batchQtyByItemId = $allBatches
            ->groupBy('item_id')
            ->map(fn ($group) => (float) $group->sum('qty'));

        $nearestExpiryByItemId = $allBatches
            ->groupBy('item_id')
            ->map(function ($group) {
                $dates = $group->pluck('expiry_date')->filter();

                return $dates->isEmpty() ? null : $dates->min();
            });

        $today = now()->toDateString();
        $variantRows = $variants->map(function (Item $variant) use ($itemId, $batchQtyByItemId, $nearestExpiryByItemId, $today) {
            $batchQty = (float) ($batchQtyByItemId[$variant->id] ?? 0);
            $itemQty = (float) ($variant->qty ?? 0);
            $unbatchedQty = round(max(0, $itemQty - $batchQty), 2);
            $mainExpiry = $variant->expiry_date?->format('Y-m-d');
            $batchNearest = $nearestExpiryByItemId[$variant->id] ?? null;

            $displayNearest = null;
            if ($unbatchedQty > 0.001 && $mainExpiry && $mainExpiry >= $today) {
                $displayNearest = $mainExpiry;
            } elseif ($batchNearest !== null) {
                $displayNearest = $batchNearest->format('Y-m-d');
            } elseif ($mainExpiry) {
                $displayNearest = $mainExpiry;
            }

            return [
                'id' => $variant->id,
                'location' => $variant->location,
                'qty' => $itemQty,
                'batch_qty' => round($batchQty, 2),
                'unbatched_qty' => $unbatchedQty,
                'purchase_price' => (float) ($variant->purchase_price ?? 0),
                'selling_price' => (float) ($variant->selling_price ?? 0),
                'expiry_date' => $mainExpiry,
                'nearest_expiry_date' => $displayNearest,
                'is_current' => $variant->id === $itemId,
            ];
        })->values();

        $totalQty = (float) $variants->sum(fn (Item $v) => (float) ($v->qty ?? 0));
        $totalBatchQty = (float) $allBatches->sum(fn (ItemBatch $b) => (float) $b->qty);

        $batchRows = $allBatches->map(function (ItemBatch $batch) {
            return array_merge($this->formatBatch($batch), [
                'item_id' => $batch->item_id,
            ]);
        })->values();

        return [
            'item' => $this->itemService->getForUser($user, $itemId),
            'totals' => [
                'total_qty' => round($totalQty, 2),
                'total_batch_qty' => round($totalBatchQty, 2),
                'total_unbatched_qty' => round(max(0, $totalQty - $totalBatchQty), 2),
                'variant_count' => $variants->count(),
                'batch_count' => $allBatches->count(),
            ],
            'variants' => $variantRows,
            'batches' => $batchRows,
        ];
    }

    public function createBatchForUser(User $user, int $itemId, array $data): array
    {
        $item = $this->findItemForUser($user, $itemId);
        $this->itemService->syncItemExpiryFromBatches($item);
        $item->refresh();

        $qty = max(0.01, (float) ($data['qty'] ?? 0));
        $location = $data['location'] ?? $item->location;
        $expiryDate = $this->normalizeBatchExpiryDate($data['expiry_date'] ?? null);
        $purchasePrice = max(0, (float) ($data['purchase_price'] ?? $item->purchase_price ?? 0));
        $sellingPrice = max(0, (float) ($data['selling_price'] ?? $item->selling_price ?? 0));

        if ($this->matchesMainItemPurchase($item, $expiryDate, $purchasePrice)) {
            return DB::transaction(function () use ($user, $item, $qty, $purchasePrice, $data) {
                $qtyBefore = (float) $item->qty;
                $item->qty = round($qtyBefore + $qty, 2);
                $item->save();

                InventoryMovement::create([
                    'company_id' => $item->company_id,
                    'item_id' => $item->id,
                    'movement_type' => InventoryMovement::TYPE_OPENING,
                    'reference_label' => 'Main item stock',
                    'location' => $item->location,
                    'qty_before' => $qtyBefore,
                    'qty_change' => $qty,
                    'qty_after' => (float) $item->qty,
                    'unit_cost' => $purchasePrice,
                    'notes' => $data['notes'] ?? 'Added to main item stock',
                    'user_id' => $user->id,
                ]);

                return [
                    'batch' => null,
                    'item' => $this->itemService->getForUser($user, $item->id),
                    'merged' => true,
                    'message' => 'Stock added to main item (same purchase price and expiry).',
                ];
            });
        }

        $existing = $this->findMergeableBatch($item->id, $location, $expiryDate, $purchasePrice);
        if ($existing) {
            return $this->addStockToExistingBatch($user, $item, $existing, $qty, $purchasePrice, $sellingPrice, $data['notes'] ?? null);
        }

        $batchNumber = trim((string) ($data['batch_number'] ?? ''));
        if ($batchNumber === '') {
            $batchNumber = $expiryDate
                ? 'EXP-'.str_replace('-', '', $expiryDate).'-'.now()->format('His')
                : 'BATCH-'.now()->format('YmdHis');
        }

        if (ItemBatch::where('item_id', $item->id)->where('batch_number', $batchNumber)->exists()) {
            throw new Exception('Batch number already exists for this item.');
        }

        return DB::transaction(function () use ($user, $item, $data, $batchNumber, $qty, $location, $expiryDate, $purchasePrice, $sellingPrice) {
            $batch = ItemBatch::create([
                'company_id' => $item->company_id,
                'item_id' => $item->id,
                'batch_number' => $batchNumber,
                'location' => $location,
                'qty' => $qty,
                'purchase_price' => $purchasePrice,
                'selling_price' => $sellingPrice,
                'expiry_date' => $expiryDate,
                'notes' => $data['notes'] ?? null,
            ]);

            $this->applyBatchStockIncrease($user, $item, $batch, $qty, 'New batch stock');

            $this->itemService->syncItemExpiryFromBatches($item->fresh());

            if ($purchasePrice > 0) {
                $item->purchase_price = $purchasePrice;
            }
            if ($sellingPrice > 0) {
                $item->selling_price = $sellingPrice;
            }
            if ($purchasePrice > 0 || $sellingPrice > 0) {
                $item->save();
            }

            return [
                'batch' => $this->formatBatch($batch),
                'item' => $this->itemService->getForUser($user, $item->id),
                'merged' => false,
                'message' => 'Batch created and stock added.',
            ];
        });
    }

    /**
     * Add qty to an existing batch (same item, location, expiry, and purchase price).
     *
     * @return array{batch: array, item: array, merged: bool, message: string}
     */
    private function addStockToExistingBatch(
        User $user,
        Item $item,
        ItemBatch $batch,
        float $addQty,
        float $purchasePrice,
        float $sellingPrice,
        ?string $notes,
    ): array {
        return DB::transaction(function () use ($user, $item, $batch, $addQty, $purchasePrice, $sellingPrice, $notes) {
            $locked = ItemBatch::where('id', $batch->id)->lockForUpdate()->firstOrFail();
            $oldQty = (float) $locked->qty;
            $oldPurchase = (float) $locked->purchase_price;
            $newBatchQty = round($oldQty + $addQty, 2);

            if ($purchasePrice > 0 && $oldQty > 0) {
                $locked->purchase_price = round(
                    (($oldQty * $oldPurchase) + ($addQty * $purchasePrice)) / $newBatchQty,
                    2
                );
            } elseif ($purchasePrice > 0) {
                $locked->purchase_price = $purchasePrice;
            }

            if ($sellingPrice > 0) {
                $locked->selling_price = $sellingPrice;
            }

            $locked->qty = $newBatchQty;
            if ($notes) {
                $locked->notes = trim(($locked->notes ? $locked->notes.' · ' : '').$notes);
            }
            $locked->save();

            $this->applyBatchStockIncrease($user, $item, $locked, $addQty, 'Added to existing batch (same expiry)');

            $this->itemService->syncItemExpiryFromBatches($item->fresh());

            if ($purchasePrice > 0) {
                $item->purchase_price = (float) $locked->purchase_price;
            }
            if ($sellingPrice > 0) {
                $item->selling_price = $sellingPrice;
            }
            if ($purchasePrice > 0 || $sellingPrice > 0) {
                $item->save();
            }

            return [
                'batch' => $this->formatBatch($locked->fresh()),
                'item' => $this->itemService->getForUser($user, $item->id),
                'merged' => true,
                'message' => 'Stock added to existing batch (same expiry and purchase price).',
            ];
        });
    }

    private function applyBatchStockIncrease(User $user, Item $item, ItemBatch $batch, float $addQty, string $note): void
    {
        if ($addQty <= 0 || !($item->track_with_inventory ?? true)) {
            return;
        }

        $qtyBefore = (float) $item->qty;
        $item->qty = round($qtyBefore + $addQty, 2);
        $item->save();

        InventoryMovement::create([
            'company_id' => $item->company_id,
            'item_id' => $item->id,
            'movement_type' => InventoryMovement::TYPE_OPENING,
            'reference_type' => 'item_batch',
            'reference_id' => $batch->id,
            'reference_label' => $batch->batch_number,
            'location' => $batch->location,
            'qty_before' => $qtyBefore,
            'qty_change' => $addQty,
            'qty_after' => (float) $item->qty,
            'unit_cost' => (float) $batch->purchase_price,
            'notes' => $note,
            'user_id' => $user->id,
        ]);
    }

    private function normalizeBatchExpiryDate(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        $trimmed = trim((string) $value);

        return $trimmed !== '' ? $trimmed : null;
    }

    /**
     * Main item stock uses the item master purchase price and expiry (unbatched).
     */
    private function matchesMainItemPurchase(Item $item, ?string $expiryDate, float $purchasePrice): bool
    {
        $mainExpiry = $item->expiry_date?->format('Y-m-d');
        if ($mainExpiry !== null && $mainExpiry < now()->toDateString()) {
            return false;
        }

        $a = $mainExpiry !== null && trim($mainExpiry) !== '' ? trim($mainExpiry) : null;
        $b = $expiryDate !== null && trim($expiryDate) !== '' ? trim($expiryDate) : null;

        if ($a === null && $b === null) {
            // both no expiry — ok
        } elseif ($a === null || $b === null || $a !== $b) {
            return false;
        }

        $mainPrice = (float) ($item->purchase_price ?? 0);
        if ($purchasePrice <= 0) {
            return true;
        }

        return abs($mainPrice - $purchasePrice) < 0.005;
    }

    /**
     * Merge only when expiry date and purchase price both match an in-stock batch.
     */
    private function findMergeableBatch(
        int $itemId,
        string $location,
        ?string $expiryDate,
        float $purchasePrice,
    ): ?ItemBatch {
        $query = ItemBatch::query()
            ->where('item_id', $itemId)
            ->where('location', $location)
            ->where('qty', '>', 0);

        if ($expiryDate !== null) {
            $query->whereDate('expiry_date', $expiryDate);
        } else {
            $query->whereNull('expiry_date');
        }

        return $query->get()->first(function (ItemBatch $batch) use ($purchasePrice) {
            if ($purchasePrice <= 0) {
                return true;
            }

            return abs((float) $batch->purchase_price - $purchasePrice) < 0.005;
        });
    }

    public function updateBatchForUser(User $user, int $itemId, int $batchId, array $data): array
    {
        $item = $this->findItemForUser($user, $itemId);
        $batch = ItemBatch::where('company_id', $item->company_id)
            ->where('item_id', $item->id)
            ->where('id', $batchId)
            ->first();

        if (!$batch) {
            throw new Exception('Batch not found.');
        }

        return DB::transaction(function () use ($user, $item, $batch, $data) {
            $oldQty = (float) $batch->qty;

            if (array_key_exists('batch_number', $data)) {
                $batchNumber = trim((string) $data['batch_number']);
                if ($batchNumber === '') {
                    throw new Exception('Batch number is required.');
                }
                if ($batchNumber !== $batch->batch_number) {
                    $exists = ItemBatch::where('item_id', $item->id)
                        ->where('batch_number', $batchNumber)
                        ->where('id', '!=', $batch->id)
                        ->exists();
                    if ($exists) {
                        throw new Exception('Batch number already exists for this item.');
                    }
                    $batch->batch_number = $batchNumber;
                }
            }

            if (array_key_exists('purchase_price', $data)) {
                $batch->purchase_price = max(0, (float) $data['purchase_price']);
            }

            if (array_key_exists('selling_price', $data)) {
                $batch->selling_price = max(0, (float) $data['selling_price']);
            }

            if (array_key_exists('expiry_date', $data)) {
                $batch->expiry_date = !empty($data['expiry_date']) ? $data['expiry_date'] : null;
            }

            if (array_key_exists('notes', $data)) {
                $batch->notes = $data['notes'] !== null && $data['notes'] !== ''
                    ? (string) $data['notes']
                    : null;
            }

            if (array_key_exists('qty', $data)) {
                $newQty = max(0, (float) $data['qty']);
                $delta = round($newQty - $oldQty, 2);

                if ($delta !== 0.0 && ($item->track_with_inventory ?? true)) {
                    $qtyBefore = (float) $item->qty;
                    $qtyAfter = round($qtyBefore + $delta, 2);
                    if ($qtyAfter < 0) {
                        throw new Exception('Cannot reduce batch quantity below available item stock.');
                    }

                    $item->qty = $qtyAfter;
                    $item->save();

                    InventoryMovement::create([
                        'company_id' => $item->company_id,
                        'item_id' => $item->id,
                        'movement_type' => InventoryMovement::TYPE_ADJUSTMENT,
                        'reference_type' => 'item_batch',
                        'reference_id' => $batch->id,
                        'reference_label' => $batch->batch_number,
                        'location' => $batch->location,
                        'qty_before' => $qtyBefore,
                        'qty_change' => $delta,
                        'qty_after' => $qtyAfter,
                        'unit_cost' => (float) $batch->purchase_price,
                        'notes' => 'Batch quantity updated',
                        'user_id' => $user->id,
                    ]);
                }

                $batch->qty = $newQty;
            }

            if ((float) $batch->qty <= 0) {
                $batch->delete();
            } else {
                $batch->save();
            }

            $this->itemService->syncItemExpiryFromBatches($item->fresh());

            return [
                'batch' => $batch->exists ? $this->formatBatch($batch->fresh()) : null,
                'item' => $this->itemService->getForUser($user, $item->id),
            ];
        });
    }

    public function deleteBatchForUser(User $user, int $itemId, int $batchId): array
    {
        $item = $this->findItemForUser($user, $itemId);

        return DB::transaction(function () use ($user, $item, $batchId) {
            $batch = ItemBatch::where('company_id', $item->company_id)
                ->where('item_id', $item->id)
                ->where('id', $batchId)
                ->lockForUpdate()
                ->first();

            if (!$batch) {
                throw new Exception('Batch not found.');
            }

            $batchQty = (float) $batch->qty;
            $batchNumber = $batch->batch_number;

            if ($batchQty > 0 && ($item->track_with_inventory ?? true)) {
                $qtyBefore = (float) $item->qty;
                $qtyAfter = round(max(0, $qtyBefore - $batchQty), 2);
                $item->qty = $qtyAfter;
                $item->save();

                InventoryMovement::create([
                    'company_id' => $item->company_id,
                    'item_id' => $item->id,
                    'movement_type' => InventoryMovement::TYPE_ADJUSTMENT,
                    'reference_type' => 'item_batch',
                    'reference_id' => $batch->id,
                    'reference_label' => $batchNumber,
                    'location' => $batch->location,
                    'qty_before' => $qtyBefore,
                    'qty_change' => -$batchQty,
                    'qty_after' => $qtyAfter,
                    'unit_cost' => (float) $batch->purchase_price,
                    'notes' => 'Batch deleted',
                    'user_id' => $user->id,
                ]);
            }

            $batch->delete();
            $this->itemService->syncItemExpiryFromBatches($item->fresh());

            return [
                'item' => $this->itemService->getForUser($user, $item->id),
            ];
        });
    }

    public function getAdditionalChargesForUser(User $user, int $itemId): array
    {
        $item = $this->findItemForUser($user, $itemId);

        $charges = ItemAdditionalCharge::where('company_id', $item->company_id)
            ->where('item_id', $item->id)
            ->orderBy('name')
            ->get()
            ->map(fn (ItemAdditionalCharge $c) => $this->formatCharge($c));

        return [
            'item_id' => $item->id,
            'charges' => $charges,
        ];
    }

    public function saveAdditionalChargesForUser(User $user, int $itemId, array $charges): array
    {
        $item = $this->findItemForUser($user, $itemId);

        DB::transaction(function () use ($item, $charges) {
            ItemAdditionalCharge::where('item_id', $item->id)->delete();

            foreach ($charges as $row) {
                if (!is_array($row)) {
                    continue;
                }
                $name = trim((string) ($row['name'] ?? ''));
                if ($name === '') {
                    continue;
                }
                ItemAdditionalCharge::create([
                    'company_id' => $item->company_id,
                    'item_id' => $item->id,
                    'name' => $name,
                    'amount' => max(0, (float) ($row['amount'] ?? 0)),
                    'charge_type' => in_array($row['charge_type'] ?? 'fixed', ['fixed', 'percent'], true)
                        ? $row['charge_type']
                        : 'fixed',
                    'is_active' => (bool) ($row['is_active'] ?? true),
                ]);
            }
        });

        return $this->getAdditionalChargesForUser($user, $itemId);
    }

    private function findItemForUser(User $user, int $id): Item
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $item = Item::where('company_id', $company->id)->where('id', $id)->first();

        if (!$item) {
            throw new Exception('Item not found');
        }

        return $item;
    }

    private function resolveUnitCostFromItem(Item $item, string $costingMethod): float
    {
        $purchase = (float) ($item->purchase_price ?? 0);

        return round($purchase, 2);
    }

    private function formatMovement(InventoryMovement $m): array
    {
        return [
            'source' => 'movement',
            'movement_type' => $m->movement_type,
            'reference_label' => $m->reference_label,
            'reference_id' => $m->reference_id,
            'location' => $m->location,
            'qty_before' => (float) $m->qty_before,
            'qty_change' => (float) $m->qty_change,
            'qty_after' => (float) $m->qty_after,
            'unit_cost' => (float) ($m->unit_cost ?? 0),
            'notes' => $m->notes,
            'created_at' => $m->created_at?->format('Y-m-d H:i:s'),
        ];
    }

    /**
     * @param  mixed  $raw
     * @return list<array{item_batch_id: int, qty: float}>
     */
    private function normalizeWriteOffBatchLines(mixed $raw): array
    {
        if (!is_array($raw) || $raw === []) {
            return [];
        }

        $lines = [];
        foreach ($raw as $row) {
            if (!is_array($row) || empty($row['item_batch_id'])) {
                continue;
            }
            $qty = max(0.01, (float) ($row['qty'] ?? 0));
            $lines[] = [
                'item_batch_id' => (int) $row['item_batch_id'],
                'qty' => round($qty, 2),
            ];
        }

        return $lines;
    }

    /**
     * @param  list<array{item_batch_id: int, qty: float}>  $lines
     */
    private function deductWriteOffFromSelectedBatches(Item $item, array $lines): void
    {
        foreach ($lines as $line) {
            $batch = ItemBatch::query()
                ->where('item_id', $item->id)
                ->where('id', $line['item_batch_id'])
                ->lockForUpdate()
                ->first();

            if (!$batch) {
                throw new Exception('Selected batch was not found for this item.');
            }

            $take = (float) $line['qty'];
            $batchQty = (float) $batch->qty;
            if ($take > $batchQty) {
                throw new Exception(
                    "Write-off qty ({$take}) exceeds batch {$batch->batch_number} stock ({$batchQty})."
                );
            }

            $batch->qty = round($batchQty - $take, 2);
            if ($batch->qty <= 0) {
                $batch->delete();
            } else {
                $batch->save();
            }
        }
    }

    /**
     * Remove write-off qty from batches at this branch (earliest expiry first — expired stock first).
     */
    private function deductWriteOffFromBatches(Item $item, float $writeOffQty): void
    {
        $remaining = round($writeOffQty, 2);
        if ($remaining <= 0) {
            return;
        }

        $batches = ItemBatch::query()
            ->where('item_id', $item->id)
            ->where('location', $item->location)
            ->where('qty', '>', 0)
            ->orderByRaw('CASE WHEN expiry_date IS NULL THEN 1 ELSE 0 END ASC')
            ->orderBy('expiry_date')
            ->orderBy('id')
            ->lockForUpdate()
            ->get();

        foreach ($batches as $batch) {
            if ($remaining <= 0) {
                break;
            }

            $batchQty = (float) $batch->qty;
            $take = min($batchQty, $remaining);
            $batch->qty = round($batchQty - $take, 2);

            if ($batch->qty <= 0) {
                $batch->delete();
            } else {
                $batch->save();
            }

            $remaining = round($remaining - $take, 2);
        }
    }

    private function formatBatch(ItemBatch $b): array
    {
        return [
            'id' => $b->id,
            'batch_number' => $b->batch_number,
            'location' => $b->location,
            'qty' => (float) $b->qty,
            'purchase_price' => (float) $b->purchase_price,
            'selling_price' => $b->selling_price !== null ? (float) $b->selling_price : null,
            'expiry_date' => $b->expiry_date?->format('Y-m-d'),
            'notes' => $b->notes,
            'created_at' => $b->created_at?->format('Y-m-d H:i:s'),
        ];
    }

    private function formatCharge(ItemAdditionalCharge $c): array
    {
        return [
            'id' => $c->id,
            'name' => $c->name,
            'amount' => (float) $c->amount,
            'charge_type' => $c->charge_type,
            'is_active' => (bool) $c->is_active,
        ];
    }
}
