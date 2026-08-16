<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            if (!Schema::hasColumn('sales', 'return_sub_total')) {
                $table->decimal('return_sub_total', 15, 2)->nullable()->after('sub_total');
            }
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            if (Schema::hasColumn('sales', 'return_sub_total')) {
                $table->dropColumn('return_sub_total');
            }
        });
    }
};
