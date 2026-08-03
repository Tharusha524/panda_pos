<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompanyNotificationSetting extends Model
{
    protected $fillable = [
        'company_id',
        'alerts_enabled',
        'send_email',
        'send_sms',
        'notify_owner',
        'notify_employees',
        'daily_digest',
        'last_broadcast_at',
        'smtp_host',
        'smtp_port',
        'smtp_username',
        'smtp_password',
        'smtp_encryption',
        'mail_from_address',
        'mail_from_name',
        'sms_api_url',
        'sms_api_key',
        'sms_provider',
    ];

    protected function casts(): array
    {
        return [
            'alerts_enabled' => 'boolean',
            'send_email' => 'boolean',
            'send_sms' => 'boolean',
            'notify_owner' => 'boolean',
            'notify_employees' => 'boolean',
            'daily_digest' => 'boolean',
            'last_broadcast_at' => 'datetime',
            'smtp_port' => 'integer',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
