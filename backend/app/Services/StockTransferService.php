<?php

namespace App\Services;

use App\Models\Item;
use App\Models\StockTransfer;
use App\Models\StockTransferItem;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\DB;

/**
 * Generic stock transfer between any two locations for a company — e.g.
 * loading a "Lorry" branch with stock from Main Location before a delivery
 * run, and moving what's left back afterwards. Unlike RepairService, either
 * side can be any branch; there's no fixed "Repair" endpoint.
 */
class StockTransferService
{
    public function __construct(
        private CompanySettingService $companySettingService,
        private LocationService $locationService,
        private InventorySettingService $inventorySettingService,
    ) {
    }

    public function getContextForUser(User $user): array
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $settings = $this->inventorySettingService->getForUser($user);

        $storedLocations = Item::where('company_id', $company->id)
            ->distinct()
            ->pluck('location')
            ->filter()
            ->values()
            ->all();

        $locations = $this->locationService->getOptionsForCompany(
            $company->id,
            $storedLocations,
            (bool) ($settings['manage_multiple_locations'] ?? true)
        );

        return ['locations' => array_values(array_unique($locations))];
    }

    public function searchItemsForUser(User $user, string $search, string $fromLocation, ?string $toLocation = null): array
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $from = $this->locationService->assertValidForUser($user, $fromLocation);
        $to = $toLocation ? $this->locationService->assertValidForUser($user, $toLocation) : null;
        $term = trim($search);

        // Empty term = browse: list everything in stock at this location
        // (e.g. clicking into the search box), same result shape as a
        // filtered search — just no where() narrowing it down.
        $items = Item::where('company_id', $company->id)
            ->where('location', $from)
            ->where('is_active', true)
            ->where('track_with_inventory', true)
            ->where('qty', '>', 0)
            ->when($term !== '', fn ($q) => $q->where(function ($q2) use ($term) {
                $q2->where('item_number', 'like', '%'.$term.'%')
                    ->orWhere('description', 'like', '%'.$term.'%');
            }))
            ->orderBy('item_number')
            ->limit($term === '' ? 100 : 25)
            ->get();

        // Current qty at the destination too, so the UI can show a live
        // before/after preview for both sides while the user is still
        // staging quantities — not just after the transfer completes.
        $toQtyByItemNumber = [];
        if ($to) {
            $toQtyByItemNumber = Item::where('company_id', $company->id)
                ->where('location', $to)
                ->whereIn('item_number', $items->pluck('item_number'))
                ->pluck('qty', 'item_number');
        }

        return ['items' => $items->map(
            fn (Item $item) => $this->formatItem($item, (float) ($toQtyByItemNumber[$item->item_number] ?? 0))
        )];
    }

    public function executeTransferForUser(User $user, array $data): array
    {
        $company = $this->companySettingService->getCompanyForUser($user);

        $fromLocation = $this->locationService->assertValidForUser($user, $data['from_location'] ?? null);
        $toLocation = $this->locationService->assertValidForUser($user, $data['to_location'] ?? null);

        if ($fromLocation === $toLocation) {
            throw new Exception('From and To locations must be different.');
        }

        $lines = $data['lines'] ?? [];
        if (!is_array($lines) || $lines === []) {
            throw new Exception('Add at least one item to transfer.');
        }

        $transferDate = $data['transfer_date'] ?? now()->toDateString();
        $notes = isset($data['notes']) ? trim((string) $data['notes']) : null;

        return DB::transaction(function () use ($user, $company, $fromLocation, $toLocation, $lines, $transferDate, $notes) {
            $transfer = StockTransfer::create([
                'company_id' => $company->id,
                'from_location' => $fromLocation,
                'to_location' => $toLocation,
                'transfer_date' => $transferDate,
                'notes' => $notes ?: null,
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

                $movement = $this->moveItemQty($source, $toLocation, $qty);

                StockTransferItem::create([
                    'stock_transfer_id' => $transfer->id,
                    'item_id' => $source->id,
                    'item_number' => $source->item_number,
                    'description' => $source->description,
                    'qty' => $qty,
                ]);

                $transferred[] = [
                    'item_number' => $source->item_number,
                    'description' => $source->description,
                    'qty' => $qty,
                    'from_before' => $movement['from_before'],
                    'from_after' => $movement['from_after'],
                    'to_before' => $movement['to_before'],
                    'to_after' => $movement['to_after'],
                ];
            }

            return [
                'transfer_id' => $transfer->id,
                'from_location' => $fromLocation,
                'to_location' => $toLocation,
                'transfer_date' => $transfer->transfer_date->format('Y-m-d'),
                'lines' => $transferred,
            ];
        });
    }

    /**
     * @return array{from_before: float, from_after: float, to_before: float, to_after: float}
     */
    private function moveItemQty(Item $source, string $toLocation, float $qty): array
    {
        $fromBefore = round((float) $source->qty, 2);
        $source->qty = round($fromBefore - $qty, 2);
        if ($source->qty < 0) {
            throw new Exception("Insufficient qty for {$source->item_number}.");
        }
        $source->save();

        $destination = $this->locationService->resolveStockItemAtLocation($source, $toLocation);
        $toBefore = round((float) $destination->qty, 2);
        $destination->qty = round($toBefore + $qty, 2);
        $destination->save();

        return [
            'from_before' => $fromBefore,
            'from_after' => (float) $source->qty,
            'to_before' => $toBefore,
            'to_after' => (float) $destination->qty,
        ];
    }

    private function formatItem(Item $item, ?float $toQty = null): array
    {
        return [
            'id' => $item->id,
            'item_number' => $item->item_number,
            'description' => $item->description,
            'location' => $item->location,
            'qty' => (float) ($item->qty ?? 0),
            'to_qty' => $toQty,
            'selling_price' => (float) ($item->selling_price ?? 0),
            'uom' => $item->uom ?? 'pcs',
        ];
    }
}
