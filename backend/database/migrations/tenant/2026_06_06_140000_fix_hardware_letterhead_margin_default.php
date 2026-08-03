<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('hardware_settings')) {
            return;
        }

        Schema::table('hardware_settings', function (Blueprint $table) {
            $table->string('letterhead_top_margin_cm', 10)->default('none')->change();
        });

        DB::table('hardware_settings')
            ->where('letterhead_top_margin_cm', '10')
            ->update(['letterhead_top_margin_cm' => 'none']);
    }

    public function down(): void
    {
        if (! Schema::hasTable('hardware_settings')) {
            return;
        }

        Schema::table('hardware_settings', function (Blueprint $table) {
            $table->string('letterhead_top_margin_cm', 10)->default('10')->change();
        });
    }
};
