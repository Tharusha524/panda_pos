<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // Identification & shipping
            $table->boolean('allow_imei_serial_number')->default(false);
            $table->boolean('allow_batch_id_popup')->default(true);
            $table->boolean('allow_multiple_uom_for_sales_order')->default(false);
            $table->boolean('allow_custom_fields_in_shipping_screen')->default(false);

            // Additional features
            $table->string('search_box_short_key_style', 50)->default('item_code_qty');
            $table->boolean('allow_virtual_keyboard')->default(false);
            $table->boolean('allow_edit_selling_price')->default(true);
            $table->boolean('allow_purchase_price_show_in_order_screen')->default(true);
            $table->boolean('hide_quantity_from_plu_on_sales_screen')->default(false);
            $table->boolean('allow_verify_credit_card_for_sales_return_refund')->default(true);
            $table->boolean('allow_additional_item_details_on_sales')->default(false);
            $table->boolean('allow_wholesale_price_popup_on_sales_screen')->default(false);

            // General order behavior
            $table->boolean('allow_order_confirmation_popup')->default(true);
            $table->boolean('allow_past_date_in_sales_order')->default(true);
            $table->string('default_payment_method', 50)->default('cash');
            $table->boolean('allow_service_charge')->default(false);
            $table->decimal('credit_debit_card_payment_charges_percent', 5, 2)->default(1.5);
            $table->boolean('allow_item_auto_entry')->default(true);
            $table->boolean('allow_sales_negative_inventory')->default(false);
            $table->boolean('allow_quotation_negative_inventory')->default(true);
            $table->boolean('allow_ingredients_items_in_sales')->default(true);

            // Pricing, offers & hold orders
            $table->boolean('allow_view_wholesale_retail_prices_by_clicking')->default(false);
            $table->boolean('allow_switching_wholesale_retail_prices')->default(true);
            $table->boolean('allow_offer')->default(true);
            $table->boolean('allow_offer_for_wholesale_price')->default(false);
            $table->boolean('allow_customer_advance_payment')->default(true);
            $table->boolean('allow_deletion_of_hold_orders')->default(true);
            $table->boolean('allow_editing_of_hold_orders')->default(true);
            $table->string('hold_order_pin', 20)->default('12343');
            $table->boolean('allow_order_discount')->default(true);

            $table->timestamps();
            $table->unique('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_settings');
    }
};
