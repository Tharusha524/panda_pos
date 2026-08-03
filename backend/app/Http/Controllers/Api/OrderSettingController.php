<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\OrderSettingService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OrderSettingController extends Controller
{
    public function __construct(private OrderSettingService $orderSettingService)
    {
    }

    public function show(Request $request)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $this->orderSettingService->getForUser($request->user()),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function update(Request $request)
    {
        try {
            $validated = $request->validate([
                'allow_imei_serial_number' => 'nullable|boolean',
                'allow_batch_id_popup' => 'nullable|boolean',
                'allow_multiple_uom_for_sales_order' => 'nullable|boolean',
                'allow_custom_fields_in_shipping_screen' => 'nullable|boolean',
                'search_box_short_key_style' => ['nullable', 'string', Rule::in(['item_code_qty', 'item_name_qty', 'barcode_qty'])],
                'allow_virtual_keyboard' => 'nullable|boolean',
                'allow_edit_selling_price' => 'nullable|boolean',
                'allow_purchase_price_show_in_order_screen' => 'nullable|boolean',
                'hide_quantity_from_plu_on_sales_screen' => 'nullable|boolean',
                'allow_verify_credit_card_for_sales_return_refund' => 'nullable|boolean',
                'allow_additional_item_details_on_sales' => 'nullable|boolean',
                'allow_wholesale_price_popup_on_sales_screen' => 'nullable|boolean',
                'allow_order_confirmation_popup' => 'nullable|boolean',
                'allow_past_date_in_sales_order' => 'nullable|boolean',
                'default_payment_method' => ['nullable', 'string', Rule::in(['cash', 'card', 'bank_transfer', 'cheque', 'credit'])],
                'allow_service_charge' => 'nullable|boolean',
                'credit_debit_card_payment_charges_percent' => 'nullable|numeric|min:0|max:100',
                'allow_item_auto_entry' => 'nullable|boolean',
                'allow_sales_negative_inventory' => 'nullable|boolean',
                'allow_quotation_negative_inventory' => 'nullable|boolean',
                'allow_ingredients_items_in_sales' => 'nullable|boolean',
                'allow_view_wholesale_retail_prices_by_clicking' => 'nullable|boolean',
                'allow_switching_wholesale_retail_prices' => 'nullable|boolean',
                'allow_offer' => 'nullable|boolean',
                'allow_offer_for_wholesale_price' => 'nullable|boolean',
                'allow_customer_advance_payment' => 'nullable|boolean',
                'allow_deletion_of_hold_orders' => 'nullable|boolean',
                'allow_editing_of_hold_orders' => 'nullable|boolean',
                'hold_order_pin' => 'nullable|string|max:20',
                'allow_order_discount' => 'nullable|boolean',
            ]);

            $data = $this->orderSettingService->updateForUser(
                $request->user(),
                $validated
            );

            return response()->json([
                'success' => true,
                'message' => 'Order settings saved successfully',
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
