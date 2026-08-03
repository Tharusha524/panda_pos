<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RepairTransferItem extends Model
{
    protected $fillable = [
        'repair_transfer_id',
        'item_id',
        'item_number',
        'description',
        'qty',
    ];

    protected $casts = [
        'qty' => 'decimal:2',
    ];

    public function transfer(): BelongsTo
    {
        return $this->belongsTo(RepairTransfer::class, 'repair_transfer_id');
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }
}
