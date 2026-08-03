<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RepairTransfer extends Model
{
    public const TYPE_SEND = 'send';

    public const TYPE_RECEIVE = 'receive';

    protected $fillable = [
        'company_id',
        'transfer_type',
        'from_location',
        'to_location',
        'transfer_date',
        'created_by',
    ];

    protected $casts = [
        'transfer_date' => 'date',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(RepairTransferItem::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
