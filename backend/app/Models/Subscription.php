<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int|null $company_id
 * @property int|null $cloud_id
 * @property string|null $product_name
 * @property int|null $license_count
 * @property Carbon $period_start
 * @property Carbon $period_end
 * @property string|null $monthly_charge
 * @property Carbon $next_payment_date
 * @property string|null $status
 * @property-read \Illuminate\Database\Eloquent\Collection<int, SubscriptionPayment> $payments
 */
class Subscription extends Model
{
    protected $fillable = [
        'company_id',
        'cloud_id',
        'product_name',
        'license_count',
        'period_start',
        'period_end',
        'monthly_charge',
        'next_payment_date',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'cloud_id' => 'integer',
            'license_count' => 'integer',
            'period_start' => 'date',
            'period_end' => 'date',
            'next_payment_date' => 'date',
            'monthly_charge' => 'decimal:2',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(SubscriptionPayment::class);
    }
}
