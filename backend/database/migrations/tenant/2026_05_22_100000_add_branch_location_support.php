<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::disableForeignKeyConstraints();

        Schema::table('items', function (Blueprint $table) {
            $table->dropUnique(['company_id', 'item_number']);
            $table->unique(['company_id', 'item_number', 'location'], 'items_company_number_location_unique');
        });

        if (!Schema::hasColumn('suppliers', 'location')) {
            Schema::table('suppliers', function (Blueprint $table) {
                $table->string('location')->default('Main Location')->after('company_id');
            });
        }

        Schema::table('suppliers', function (Blueprint $table) {
            $table->dropUnique(['company_id', 'supplier_code']);
            $table->unique(['company_id', 'supplier_code', 'location'], 'suppliers_company_code_location_unique');
        });

        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->dropUnique('suppliers_company_code_location_unique');
            $table->dropColumn('location');
            $table->unique(['company_id', 'supplier_code']);
        });

        Schema::table('items', function (Blueprint $table) {
            $table->dropUnique('items_company_number_location_unique');
            $table->unique(['company_id', 'item_number']);
        });
    }
};
