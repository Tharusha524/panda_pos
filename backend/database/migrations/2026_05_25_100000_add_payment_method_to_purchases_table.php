<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            $table->string('payment_method', 50)->default('Cash')->after('amount');
            $table->foreignId('bank_id')->nullable()->after('payment_method')->constrained()->nullOnDelete();
            $table->string('cheque_number', 50)->nullable()->after('bank_id');
        });
    }

    public function down(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            $table->dropConstrainedForeignId('bank_id');
            $table->dropColumn(['payment_method', 'cheque_number']);
        });
    }
};
