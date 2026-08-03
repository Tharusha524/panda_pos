<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ItemSetting extends Model
{
    protected $fillable = [
        'user_id',
        'allow_auto_number',
        'allow_item_discount',
        'allow_wholesale_price',
        'allow_upload_item_image',
        'allow_variant_in_add_item',
        'allow_quick_add_item_in_sales_screen',
        'allow_favorite_items_on_sales_screen',
        'allow_editing_purchase_price_in_inventory_dashboard',
        'allow_total_price_entry_on_sales_screen',
        'uom_options',
    ];

    protected function casts(): array
    {
        return [
            'allow_auto_number' => 'boolean',
            'allow_item_discount' => 'boolean',
            'allow_wholesale_price' => 'boolean',
            'allow_upload_item_image' => 'boolean',
            'allow_variant_in_add_item' => 'boolean',
            'allow_quick_add_item_in_sales_screen' => 'boolean',
            'allow_favorite_items_on_sales_screen' => 'boolean',
            'allow_editing_purchase_price_in_inventory_dashboard' => 'boolean',
            'allow_total_price_entry_on_sales_screen' => 'boolean',
            'uom_options' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
