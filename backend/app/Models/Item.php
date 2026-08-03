<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int|null $company_id
 * @property string|null $item_number
 * @property bool $auto_generate_item_number
 * @property string|null $description
 * @property string|null $image_path
 * @property string|null $category
 * @property string|null $sub_category
 * @property int|null $item_category_id
 * @property int|null $item_sub_category_id
 * @property string|null $product_type
 * @property string|null $location
 * @property float|int|string|null $selling_price
 * @property float|int|string|null $wholesale_price
 * @property float|int|string|null $purchase_price
 * @property float|int|string|null $default_discount
 * @property string|null $default_discount_type
 * @property float|int|string|null $max_discount
 * @property bool $has_multiple_options
 * @property string|null $item_details
 * @property bool $track_with_inventory
 * @property float|int|string|null $qty
 * @property float|int|string|null $reorder_qty
 * @property string|null $uom
 * @property Carbon|null $expiry_date
 * @property string|null $item_code
 * @property string|null $supplier_item_code
 * @property string|null $sku
 * @property bool $is_favourite
 * @property bool $is_active
 * @property-read Company|null $company
 * @property-read ItemCategory|null $itemCategory
 * @property-read ItemSubCategory|null $itemSubCategory
 */
class Item extends Model
{
    protected $fillable = [
        'company_id',
        'item_number',
        'auto_generate_item_number',
        'description',
        'image_path',
        'category',
        'sub_category',
        'item_category_id',
        'item_sub_category_id',
        'vat_rate_id',
        'product_type',
        'location',
        'selling_price',
        'wholesale_price',
        'purchase_price',
        'default_discount',
        'default_discount_type',
        'max_discount',
        'has_multiple_options',
        'item_details',
        'track_with_inventory',
        'qty',
        'reorder_qty',
        'uom',
        'expiry_date',
        'item_code',
        'supplier_item_code',
        'sku',
        'is_favourite',
        'is_active',
    ];

    protected $casts = [
        'auto_generate_item_number' => 'boolean',
        'selling_price' => 'decimal:2',
        'wholesale_price' => 'decimal:2',
        'purchase_price' => 'decimal:2',
        'default_discount' => 'decimal:2',
        'max_discount' => 'decimal:2',
        'has_multiple_options' => 'boolean',
        'track_with_inventory' => 'boolean',
        'qty' => 'decimal:2',
        'reorder_qty' => 'decimal:2',
        'expiry_date' => 'date',
        'is_favourite' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function itemCategory(): BelongsTo
    {
        return $this->belongsTo(ItemCategory::class, 'item_category_id');
    }

    public function itemSubCategory(): BelongsTo
    {
        return $this->belongsTo(ItemSubCategory::class, 'item_sub_category_id');
    }

    public function batches(): HasMany
    {
        return $this->hasMany(ItemBatch::class);
    }
}
