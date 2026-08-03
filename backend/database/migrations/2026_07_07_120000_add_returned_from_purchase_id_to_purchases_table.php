<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            if (!Schema::hasColumn('purchases', 'returned_from_purchase_id')) {
                $table->unsignedBigInteger('returned_from_purchase_id')->nullable()->after('supplier_name');
                $table->index('returned_from_purchase_id', 'purchases_returned_from_purchase_id_idx');
            }
        });
    }

    public function down(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            if (Schema::hasColumn('purchases', 'returned_from_purchase_id')) {
                $table->dropIndex('purchases_returned_from_purchase_id_idx');
                $table->dropColumn('returned_from_purchase_id');
            }
        });
    }
};
