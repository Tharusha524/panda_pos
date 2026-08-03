<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaxSetting extends Model
{
    protected $fillable = [
        'company_id',
        'allow_vat',
        'default_vat_rate_id',
        'vat_type',
    ];

    protected $casts = [
        'allow_vat' => 'boolean',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function defaultVatRate(): BelongsTo
    {
        return $this->belongsTo(VatRate::class, 'default_vat_rate_id');
    }
}
