<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int|null $company_id
 * @property string|null $payment_type
 * @property string|null $location
 * @property Carbon $payment_date
 * @property string|null $sales_no
 * @property string|null $receipt_type
 * @property string|null $payment_method
 * @property string|null $cheque_number
 * @property string|null $bank_name
 * @property string|null $discount
 * @property string|null $paid_amount
 * @property string|null $notes
 */
class PosPayment extends Model
{
    protected $table = 'pos_payments';

    protected $fillable = [
        'company_id',
        'source_type',
        'source_id',
        'payment_type',
        'location',
        'payment_date',
        'sales_no',
        'receipt_type',
        'payment_method',
        'cheque_number',
        'bank_name',
        'discount',
        'paid_amount',
        'notes',
    ];

    protected $casts = [
        'payment_date' => 'date',
        'discount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
