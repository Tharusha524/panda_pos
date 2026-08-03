<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('item_settings', function (Blueprint $table) {
            $table->json('uom_options')->nullable()->after('allow_total_price_entry_on_sales_screen');
        });
    }

    public function down(): void
    {
        Schema::table('item_settings', function (Blueprint $table) {
            $table->dropColumn('uom_options');
        });
    }
};
