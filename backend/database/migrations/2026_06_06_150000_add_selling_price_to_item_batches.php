<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('item_batches', function (Blueprint $table) {
            $table->decimal('selling_price', 15, 2)->nullable()->after('purchase_price');
        });
    }

    public function down(): void
    {
        Schema::table('item_batches', function (Blueprint $table) {
            $table->dropColumn('selling_price');
        });
    }
};
