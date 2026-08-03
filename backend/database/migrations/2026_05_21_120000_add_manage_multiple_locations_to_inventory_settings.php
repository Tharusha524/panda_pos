<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('inventory_settings')) {
            return;
        }

        Schema::table('inventory_settings', function (Blueprint $table) {
            if (!Schema::hasColumn('inventory_settings', 'manage_multiple_locations')) {
                $table->boolean('manage_multiple_locations')->default(true)->after('user_id');
            }
        });
    }

    public function down(): void
    {
        if (Schema::hasTable('inventory_settings') && Schema::hasColumn('inventory_settings', 'manage_multiple_locations')) {
            Schema::table('inventory_settings', function (Blueprint $table) {
                $table->dropColumn('manage_multiple_locations');
            });
        }
    }
};
