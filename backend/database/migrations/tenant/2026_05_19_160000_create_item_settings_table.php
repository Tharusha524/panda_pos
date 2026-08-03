<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('item_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->boolean('allow_auto_number')->default(true);
            $table->boolean('allow_item_discount')->default(true);
            $table->boolean('allow_wholesale_price')->default(true);
            $table->boolean('allow_upload_item_image')->default(false);
            $table->boolean('allow_variant_in_add_item')->default(true);
            $table->boolean('allow_quick_add_item_in_sales_screen')->default(true);
            $table->boolean('allow_favorite_items_on_sales_screen')->default(true);
            $table->boolean('allow_editing_purchase_price_in_inventory_dashboard')->default(true);
            $table->boolean('allow_total_price_entry_on_sales_screen')->default(true);
            $table->timestamps();

            $table->unique('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('item_settings');
    }
};
