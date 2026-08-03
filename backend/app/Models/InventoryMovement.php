<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryMovement extends Model
{
    public const TYPE_ADJUSTMENT = 'adjustment';

    public const TYPE_WRITE_OFF = 'write_off';

    public const TYPE_PURCHASE = 'purchase';

    public const TYPE_SALE = 'sale';

    public const TYPE_OPENING = 'opening';

    protected $fillable = [
        'company_id',
        'item_id',
        'movement_type',
        'reference_type',
        'reference_id',
        'reference_label',
        'location',
        'qty_before',
        'qty_change',
        'qty_after',
        'unit_cost',
        'notes',
        'user_id',
    ];

    protected $casts = [
        'qty_before' => 'decimal:2',
        'qty_change' => 'decimal:2',
        'qty_after' => 'decimal:2',
        'unit_cost' => 'decimal:2',
    ];

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
