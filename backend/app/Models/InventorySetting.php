<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventorySetting extends Model
{
    protected $fillable = [
        'user_id',
        'manage_multiple_locations',
        'costing_method',
        'allow_tog',
        'allow_request_for_quotation',
        'allow_inventory_location_filter',
    ];

    protected function casts(): array
    {
        return [
            'manage_multiple_locations' => 'boolean',
            'allow_tog' => 'boolean',
            'allow_request_for_quotation' => 'boolean',
            'allow_inventory_location_filter' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
