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
            if (!Schema::hasColumn('items', 'image_path')) {
                $table->string('image_path')->nullable()->after('description');
            }
        });
    }

    public function down(): void
    {
        if (Schema::hasTable('items') && Schema::hasColumn('items', 'image_path')) {
            Schema::table('items', function (Blueprint $table) {
                $table->dropColumn('image_path');
            });
        }
    }
};
