<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int|null $company_id
 * @property string|null $location
 * @property Carbon $expense_date
 * @property string|null $reference_no
 * @property string|null $category
 * @property string|null $description
 * @property string|null $amount
 * @property string|null $discount
 * @property string|null $payment_method
 * @property string|null $status
 * @property string|null $notes
 */
class Expense extends Model
{
    protected $fillable = [
        'company_id',
        'location',
        'expense_date',
        'reference_no',
        'category',
        'description',
        'amount',
        'discount',
        'payment_method',
        'status',
        'notes',
    ];

    protected $casts = [
        'expense_date' => 'date',
        'amount' => 'decimal:2',
        'discount' => 'decimal:2',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
