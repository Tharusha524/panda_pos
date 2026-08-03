<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MobileDeviceProfile extends Model
{
    protected $fillable = [
        'user_id',
        'company_id',
        'device_id',
        'device_name',
        'brand',
        'model',
        'manufacturer',
        'platform',
        'os_version',
        'app_version',
        'private_ip',
        'public_ip',
        'permissions',
        'payload',
        'reported_at',
        'last_seen_at',
    ];

    protected $casts = [
        'permissions' => 'array',
        'payload' => 'array',
        'reported_at' => 'datetime',
        'last_seen_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
