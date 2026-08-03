<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hardware_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->string('printing_paper_size', 20)->default('a4');
            $table->string('sales_receipt_printout_style', 20)->default('style_4');
            $table->boolean('allow_auto_print')->default(true);
            $table->boolean('allow_multiple_printers')->default(false);
            $table->boolean('allow_customer_display')->default(false);
            $table->boolean('allow_company_details_receipt')->default(true);
            $table->boolean('allow_custom_header_on_sales_receipt')->default(true);
            $table->string('custom_header_name')->nullable();
            $table->text('custom_header_address')->nullable();
            $table->string('custom_header_phone', 50)->nullable();

            $table->boolean('allow_dual_language_print')->default(false);
            $table->boolean('show_barcode_on_sales_receipt')->default(false);
            $table->boolean('show_item_uom_on_sales_receipt')->default(true);
            $table->boolean('allow_customer_details_on_sales_receipt')->default(false);
            $table->boolean('allow_discount_on_sales_receipt')->default(true);
            $table->boolean('allow_logo_on_sales_receipt')->default(true);
            $table->string('customize_label_for_discount', 100)->default('Your Discount');
            $table->string('letterhead_top_margin_cm', 10)->default('10');

            $table->string('logo_80mm_path')->nullable();
            $table->string('logo_a4_a5_path')->nullable();

            $table->timestamps();
            $table->unique('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hardware_settings');
    }
};
