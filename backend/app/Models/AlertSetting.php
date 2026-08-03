<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AlertSetting extends Model
{
    protected $fillable = [
        'user_id',
        'expiry_alert_period_days',
        'cheque_alert_period_days',
        'staff_notify_email',
        'staff_notify_phone',
        'staff_send_email',
        'staff_send_sms',
        'staff_daily_digest',
        'staff_last_notified_at',
    ];

    protected function casts(): array
    {
        return [
            'expiry_alert_period_days' => 'integer',
            'cheque_alert_period_days' => 'integer',
            'staff_send_email' => 'boolean',
            'staff_send_sms' => 'boolean',
            'staff_daily_digest' => 'boolean',
            'staff_last_notified_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
