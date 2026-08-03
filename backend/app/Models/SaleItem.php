<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleItem extends Model
{
    protected $fillable = [
        'sale_id',
        'item_id',
        'item_number',
        'description',
        'qty',
        'unit_price',
        'line_total',
        'imei_serial',
        'batch_id',
        'item_batch_id',
        'secondary_uom',
        'secondary_uom_qty',
        'additional_details',
        'purchase_price',
    ];

    protected $casts = [
        'qty' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'line_total' => 'decimal:2',
        'secondary_uom_qty' => 'decimal:2',
        'purchase_price' => 'decimal:2',
    ];

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }
}
