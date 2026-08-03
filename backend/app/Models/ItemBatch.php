<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ItemBatch extends Model
{
    protected $fillable = [
        'company_id',
        'item_id',
        'batch_number',
        'location',
        'qty',
        'purchase_price',
        'selling_price',
        'expiry_date',
        'notes',
    ];

    protected $casts = [
        'qty' => 'decimal:2',
        'purchase_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'expiry_date' => 'date',
    ];

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }
}
