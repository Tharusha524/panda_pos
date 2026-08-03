<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int|null $company_id
 * @property string|null $purchase_type
 * @property string|null $location
 * @property Carbon $purchase_date
 * @property string|null $invoice_id
 * @property int|null $supplier_id
 * @property string|null $supplier_name
 * @property int|null $returned_from_purchase_id
 * @property string|null $sub_total
 * @property string|null $discount
 * @property string|null $amount
 * @property string|null $net_terms
 * @property string|null $notes
 */
class Purchase extends Model
{
    protected $fillable = [
        'company_id',
        'purchase_type',
        'location',
        'purchase_date',
        'invoice_id',
        'supplier_id',
        'supplier_name',
        'returned_from_purchase_id',
        'sub_total',
        'discount',
        'amount',
        'payment_method',
        'bank_id',
        'cheque_number',
        'net_terms',
        'notes',
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'sub_total' => 'decimal:2',
        'discount' => 'decimal:2',
        'amount' => 'decimal:2',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseItem::class);
    }
}
