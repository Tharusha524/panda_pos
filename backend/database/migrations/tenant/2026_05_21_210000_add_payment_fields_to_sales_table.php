<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->decimal('amount_received', 15, 2)->nullable()->after('net_amount');
            $table->foreignId('bank_id')->nullable()->after('amount_received')->constrained()->nullOnDelete();
            $table->string('cheque_number', 50)->nullable()->after('bank_id');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropForeign(['bank_id']);
            $table->dropColumn(['amount_received', 'bank_id', 'cheque_number']);
        });
    }
};
