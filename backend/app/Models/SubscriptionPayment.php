<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int|null $subscription_id
 * @property Carbon $paid_at
 * @property string|null $card_type
 * @property string|null $card_last_four
 * @property string|null $amount
 * @property string|null $payment_method
 */
class SubscriptionPayment extends Model
{
    protected $fillable = [
        'subscription_id',
        'paid_at',
        'card_type',
        'card_last_four',
        'amount',
        'payment_method',
    ];

    protected function casts(): array
    {
        return [
            'paid_at' => 'date',
            'amount' => 'decimal:2',
        ];
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }
}
