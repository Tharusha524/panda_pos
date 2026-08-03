<?php

namespace App\Services;

use App\Models\Item;
use App\Models\ItemBatch;
use Illuminate\Support\Facades\DB;

/**
 * Main item expiry: unbatched stock keeps item.expiry_date until that date passes,
 * then stock is moved into an expired batch. Item master expiry then rolls via FEFO.
 */
class ItemExpirySyncService
{
    /**
     * After main item expiry has passed, move unbatched qty into a batch with that expiry.
     */
    public function promoteExpiredMainStockToBatch(Item $item): void
    {
        if (!$item->expiry_date) {
            return;
        }

        $expiryStr = $item->expiry_date->format('Y-m-d');
        $today = now()->toDateString();

        if ($expiryStr >= $today) {
            return;
        }

        DB::transaction(function () use ($item, $expiryStr) {
            $locked = Item::where('id', $item->id)->lockForUpdate()->first();
            if (!$locked || !$locked->expiry_date) {
                return;
            }

            $lockedExpiry = $locked->expiry_date->format('Y-m-d');
            if ($lockedExpiry !== $expiryStr) {
                return;
            }

            $batchTotal = (float) ItemBatch::query()
                ->where('item_id', $locked->id)
                ->where('qty', '>', 0)
                ->sum('qty');
            $unbatched = round(max(0, (float) $locked->qty - $batchTotal), 2);

            if ($unbatched <= 0) {
                $locked->expiry_date = null;
                $locked->save();

                return;
            }

            $purchasePrice = (float) ($locked->purchase_price ?? 0);
            $location = $locked->location;

            $existing = ItemBatch::query()
                ->where('item_id', $locked->id)
                ->where('location', $location)
                ->where('qty', '>', 0)
                ->whereDate('expiry_date', $expiryStr)
                ->get()
                ->first(fn (ItemBatch $batch) => abs((float) $batch->purchase_price - $purchasePrice) < 0.005);

            if ($existing) {
                $existing->qty = round((float) $existing->qty + $unbatched, 2);
                $existing->save();
            } else {
                ItemBatch::create([
                    'company_id' => $locked->company_id,
                    'item_id' => $locked->id,
                    'batch_number' => 'EXP-'.str_replace('-', '', $expiryStr).'-MAIN-'.now()->format('His'),
                    'location' => $location,
                    'qty' => $unbatched,
                    'purchase_price' => $purchasePrice,
                    'selling_price' => max(0, (float) ($locked->selling_price ?? 0)),
                    'expiry_date' => $expiryStr,
                    'notes' => 'Auto-moved from main stock after expiry',
                ]);
            }

            $locked->expiry_date = null;
            $locked->save();
        });
    }

    /**
     * Keeps item.expiry_date aligned with main unbatched stock or nearest in-stock batch (FEFO).
     */
    public function syncFromBatches(Item $item): void
    {
        $this->promoteExpiredMainStockToBatch($item);
        $item->refresh();

        $unbatchedQty = $this->unbatchedQty($item);

        // Main unbatched stock owns item.expiry_date — never copy batch expiry onto it.
        if ($unbatchedQty > 0.001) {
            return;
        }

        $today = now()->toDateString();

        $nearest = ItemBatch::query()
            ->where('item_id', $item->id)
            ->where('qty', '>', 0)
            ->whereNotNull('expiry_date')
            ->whereDate('expiry_date', '>=', $today)
            ->orderBy('expiry_date')
            ->orderBy('id')
            ->value('expiry_date');

        if ($nearest === null) {
            $nearest = ItemBatch::query()
                ->where('item_id', $item->id)
                ->where('qty', '>', 0)
                ->whereNotNull('expiry_date')
                ->orderBy('expiry_date')
                ->orderBy('id')
                ->value('expiry_date');
        }

        if ($nearest === null) {
            return;
        }

        $current = $item->expiry_date?->format('Y-m-d');
        $next = $nearest !== null ? (string) $nearest : null;

        if ($current === $next) {
            return;
        }

        $item->expiry_date = $nearest;
        $item->save();
    }

    private function unbatchedQty(Item $item): float
    {
        $batchTotal = (float) ItemBatch::query()
            ->where('item_id', $item->id)
            ->where('qty', '>', 0)
            ->sum('qty');

        return round(max(0, (float) ($item->qty ?? 0) - $batchTotal), 2);
    }
}
