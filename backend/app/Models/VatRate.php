<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VatRate extends Model
{
    protected $fillable = [
        'company_id',
        'vat_code',
        'vat_desc',
        'vat_rate',
    ];

    protected $casts = [
        'vat_rate' => 'decimal:2',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
