<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalePaymentAllocation extends Model
{
    protected $fillable = [
        'sale_id',
        'pos_payment_id',
        'amount',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(PosPayment::class, 'pos_payment_id');
    }
}
