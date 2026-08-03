<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Customer;
use App\Models\Expense;
use App\Models\Item;
use App\Models\ItemBatch;
use App\Models\PosPayment;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\Supplier;
use App\Models\User;
use Exception;

class LocationService
{
    public const MAIN_LOCATION = 'Main Location';

    public const REPAIR_LOCATION = 'Repair';

    public function __construct(
        private CompanySettingService $companySettingService,
        private InventorySettingService $inventorySettingService,
        private ItemExpirySyncService $itemExpirySyncService,
    ) {
    }

    public function normalize(?string $location): string
    {
        $value = trim((string) ($location ?? ''));

        return $value !== '' ? $value : self::MAIN_LOCATION;
    }

    /**
     * @param  string[]  $extraLocations
     * @return string[]
     */
    public function getOptionsForCompany(int $companyId, array $extraLocations = [], bool $manageMultiple = true): array
    {
        if (!$manageMultiple) {
            return [self::MAIN_LOCATION];
        }

        $branchNames = Branch::where('company_id', $companyId)
            ->where('is_active', true)
            ->orderBy('name')
            ->pluck('name')
            ->all();

        $merged = array_merge(
            [self::MAIN_LOCATION],
            $branchNames,
            array_map(fn ($loc) => $this->normalize($loc), $extraLocations)
        );

        return array_values(array_unique(array_filter($merged)));
    }

    public function getOptionsForUser(User $user, array $extraLocations = []): array
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $settings = $this->inventorySettingService->getForUser($user);

        return $this->getOptionsForCompany(
            $company->id,
            $extraLocations,
            (bool) ($settings['manage_multiple_locations'] ?? true)
        );
    }

    public function assertValidForCompany(int $companyId, ?string $location, bool $manageMultiple = true): string
    {
        $normalized = $this->normalize($location);

        if ($normalized === self::REPAIR_LOCATION) {
            return self::REPAIR_LOCATION;
        }

        if (!$manageMultiple) {
            return self::MAIN_LOCATION;
        }

        $options = $this->getOptionsForCompany($companyId, [$normalized], true);

        if (!in_array($normalized, $options, true)) {
            throw new Exception(
                'Invalid branch/location. Add the branch under Settings → Company → Branch Management, then select it.'
            );
        }

        return $normalized;
    }

    public function assertValidForUser(User $user, ?string $location): string
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $settings = $this->inventorySettingService->getForUser($user);

        return $this->assertValidForCompany(
            $company->id,
            $location,
            (bool) ($settings['manage_multiple_locations'] ?? true)
        );
    }

    /**
     * Resolve stock row for a branch: same item_number at target location, or duplicate row when missing.
     */
    public function resolveStockItemAtLocation(Item $sourceItem, string $targetLocation): Item
    {
        $targetLocation = $this->normalize($targetLocation);

        if ($sourceItem->location === $targetLocation) {
            return $sourceItem;
        }

        $existing = Item::where('company_id', $sourceItem->company_id)
            ->where('item_number', $sourceItem->item_number)
            ->where('location', $targetLocation)
            ->first();

        if ($existing) {
            return $existing;
        }

        $attrs = $sourceItem->only([
            'company_id',
            'description',
            'category',
            'sub_category',
            'product_type',
            'selling_price',
            'wholesale_price',
            'purchase_price',
            'is_active',
            'track_with_inventory',
            'image_path',
            'item_category_id',
            'item_sub_category_id',
            'default_discount',
            'default_discount_type',
            'max_discount',
            'uom',
            'item_code',
            'sku',
        ]);

        return Item::create(array_merge($attrs, [
            'item_number' => $sourceItem->item_number,
            'location' => $targetLocation,
            'qty' => 0,
        ]));
    }

    /**
     * Increase branch stock (purchase, or restore after sale delete/edit).
     *
     * @param  array<int, array{item_id: ?int, qty: float, unit_price?: float, inventory_location?: string|null}>  $lines
     */
    public function addStockForLines(int $companyId, array $lines, string $branchLocation): void
    {
        $branchLocation = $this->normalize($branchLocation);

        foreach ($lines as $line) {
            if (empty($line['item_id'])) {
                continue;
            }
            $source = Item::where('company_id', $companyId)->where('id', $line['item_id'])->first();
            if (!$source || !($source->track_with_inventory ?? true)) {
                continue;
            }

            $lineLocation = $this->normalize(
                $line['inventory_location'] ?? $branchLocation
            );

            $item = $this->resolveStockItemAtLocation($source, $lineLocation);

            if (!empty($line['item_batch_id'])) {
                $this->restoreStockToBatch($item, (int) $line['item_batch_id'], (float) $line['qty']);
                if (isset($line['unit_price'])) {
                    $item->purchase_price = $line['unit_price'];
                    $item->save();
                }
                continue;
            }

            $item->qty = (float) ($item->qty ?? 0) + (float) $line['qty'];
            if (isset($line['unit_price'])) {
                $item->purchase_price = $line['unit_price'];
            }
            $item->save();
        }
    }

    /**
     * Decrease branch stock (sale, or reverse a purchase on delete/edit).
     *
     * @param  array<int, array{item_id: ?int, qty: float, inventory_location?: string|null}>  $lines
     */
    public function removeStockForLines(
        int $companyId,
        array $lines,
        string $branchLocation,
        bool $allowNegativeInventory = false,
    ): void {
        $branchLocation = $this->normalize($branchLocation);

        foreach ($lines as $line) {
            if (empty($line['item_id'])) {
                continue;
            }
            $source = Item::where('company_id', $companyId)->where('id', $line['item_id'])->first();
            if (!$source || !($source->track_with_inventory ?? true)) {
                continue;
            }

            $lineLocation = $this->normalize(
                $line['inventory_location'] ?? $branchLocation
            );

            $item = $source->location === $lineLocation
                ? $source
                : Item::where('company_id', $companyId)
                    ->where('item_number', $source->item_number)
                    ->where('location', $lineLocation)
                    ->first();

            if (!$item) {
                if ($allowNegativeInventory) {
                    $item = $this->resolveStockItemAtLocation($source, $lineLocation);
                } else {
                    throw new Exception(
                        "Item {$source->item_number} has no stock record at {$lineLocation}."
                    );
                }
            }

            $deduct = (float) $line['qty'];
            if (!empty($line['item_batch_id'])) {
                $this->deductFromSpecificBatch($item, (int) $line['item_batch_id'], $deduct, $allowNegativeInventory);
            } else {
                $this->deductStockFefo($item, $deduct, $allowNegativeInventory);
            }
        }
    }

    private function deductFromSpecificBatch(
        Item $item,
        int $batchId,
        float $qtyToDeduct,
        bool $allowNegative = false,
    ): void {
        if ($qtyToDeduct <= 0) {
            return;
        }

        $current = (float) ($item->qty ?? 0);
        if (!$allowNegative && $current < $qtyToDeduct) {
            throw new Exception(
                "Insufficient stock for {$item->item_number} at {$item->location}. "
                ."Available: {$current}, required: {$qtyToDeduct}."
            );
        }

        $batch = ItemBatch::query()
            ->where('item_id', $item->id)
            ->where('id', $batchId)
            ->lockForUpdate()
            ->first();

        if (!$batch) {
            throw new Exception("Batch not found for {$item->item_number}.");
        }

        $batchQty = (float) $batch->qty;
        if (!$allowNegative && $batchQty < $qtyToDeduct) {
            throw new Exception(
                "Insufficient batch stock for {$item->item_number} (batch {$batch->batch_number}). "
                ."Available: {$batchQty}, required: {$qtyToDeduct}."
            );
        }

        $batch->qty = $allowNegative
            ? round($batchQty - $qtyToDeduct, 2)
            : round(max(0, $batchQty - $qtyToDeduct), 2);
        $this->saveOrDeleteEmptyBatch($batch);

        $item->qty = $allowNegative
            ? round($current - $qtyToDeduct, 2)
            : round(max(0, $current - $qtyToDeduct), 2);
        $item->save();

        $this->syncItemExpiryFromBatches($item->fresh());
    }

    private function restoreStockToBatch(Item $item, int $batchId, float $qtyToRestore): void
    {
        if ($qtyToRestore <= 0) {
            return;
        }

        $batch = ItemBatch::query()
            ->where('item_id', $item->id)
            ->where('id', $batchId)
            ->lockForUpdate()
            ->first();

        if ($batch) {
            $batch->qty = round((float) $batch->qty + $qtyToRestore, 2);
            $batch->save();
        }

        $item->qty = round((float) ($item->qty ?? 0) + $qtyToRestore, 2);
        $item->save();

        $this->syncItemExpiryFromBatches($item->fresh());
    }

    /**
     * Sell nearest-expiry batches first (FEFO). Batches without expiry sell after dated batches.
     */
    private function deductStockFefo(Item $item, float $qtyToDeduct, bool $allowNegative = false): void
    {
        if ($qtyToDeduct <= 0) {
            return;
        }

        $current = (float) ($item->qty ?? 0);
        if (!$allowNegative && $current < $qtyToDeduct) {
            throw new Exception(
                "Insufficient stock for {$item->item_number} at {$item->location}. "
                ."Available: {$current}, required: {$qtyToDeduct}."
            );
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

        $batchTotal = (float) $batches->sum('qty');
        $unbatchedQty = round(max(0, $current - $batchTotal), 2);

        // Main (unbatched) stock is sold first; then consume dated batches by FEFO.
        $remaining = round(max(0, $qtyToDeduct - $unbatchedQty), 2);

        foreach ($batches as $batch) {
            if ($remaining <= 0) {
                break;
            }

            $batchQty = (float) $batch->qty;
            $take = min($batchQty, $remaining);
            $batch->qty = round($batchQty - $take, 2);
            $this->saveOrDeleteEmptyBatch($batch);
            $remaining = round($remaining - $take, 2);
        }

        $item->qty = $allowNegative
            ? round($current - $qtyToDeduct, 2)
            : round(max(0, $current - $qtyToDeduct), 2);
        $item->save();

        $this->syncItemExpiryFromBatches($item->fresh());
    }

    private function saveOrDeleteEmptyBatch(ItemBatch $batch): void
    {
        if ((float) $batch->qty <= 0) {
            $batch->delete();

            return;
        }

        $batch->save();
    }

    private function syncItemExpiryFromBatches(Item $item): void
    {
        $this->itemExpirySyncService->syncFromBatches($item);
    }

    public function branchNameInUse(int $companyId, string $branchName): bool
    {
        $checks = [
            [Item::class, 'location'],
            [Sale::class, 'location'],
            [Purchase::class, 'location'],
            [Expense::class, 'location'],
            [PosPayment::class, 'location'],
            [Supplier::class, 'location'],
            [Customer::class, 'inventory_location'],
            [Customer::class, 'location'],
        ];

        foreach ($checks as [$model, $column]) {
            if ($model::where('company_id', $companyId)->where($column, $branchName)->exists()) {
                return true;
            }
        }

        return false;
    }
}
