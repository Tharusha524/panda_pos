<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            if (!Schema::hasColumn('sales', 'returned_from_sale_id')) {
                $table->unsignedBigInteger('returned_from_sale_id')->nullable()->after('customer_name');
                $table->index('returned_from_sale_id', 'sales_returned_from_sale_id_idx');
            }
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            if (Schema::hasColumn('sales', 'returned_from_sale_id')) {
                $table->dropIndex('sales_returned_from_sale_id_idx');
                $table->dropColumn('returned_from_sale_id');
            }
        });
    }
};
