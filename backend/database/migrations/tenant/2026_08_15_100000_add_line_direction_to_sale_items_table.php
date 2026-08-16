<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            if (!Schema::hasColumn('sale_items', 'line_direction')) {
                $table->string('line_direction', 10)->default('sale')->after('line_total');
            }
        });

        // Backfill: every line item that belongs to a Return bill (transaction_type = 1002)
        // must be marked 'return', otherwise the default 'sale' would mislabel all
        // historical return lines and break remaining-qty counting.
        DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->where('sales.transaction_type', '1002')
            ->update(['sale_items.line_direction' => 'return']);
    }

    public function down(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            if (Schema::hasColumn('sale_items', 'line_direction')) {
                $table->dropColumn('line_direction');
            }
        });
    }
};
