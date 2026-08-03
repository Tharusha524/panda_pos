<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerNotificationSetting extends Model
{
    protected $fillable = [
        'user_id',
        'sales_enabled',
        'sales_send_email',
        'sales_send_sms',
        'sales_email_subject',
        'sales_email_body',
        'sales_sms_template',
        'payment_enabled',
        'payment_send_email',
        'payment_send_sms',
        'payment_email_subject',
        'payment_email_body',
        'payment_sms_template',
    ];

    protected function casts(): array
    {
        return [
            'sales_enabled' => 'boolean',
            'sales_send_email' => 'boolean',
            'sales_send_sms' => 'boolean',
            'payment_enabled' => 'boolean',
            'payment_send_email' => 'boolean',
            'payment_send_sms' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
