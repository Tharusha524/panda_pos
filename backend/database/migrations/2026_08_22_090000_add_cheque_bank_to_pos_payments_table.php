<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pos_payments', function (Blueprint $table) {
            if (!Schema::hasColumn('pos_payments', 'cheque_number')) {
                $table->string('cheque_number', 50)->nullable()->after('payment_method');
            }
            if (!Schema::hasColumn('pos_payments', 'bank_name')) {
                $table->string('bank_name', 100)->nullable()->after('cheque_number');
            }
        });
    }

    public function down(): void
    {
        Schema::table('pos_payments', function (Blueprint $table) {
            if (Schema::hasColumn('pos_payments', 'bank_name')) {
                $table->dropColumn('bank_name');
            }
            if (Schema::hasColumn('pos_payments', 'cheque_number')) {
                $table->dropColumn('cheque_number');
            }
        });
    }
};
