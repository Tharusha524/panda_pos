<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int|null $company_id
 * @property string|null $name
 * @property string|null $product_type
 * @property-read Collection<int, ItemSubCategory> $subCategories
 */
class ItemCategory extends Model
{
    protected $fillable = ['company_id', 'name', 'product_type'];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function subCategories(): HasMany
    {
        return $this->hasMany(ItemSubCategory::class);
    }
}
