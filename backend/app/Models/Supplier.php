<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Supplier extends Model
{
    protected $fillable = [
        'company_id',
        'location',
        'supplier_code',
        'first_name',
        'phone',
        'email',
        'opening_balance',
        'net_balance',
        'address_line1',
        'address_line2',
        'city',
        'province',
        'postal_code',
        'country',
    ];

    protected $casts = [
        'opening_balance' => 'decimal:2',
        'net_balance' => 'decimal:2',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
