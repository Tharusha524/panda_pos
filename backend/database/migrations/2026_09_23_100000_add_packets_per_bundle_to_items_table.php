<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('items')) {
            return;
        }

        Schema::table('items', function (Blueprint $table) {
            if (!Schema::hasColumn('items', 'packets_per_bundle')) {
                // How many packets make up one bundle for this item — set
                // per item (not a fixed app-wide constant) since it varies
                // by item and can change over time. Null means not
                // configured yet, so reports know to show it as unknown
                // rather than silently assuming a wrong ratio.
                $table->unsignedInteger('packets_per_bundle')->nullable()->after('uom');
            }
        });
    }

    public function down(): void
    {
        if (Schema::hasTable('items') && Schema::hasColumn('items', 'packets_per_bundle')) {
            Schema::table('items', function (Blueprint $table) {
                $table->dropColumn('packets_per_bundle');
            });
        }
    }
};
