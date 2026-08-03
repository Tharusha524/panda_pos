<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApiSetting extends Model
{
    protected $fillable = [
        'user_id',
        'api_enabled',
        'public_base_url',
        'integration_api_key',
        'webhook_enabled',
        'webhook_url',
        'webhook_secret',
        'cors_allowed_origins',
        'mobile_sync_enabled',
        'mobile_sync_interval_seconds',
        'sms_api_url',
        'sms_api_key',
        'payment_gateway',
        'payment_gateway_key',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'api_enabled' => 'boolean',
            'webhook_enabled' => 'boolean',
            'mobile_sync_enabled' => 'boolean',
            'mobile_sync_interval_seconds' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
