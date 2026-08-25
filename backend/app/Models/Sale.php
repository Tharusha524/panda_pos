<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sale extends Model
{
    protected $fillable = [
        'company_id',
        'transaction_type',
        'order_status',
        'sales_type',
        'pricing_mode',
        'location',
        'sale_date',
        'sales_id',
        'customer_id',
        'customer_name',
        'returned_from_sale_id',
        'sub_total',
        'return_sub_total',
        'discount',
        'vat_amount',
        'vat_rate_id',
        'service_charge',
        'card_payment_charge',
        'net_amount',
        'amount_received',
        'bank_id',
        'cheque_number',
        'payment_method',
        'offer_applied',
        'offer_id',
        'offer_promo_code',
        'refund_card_last4',
        'notes',
    ];

    protected $casts = [
        'sale_date' => 'date',
        'sub_total' => 'decimal:2',
        'return_sub_total' => 'decimal:2',
        'discount' => 'decimal:2',
        'vat_amount' => 'decimal:2',
        'service_charge' => 'decimal:2',
        'card_payment_charge' => 'decimal:2',
        'net_amount' => 'decimal:2',
        'amount_received' => 'decimal:2',
        'offer_applied' => 'boolean',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function bank(): BelongsTo
    {
        return $this->belongsTo(Bank::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function paymentAllocations(): HasMany
    {
        return $this->hasMany(SalePaymentAllocation::class);
    }

    public function offer(): BelongsTo
    {
        return $this->belongsTo(Offer::class);
    }
}
