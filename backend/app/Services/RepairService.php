<?php

namespace App\Services;

use App\Models\Item;
use App\Models\RepairTransfer;
use App\Models\RepairTransferItem;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\DB;

class RepairService
{
    public const REPAIR_LOCATION = LocationService::REPAIR_LOCATION;

    public function __construct(
        private CompanySettingService $companySettingService,
        private LocationService $locationService,
    ) {
    }

    public function getDashboardForUser(User $user, ?string $location = null): array
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $companyId = $company->id;
        $settings = app(InventorySettingService::class)->getForUser($user);

        $repairLocation = $this->resolveRepairLocation($user, $location);
        $costingMethod = $settings['costing_method'] ?? 'FIFO';

        $query = Item::where('company_id', $companyId)
            ->where('location', $repairLocation)
            ->where('is_active', true);

        $items = $query
            ->orderBy('item_number')
            ->get()
            ->map(fn (Item $item) => $this->formatRepairItem($item, $costingMethod));

        $storedLocations = Item::where('company_id', $companyId)
            ->distinct()
            ->pluck('location')
            ->filter()
            ->values()
            ->all();

        $locations = $this->locationService->getOptionsForCompany(
            $companyId,
            array_merge($storedLocations, [self::REPAIR_LOCATION]),
            (bool) ($settings['manage_multiple_locations'] ?? true)
        );

        if (!in_array(self::REPAIR_LOCATION, $locations, true)) {
            $locations[] = self::REPAIR_LOCATION;
        }

        return [
            'items' => $items,
            'summary' => [
                'total_items' => $items->count(),
                'total_qty' => round((float) $items->sum('qty'), 2),
                'total_value' => round((float) $items->sum('inventory_value'), 2),
            ],
            'filters' => [
                'locations' => array_values(array_unique($locations)),
                'repair_location' => self::REPAIR_LOCATION,
            ],
            'selected_location' => $repairLocation,
        ];
    }

    public function searchItemsForUser(User $user, string $search, string $fromLocation): array
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $from = $this->locationService->assertValidForUser($user, $fromLocation);
        $term = trim($search);

        if ($term === '') {
            return ['items' => []];
        }

        $settings = app(InventorySettingService::class)->getForUser($user);
        $costingMethod = $settings['costing_method'] ?? 'FIFO';

        $items = Item::where('company_id', $company->id)
            ->where('location', $from)
            ->where('is_active', true)
            ->where('track_with_inventory', true)
            ->where('qty', '>', 0)
            ->where(function ($q) use ($term) {
                $q->where('item_number', 'like', '%'.$term.'%')
                    ->orWhere('description', 'like', '%'.$term.'%');
            })
            ->orderBy('item_number')
            ->limit(25)
            ->get()
            ->map(fn (Item $item) => $this->formatRepairItem($item, $costingMethod));

        return ['items' => $items];
    }

    public function getTransferContextForUser(User $user, string $type): array
    {
        $settings = app(InventorySettingService::class)->getForUser($user);
        $company = $this->companySettingService->getCompanyForUser($user);

        $storedLocations = Item::where('company_id', $company->id)
            ->distinct()
            ->pluck('location')
            ->filter()
            ->values()
            ->all();

        $locations = $this->locationService->getOptionsForCompany(
            $company->id,
            array_merge($storedLocations, [self::REPAIR_LOCATION]),
            (bool) ($settings['manage_multiple_locations'] ?? true)
        );

        if (!in_array(self::REPAIR_LOCATION, $locations, true)) {
            $locations[] = self::REPAIR_LOCATION;
        }

        $serviceCenters = array_values(array_filter(
            $locations,
            fn (string $loc) => $loc !== self::REPAIR_LOCATION
        ));

        if ($type === RepairTransfer::TYPE_SEND) {
            $branches = $serviceCenters ?: [LocationService::MAIN_LOCATION];

            return [
                'from_location' => $branches[0],
                'from_locations' => $branches,
                'to_location' => self::REPAIR_LOCATION,
                'to_locations' => [self::REPAIR_LOCATION],
            ];
        }

        $branches = $serviceCenters ?: [LocationService::MAIN_LOCATION];

        return [
            'from_location' => self::REPAIR_LOCATION,
            'from_locations' => [self::REPAIR_LOCATION],
            'to_location' => $branches[0],
            'to_locations' => $branches,
        ];
    }

    public function executeTransferForUser(User $user, array $data): array
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $type = strtolower(trim((string) ($data['transfer_type'] ?? '')));

        if (!in_array($type, [RepairTransfer::TYPE_SEND, RepairTransfer::TYPE_RECEIVE], true)) {
            throw new Exception('Invalid transfer type.');
        }

        $fromLocation = $this->locationService->assertValidForUser($user, $data['from_location'] ?? null);
        $toLocation = $this->locationService->assertValidForUser($user, $data['to_location'] ?? null);

        if ($fromLocation === $toLocation) {
            throw new Exception('From and To locations must be different.');
        }

        if ($type === RepairTransfer::TYPE_SEND) {
            if ($toLocation !== self::REPAIR_LOCATION) {
                throw new Exception('Send to repair must move items into the Repair location.');
            }
            if ($fromLocation === self::REPAIR_LOCATION) {
                throw new Exception('Send to repair must start from a store branch, not Repair.');
            }
        } else {
            if ($fromLocation !== self::REPAIR_LOCATION) {
                throw new Exception('Receive from repair must start at the Repair location.');
            }
            if ($toLocation === self::REPAIR_LOCATION) {
                throw new Exception('Receive from repair must return items to a store branch.');
            }
        }

        $lines = $data['lines'] ?? [];
        if (!is_array($lines) || $lines === []) {
            throw new Exception('Add at least one item to transfer.');
        }

        $transferDate = $data['transfer_date'] ?? now()->toDateString();

        return DB::transaction(function () use ($user, $company, $type, $fromLocation, $toLocation, $lines, $transferDate) {
            $transfer = RepairTransfer::create([
                'company_id' => $company->id,
                'transfer_type' => $type,
                'from_location' => $fromLocation,
                'to_location' => $toLocation,
                'transfer_date' => $transferDate,
                'created_by' => $user->id,
            ]);

            $transferred = [];

            foreach ($lines as $line) {
                $itemId = (int) ($line['item_id'] ?? 0);
                $qty = round((float) ($line['qty'] ?? 0), 2);

                if ($itemId <= 0 || $qty <= 0) {
                    throw new Exception('Each line needs a valid item and quantity.');
                }

                $source = Item::where('company_id', $company->id)
                    ->where('id', $itemId)
                    ->where('location', $fromLocation)
                    ->first();

                if (!$source) {
                    throw new Exception('Item not found at the source location.');
                }

                if (!($source->track_with_inventory ?? true)) {
                    throw new Exception("Item {$source->item_number} is not tracked with inventory.");
                }

                if ((float) $source->qty < $qty) {
                    throw new Exception("Insufficient qty for {$source->item_number} at {$fromLocation}.");
                }

                $this->moveItemQty($source, $toLocation, $qty);

                RepairTransferItem::create([
                    'repair_transfer_id' => $transfer->id,
                    'item_id' => $source->id,
                    'item_number' => $source->item_number,
                    'description' => $source->description,
                    'qty' => $qty,
                ]);

                $transferred[] = [
                    'item_number' => $source->item_number,
                    'description' => $source->description,
                    'qty' => $qty,
                    'from_location' => $fromLocation,
                    'to_location' => $toLocation,
                ];
            }

            return [
                'transfer_id' => $transfer->id,
                'transfer_type' => $type,
                'from_location' => $fromLocation,
                'to_location' => $toLocation,
                'lines' => $transferred,
            ];
        });
    }

    private function moveItemQty(Item $source, string $toLocation, float $qty): void
    {
        $source->qty = round((float) $source->qty - $qty, 2);
        if ($source->qty < 0) {
            throw new Exception("Insufficient qty for {$source->item_number}.");
        }
        $source->save();

        $destination = $this->locationService->resolveStockItemAtLocation($source, $toLocation);
        $destination->qty = round((float) $destination->qty + $qty, 2);
        $destination->save();
    }

    private function resolveRepairLocation(User $user, ?string $location): string
    {
        if ($location && $location !== 'all') {
            return $this->locationService->assertValidForUser($user, $location);
        }

        return self::REPAIR_LOCATION;
    }

    private function formatRepairItem(Item $item, string $costingMethod = 'FIFO'): array
    {
        $qty = (float) ($item->qty ?? 0);
        $purchasePrice = (float) ($item->purchase_price ?? 0);
        $sellingPrice = (float) ($item->selling_price ?? 0);
        $unitCost = strtoupper($costingMethod) === 'LIFO' && $purchasePrice > 0
            ? $purchasePrice
            : $purchasePrice;

        return [
            'id' => $item->id,
            'item_number' => $item->item_number,
            'description' => $item->description,
            'category' => $item->category,
            'sub_category' => $item->sub_category,
            'location' => $item->location,
            'qty' => $qty,
            'purchase_price' => $purchasePrice,
            'last_purchase_price' => $purchasePrice,
            'selling_price' => $sellingPrice,
            'unit_cost' => $unitCost,
            'inventory_value' => round($qty * $unitCost, 2),
            'uom' => $item->uom ?? 'pcs',
            'is_active' => (bool) $item->is_active,
        ];
    }
}
