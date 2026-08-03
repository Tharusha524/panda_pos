<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Shipment extends Model
{
    protected $fillable = [
        'company_id',
        'location',
        'shipment_no',
        'sale_id',
        'sales_id',
        'customer_id',
        'customer_name',
        'shipment_date',
        'destination',
        'estimated_delivery_date',
        'weight',
        'freight_cost',
        'invoice_cost',
        'bsl_number',
        'us_lot_number',
        'status',
        'notes',
    ];

    protected $casts = [
        'shipment_date' => 'date',
        'estimated_delivery_date' => 'date',
        'weight' => 'decimal:2',
        'freight_cost' => 'decimal:2',
        'invoice_cost' => 'decimal:2',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
