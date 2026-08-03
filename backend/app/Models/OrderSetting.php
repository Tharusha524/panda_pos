<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderSetting extends Model
{
    protected $fillable = [
        'user_id',
        'allow_imei_serial_number',
        'allow_batch_id_popup',
        'allow_multiple_uom_for_sales_order',
        'allow_custom_fields_in_shipping_screen',
        'search_box_short_key_style',
        'allow_virtual_keyboard',
        'allow_edit_selling_price',
        'allow_purchase_price_show_in_order_screen',
        'hide_quantity_from_plu_on_sales_screen',
        'allow_verify_credit_card_for_sales_return_refund',
        'allow_additional_item_details_on_sales',
        'allow_wholesale_price_popup_on_sales_screen',
        'allow_order_confirmation_popup',
        'allow_past_date_in_sales_order',
        'default_payment_method',
        'allow_service_charge',
        'credit_debit_card_payment_charges_percent',
        'allow_item_auto_entry',
        'allow_sales_negative_inventory',
        'allow_quotation_negative_inventory',
        'allow_ingredients_items_in_sales',
        'allow_view_wholesale_retail_prices_by_clicking',
        'allow_switching_wholesale_retail_prices',
        'allow_offer',
        'allow_offer_for_wholesale_price',
        'allow_customer_advance_payment',
        'allow_deletion_of_hold_orders',
        'allow_editing_of_hold_orders',
        'hold_order_pin',
        'allow_order_discount',
    ];

    protected function casts(): array
    {
        return [
            'allow_imei_serial_number' => 'boolean',
            'allow_batch_id_popup' => 'boolean',
            'allow_multiple_uom_for_sales_order' => 'boolean',
            'allow_custom_fields_in_shipping_screen' => 'boolean',
            'allow_virtual_keyboard' => 'boolean',
            'allow_edit_selling_price' => 'boolean',
            'allow_purchase_price_show_in_order_screen' => 'boolean',
            'hide_quantity_from_plu_on_sales_screen' => 'boolean',
            'allow_verify_credit_card_for_sales_return_refund' => 'boolean',
            'allow_additional_item_details_on_sales' => 'boolean',
            'allow_wholesale_price_popup_on_sales_screen' => 'boolean',
            'allow_order_confirmation_popup' => 'boolean',
            'allow_past_date_in_sales_order' => 'boolean',
            'allow_service_charge' => 'boolean',
            'credit_debit_card_payment_charges_percent' => 'decimal:2',
            'allow_item_auto_entry' => 'boolean',
            'allow_sales_negative_inventory' => 'boolean',
            'allow_quotation_negative_inventory' => 'boolean',
            'allow_ingredients_items_in_sales' => 'boolean',
            'allow_view_wholesale_retail_prices_by_clicking' => 'boolean',
            'allow_switching_wholesale_retail_prices' => 'boolean',
            'allow_offer' => 'boolean',
            'allow_offer_for_wholesale_price' => 'boolean',
            'allow_customer_advance_payment' => 'boolean',
            'allow_deletion_of_hold_orders' => 'boolean',
            'allow_editing_of_hold_orders' => 'boolean',
            'allow_order_discount' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
