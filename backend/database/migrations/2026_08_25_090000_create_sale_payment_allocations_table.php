<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-bill tracking for credit settlement — links a "receive payment"
 * record (pos_payments) to the specific credit sale (bill) it paid off,
 * so a customer's outstanding credit can be broken down bill-by-bill
 * instead of only as one running total (customers.net_balance, which
 * this table does not replace — it stays the source of truth for the
 * overall balance).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sale_payment_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained()->cascadeOnDelete();
            $table->foreignId('pos_payment_id')->constrained('pos_payments')->cascadeOnDelete();
            $table->decimal('amount', 15, 2);
            $table->timestamps();

            $table->index('sale_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sale_payment_allocations');
    }
};
