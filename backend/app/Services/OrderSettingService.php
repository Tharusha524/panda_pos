<?php

namespace App\Services;

use App\Models\OrderSetting;
use App\Models\User;
use Exception;

class OrderSettingService
{
    private const BOOLEAN_FIELDS = [
        'allow_imei_serial_number',
        'allow_batch_id_popup',
        'allow_multiple_uom_for_sales_order',
        'allow_custom_fields_in_shipping_screen',
        'allow_virtual_keyboard',
        'allow_edit_selling_price',
        'allow_purchase_price_show_in_order_screen',
        'hide_quantity_from_plu_on_sales_screen',
        'allow_verify_credit_card_for_sales_return_refund',
        'allow_additional_item_details_on_sales',
        'allow_wholesale_price_popup_on_sales_screen',
        'allow_order_confirmation_popup',
        'allow_past_date_in_sales_order',
        'allow_service_charge',
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
        'allow_order_discount',
    ];

    private const SEARCH_KEY_STYLES = ['item_code_qty', 'item_name_qty', 'barcode_qty'];

    private const PAYMENT_METHODS = ['cash', 'card', 'bank_transfer', 'cheque', 'credit'];

    public function getForUser(User $user): array
    {
        return $this->formatSetting($this->getOrCreateSetting($user));
    }

    public function updateForUser(User $user, array $data): array
    {
        $setting = $this->getOrCreateSetting($user);
        $payload = [];

        foreach (self::BOOLEAN_FIELDS as $field) {
            if (array_key_exists($field, $data)) {
                $payload[$field] = (bool) $data[$field];
            }
        }

        if (array_key_exists('search_box_short_key_style', $data)) {
            $style = (string) $data['search_box_short_key_style'];
            if (!in_array($style, self::SEARCH_KEY_STYLES, true)) {
                throw new Exception('Invalid search box short key style.');
            }
            $payload['search_box_short_key_style'] = $style;
        }

        if (array_key_exists('default_payment_method', $data)) {
            $method = strtolower((string) $data['default_payment_method']);
            if (!in_array($method, self::PAYMENT_METHODS, true)) {
                throw new Exception('Invalid default payment method.');
            }
            $payload['default_payment_method'] = $method;
        }

        if (array_key_exists('credit_debit_card_payment_charges_percent', $data)) {
            $percent = (float) $data['credit_debit_card_payment_charges_percent'];
            if ($percent < 0 || $percent > 100) {
                throw new Exception('Card payment charge must be between 0 and 100.');
            }
            $payload['credit_debit_card_payment_charges_percent'] = $percent;
        }

        if (array_key_exists('hold_order_pin', $data)) {
            $pin = trim((string) $data['hold_order_pin']);
            if ($pin === '' || strlen($pin) > 20) {
                throw new Exception('Hold order PIN must be 1–20 characters.');
            }
            $payload['hold_order_pin'] = $pin;
        }

        if ($payload !== []) {
            $setting->update($payload);
        }

        return $this->formatSetting($setting->fresh());
    }

    private function getOrCreateSetting(User $user): OrderSetting
    {
        return OrderSetting::firstOrCreate(
            ['user_id' => $user->id],
            [
                'allow_imei_serial_number' => false,
                'allow_batch_id_popup' => true,
                'allow_multiple_uom_for_sales_order' => false,
                'allow_custom_fields_in_shipping_screen' => false,
                'search_box_short_key_style' => 'item_code_qty',
                'allow_virtual_keyboard' => false,
                'allow_edit_selling_price' => true,
                'allow_purchase_price_show_in_order_screen' => true,
                'hide_quantity_from_plu_on_sales_screen' => false,
                'allow_verify_credit_card_for_sales_return_refund' => true,
                'allow_additional_item_details_on_sales' => false,
                'allow_wholesale_price_popup_on_sales_screen' => false,
                'allow_order_confirmation_popup' => true,
                'allow_past_date_in_sales_order' => true,
                'default_payment_method' => 'cash',
                'allow_service_charge' => false,
                'credit_debit_card_payment_charges_percent' => 1.5,
                'allow_item_auto_entry' => true,
                'allow_sales_negative_inventory' => false,
                'allow_quotation_negative_inventory' => true,
                'allow_ingredients_items_in_sales' => true,
                'allow_view_wholesale_retail_prices_by_clicking' => false,
                'allow_switching_wholesale_retail_prices' => true,
                'allow_offer' => true,
                'allow_offer_for_wholesale_price' => true,
                'allow_customer_advance_payment' => true,
                'allow_deletion_of_hold_orders' => true,
                'allow_editing_of_hold_orders' => true,
                'hold_order_pin' => '12343',
                'allow_order_discount' => true,
            ]
        );
    }

    private function formatSetting(OrderSetting $setting): array
    {
        $data = ['id' => $setting->id];

        foreach (self::BOOLEAN_FIELDS as $field) {
            $data[$field] = (bool) $setting->{$field};
        }

        $data['search_box_short_key_style'] = $setting->search_box_short_key_style;
        $data['default_payment_method'] = $setting->default_payment_method;
        $data['credit_debit_card_payment_charges_percent'] = (float) $setting->credit_debit_card_payment_charges_percent;
        $data['hold_order_pin'] = $setting->hold_order_pin;

        return $data;
    }
}
