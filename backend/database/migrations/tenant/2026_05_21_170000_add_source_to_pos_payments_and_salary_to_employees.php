<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->decimal('monthly_salary', 15, 2)->default(0)->after('address');
        });

        Schema::table('pos_payments', function (Blueprint $table) {
            $table->string('source_type', 30)->nullable()->after('company_id');
            $table->unsignedBigInteger('source_id')->nullable()->after('source_type');
            $table->index(['company_id', 'source_type', 'source_id']);
        });
    }

    public function down(): void
    {
        Schema::table('pos_payments', function (Blueprint $table) {
            $table->dropIndex(['company_id', 'source_type', 'source_id']);
            $table->dropColumn(['source_type', 'source_id']);
        });

        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn('monthly_salary');
        });
    }
};
