<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int|null $company_id
 * @property int|null $item_category_id
 * @property string|null $name
 * @property-read ItemCategory|null $category
 */
class ItemSubCategory extends Model
{
    protected $fillable = ['company_id', 'item_category_id', 'name'];

    public function category(): BelongsTo
    {
        return $this->belongsTo(ItemCategory::class, 'item_category_id');
    }
}
