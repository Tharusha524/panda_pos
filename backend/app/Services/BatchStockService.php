<?php

namespace App\Services;

use App\Models\InventoryMovement;
use App\Models\Item;
use App\Models\ItemBatch;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\User;
use Carbon\Carbon;

class BatchStockService
{
    public function __construct(
        private LocationService $locationService,
        private ItemService $itemService,
    ) {
    }

    /**
     * @param  array<int, array{item_id: ?int, qty: float, unit_price?: float, expiry_date?: ?string}>  $lines
     * @param  PurchaseItem[]  $purchaseItems
     */
    public function applyPurchaseStock(Purchase $purchase, array $lines, array $purchaseItems, ?User $user = null): void
    {
        if (PurchaseService::isPurchaseReturn($purchase->purchase_type)) {
            $this->applyPurchaseReturnStock($purchase, $lines, $user);

            return;
        }

        foreach ($lines as $index => $line) {
            if (empty($line['item_id'])) {
                continue;
            }

            $purchaseItem = $purchaseItems[$index] ?? null;
            if (!$purchaseItem instanceof PurchaseItem) {
                continue;
            }

            $source = Item::where('company_id', $purchase->company_id)
                ->where('id', $line['item_id'])
                ->first();

            if (!$source || !($source->track_with_inventory ?? true)) {
                continue;
            }

            $item = $this->locationService->resolveStockItemAtLocation($source, $purchase->location);
            $item->refresh();

            $qty = max(0.01, (float) ($line['qty'] ?? 1));
            $unitPrice = max(0, (float) ($line['unit_price'] ?? 0));
            $expiryDate = $this->normalizeExpiryDate($line['expiry_date'] ?? $purchaseItem->expiry_date);

            if ($this->matchesMainItemPurchase($item, $expiryDate, $unitPrice)) {
                $this->addPurchaseToMainItemQty($purchase, $purchaseItem, $item, $qty, $unitPrice, $expiryDate, $user);
                continue;
            }

            $this->addPurchaseBatchStock($purchase, $purchaseItem, $item, $qty, $unitPrice, $expiryDate, $user);
        }
    }

    /**
     * @param  array<int, array{item_id: ?int, qty: float, unit_price?: float, expiry_date?: ?string, item_batch_id?: ?int}>  $lines
     */
    public function reversePurchaseStock(
        int $companyId,
        array $lines,
        string $location,
        bool $wasReturn = false,
    ): void {
        if ($wasReturn) {
            $this->locationService->addStockForLines($companyId, $lines, $location);

            return;
        }

        foreach ($lines as $line) {
            if (empty($line['item_id'])) {
                continue;
            }

            $batchId = $line['item_batch_id'] ?? null;
            if ($batchId) {
                $this->reverseBatchStock($companyId, (int) $batchId, (float) $line['qty'], $location);

                continue;
            }

            $this->locationService->removeStockForLines(
                $companyId,
                [$line],
                $location,
            );
        }
    }

    /**
     * @param  array<int, array{item_id: ?int, qty: float, unit_price?: float, expiry_date?: ?string, item_batch_id?: ?int}>  $lines
     */
    private function applyPurchaseReturnStock(Purchase $purchase, array $lines, ?User $user): void
    {
        $sourceItemsByItemId = [];
        if ($purchase->returned_from_purchase_id) {
            PurchaseItem::where('purchase_id', $purchase->returned_from_purchase_id)
                ->orderBy('id')
                ->get()
                ->each(function (PurchaseItem $sourceLine) use (&$sourceItemsByItemId) {
                    if ($sourceLine->item_id) {
                        $sourceItemsByItemId[(int) $sourceLine->item_id][] = $sourceLine;
                    }
                });
        }

        foreach ($lines as $line) {
            if (empty($line['item_id'])) {
                continue;
            }

            $source = Item::where('company_id', $purchase->company_id)
                ->where('id', $line['item_id'])
                ->first();

            if (!$source || !($source->track_with_inventory ?? true)) {
                continue;
            }

            $item = $this->locationService->resolveStockItemAtLocation($source, $purchase->location);
            $item->refresh();

            $qty = max(0.01, (float) ($line['qty'] ?? 1));
            $qtyBefore = (float) $item->qty;
            $unitPrice = max(0, (float) ($line['unit_price'] ?? 0));
            $itemId = (int) $line['item_id'];
            $stockLine = $line;

            if (!empty($sourceItemsByItemId[$itemId])) {
                $sourceLine = array_shift($sourceItemsByItemId[$itemId]);
                if ($sourceLine?->item_batch_id) {
                    $stockLine = array_merge($line, ['item_batch_id' => (int) $sourceLine->item_batch_id]);
                }
            }

            $this->locationService->removeStockForLines(
                $purchase->company_id,
                [$stockLine],
                $purchase->location,
            );

            $item->refresh();

            InventoryMovement::create([
                'company_id' => $purchase->company_id,
                'item_id' => $item->id,
                'movement_type' => InventoryMovement::TYPE_PURCHASE,
                'reference_type' => 'purchase_return',
                'reference_id' => $purchase->id,
                'reference_label' => $purchase->invoice_id,
                'location' => $purchase->location,
                'qty_before' => $qtyBefore,
                'qty_change' => -$qty,
                'qty_after' => (float) $item->qty,
                'unit_cost' => $unitPrice > 0 ? $unitPrice : (float) ($item->purchase_price ?? 0),
                'notes' => 'Purchase return '.$purchase->invoice_id,
                'user_id' => $user?->id,
            ]);
        }
    }

    /**
     * Main (unbatched) stock: same purchase price and expiry as the item master record.
     */
    private function addPurchaseToMainItemQty(
        Purchase $purchase,
        PurchaseItem $purchaseItem,
        Item $item,
        float $qty,
        float $unitPrice,
        ?string $expiryDate,
        ?User $user,
    ): void {
        $qtyBefore = (float) $item->qty;
        $item->qty = round($qtyBefore + $qty, 2);
        if ($expiryDate && !$item->expiry_date) {
            $item->expiry_date = $expiryDate;
        }
        $item->save();

        InventoryMovement::create([
            'company_id' => $purchase->company_id,
            'item_id' => $item->id,
            'movement_type' => InventoryMovement::TYPE_PURCHASE,
            'reference_type' => 'purchase',
            'reference_id' => $purchase->id,
            'reference_label' => $purchase->invoice_id,
            'location' => $purchase->location,
            'qty_before' => $qtyBefore,
            'qty_change' => $qty,
            'qty_after' => (float) $item->qty,
            'unit_cost' => $unitPrice > 0 ? $unitPrice : (float) ($item->purchase_price ?? 0),
            'notes' => 'Purchase main item stock (unbatched)',
            'user_id' => $user?->id,
        ]);

        $purchaseItem->expiry_date = $expiryDate;
        $purchaseItem->item_batch_id = null;
        $purchaseItem->save();
    }

    /**
     * Batch stock: purchase price or expiry differs from the item master.
     */
    private function addPurchaseBatchStock(
        Purchase $purchase,
        PurchaseItem $purchaseItem,
        Item $item,
        float $qty,
        float $unitPrice,
        ?string $expiryDate,
        ?User $user,
    ): void {
        $batchNumber = 'PUR-'.$purchase->id.'-'.$purchaseItem->id;

        $existingBatch = $this->findMergeablePurchaseBatch(
            $item->id,
            $purchase->location,
            $expiryDate,
            $unitPrice,
        );

        if ($existingBatch) {
            $oldBatchQty = (float) $existingBatch->qty;
            $existingBatch->qty = round($oldBatchQty + $qty, 2);
            if ($unitPrice > 0) {
                $existingBatch->purchase_price = $this->mergePurchasePrice(
                    $oldBatchQty,
                    (float) $existingBatch->purchase_price,
                    $qty,
                    $unitPrice,
                );
            }
            $existingBatch->save();
            $batch = $existingBatch;
        } else {
            $batch = ItemBatch::create([
                'company_id' => $purchase->company_id,
                'item_id' => $item->id,
                'batch_number' => $batchNumber,
                'location' => $purchase->location,
                'qty' => $qty,
                'purchase_price' => $unitPrice,
                'selling_price' => max(0, (float) ($item->selling_price ?? 0)),
                'expiry_date' => $expiryDate,
                'notes' => 'Purchase '.$purchase->invoice_id,
            ]);
        }

        $qtyBefore = (float) $item->qty;
        $item->qty = round($qtyBefore + $qty, 2);
        $item->save();

        InventoryMovement::create([
            'company_id' => $purchase->company_id,
            'item_id' => $item->id,
            'movement_type' => InventoryMovement::TYPE_PURCHASE,
            'reference_type' => 'purchase',
            'reference_id' => $purchase->id,
            'reference_label' => $purchase->invoice_id,
            'location' => $purchase->location,
            'qty_before' => $qtyBefore,
            'qty_change' => $qty,
            'qty_after' => (float) $item->qty,
            'unit_cost' => $unitPrice,
            'notes' => 'Purchase batch '.$batch->batch_number
                .($expiryDate ? ' exp '.$expiryDate : ' (no expiry)'),
            'user_id' => $user?->id,
        ]);

        $purchaseItem->expiry_date = $expiryDate;
        $purchaseItem->item_batch_id = $batch->id;
        $purchaseItem->save();

        $this->itemService->syncItemExpiryFromBatches($item->fresh());
    }

    private function matchesMainItemPurchase(Item $item, ?string $expiryDate, float $unitPrice): bool
    {
        $expiryDate = $this->normalizeExpiryDate($expiryDate);
        $mainExpiry = $item->expiry_date
            ? $this->normalizeExpiryDate($item->expiry_date->format('Y-m-d'))
            : null;

        if ($mainExpiry !== null && $mainExpiry < now()->toDateString()) {
            return false;
        }

        if (!$this->expiryDatesMatch($mainExpiry, $expiryDate)) {
            $unbatchedQty = $this->unbatchedQty($item);
            if ($mainExpiry === null && $unbatchedQty > 0.001 && $this->pricesMatchForMain($item, $unitPrice)) {
                $hasBatchStock = ItemBatch::query()
                    ->where('item_id', $item->id)
                    ->where('qty', '>', 0)
                    ->exists();
                if (!$hasBatchStock) {
                    return true;
                }
            }

            return false;
        }

        return $this->pricesMatchForMain($item, $unitPrice);
    }

    private function expiryDatesMatch(?string $mainExpiry, ?string $purchaseExpiry): bool
    {
        $a = $this->normalizeExpiryDate($mainExpiry);
        $b = $this->normalizeExpiryDate($purchaseExpiry);

        if ($a === null && $b === null) {
            return true;
        }

        if ($a === null || $b === null) {
            return false;
        }

        return $a === $b;
    }

    private function pricesMatchForMain(Item $item, float $unitPrice): bool
    {
        $mainPrice = (float) ($item->purchase_price ?? 0);
        if ($unitPrice <= 0) {
            return true;
        }

        return $this->pricesMatch($mainPrice, $unitPrice);
    }

    private function unbatchedQty(Item $item): float
    {
        $batchTotal = (float) ItemBatch::query()
            ->where('item_id', $item->id)
            ->where('qty', '>', 0)
            ->sum('qty');

        return round(max(0, (float) ($item->qty ?? 0) - $batchTotal), 2);
    }

    private function reverseBatchStock(int $companyId, int $batchId, float $qty, string $location): void
    {
        $batch = ItemBatch::where('company_id', $companyId)->where('id', $batchId)->first();
        if (!$batch) {
            return;
        }

        $item = Item::where('company_id', $companyId)->where('id', $batch->item_id)->first();
        if (!$item) {
            return;
        }

        $reverseQty = min((float) $batch->qty, $qty);
        if ($reverseQty <= 0) {
            return;
        }

        $batch->qty = round((float) $batch->qty - $reverseQty, 2);
        if ($batch->qty <= 0) {
            $batch->delete();
        } else {
            $batch->save();
        }

        $item->qty = round(max(0, (float) $item->qty - $reverseQty), 2);
        $item->save();

        $this->itemService->syncItemExpiryFromBatches($item->fresh());
    }

    private function normalizeExpiryDate(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if ($value instanceof \DateTimeInterface) {
            return Carbon::instance($value)->format('Y-m-d');
        }

        $trimmed = trim((string) $value);
        if ($trimmed === '') {
            return null;
        }

        try {
            return Carbon::parse($trimmed)->format('Y-m-d');
        } catch (\Throwable) {
            return $trimmed;
        }
    }

    /**
     * Merge purchase qty into an existing batch only when expiry and purchase price match.
     */
    private function findMergeablePurchaseBatch(
        int $itemId,
        string $location,
        ?string $expiryDate,
        float $unitPrice,
    ): ?ItemBatch {
        $query = ItemBatch::query()
            ->where('item_id', $itemId)
            ->where('location', $location)
            ->where('qty', '>', 0);

        if ($expiryDate !== null) {
            $query->where('expiry_date', $expiryDate);
        } else {
            $query->whereNull('expiry_date');
        }

        return $query->get()->first(function (ItemBatch $batch) use ($unitPrice) {
            if ($unitPrice <= 0) {
                return true;
            }

            return $this->pricesMatch((float) $batch->purchase_price, $unitPrice);
        });
    }

    private function pricesMatch(float $a, float $b): bool
    {
        return abs($a - $b) < 0.005;
    }

    private function mergePurchasePrice(float $oldQty, float $oldPrice, float $addQty, float $addPrice): float
    {
        if ($addPrice <= 0) {
            return $oldPrice;
        }

        $newQty = round($oldQty + $addQty, 2);
        if ($oldQty > 0) {
            return round((($oldQty * $oldPrice) + ($addQty * $addPrice)) / $newQty, 2);
        }

        return $addPrice;
    }
}
