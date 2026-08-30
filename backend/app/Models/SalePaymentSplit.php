<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalePaymentSplit extends Model
{
    protected $fillable = [
        'sale_id',
        'payment_method',
        'amount',
        'cheque_number',
        'bank_name',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }
}
