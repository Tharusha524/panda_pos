<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Purchase order lets the buyer type any bank name freely (not just pick
 * from the registered banks list) — but bank_id is a numeric foreign key
 * into the banks table, so free text sent there was silently dropped (same
 * bug the sales checkout screen had — see
 * 2026_08_30_090000_add_bank_name_to_sales_table.php). This plain text
 * column is where that freely-typed name actually gets saved; bank_id stays
 * for when a real registered bank was picked.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            if (!Schema::hasColumn('purchases', 'bank_name')) {
                $table->string('bank_name', 100)->nullable()->after('bank_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            if (Schema::hasColumn('purchases', 'bank_name')) {
                $table->dropColumn('bank_name');
            }
        });
    }
};
