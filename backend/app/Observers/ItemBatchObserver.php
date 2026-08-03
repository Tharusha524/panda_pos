<?php

namespace App\Observers;

use App\Models\Item;
use App\Models\ItemBatch;
use App\Services\ItemExpirySyncService;

class ItemBatchObserver
{
    public function __construct(private ItemExpirySyncService $itemExpirySyncService)
    {
    }

    public function saved(ItemBatch $batch): void
    {
        $this->syncParentItem($batch);
    }

    public function deleted(ItemBatch $batch): void
    {
        $this->syncParentItem($batch);
    }

    private function syncParentItem(ItemBatch $batch): void
    {
        if (!$batch->item_id) {
            return;
        }

        $item = Item::find($batch->item_id);
        if ($item) {
            $this->itemExpirySyncService->syncFromBatches($item);
        }
    }
}
