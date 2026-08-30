<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Split payment on a single sale — e.g. part cash + part cheque + part
 * credit for the same bill. A sale with rows here is paid across multiple
 * methods instead of the one Sale.payment_method/amount_received pair,
 * which stays as-is for the common single-method case (Sale.payment_method
 * becomes 'Split' as a marker when this table has rows for it).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sale_payment_splits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained()->cascadeOnDelete();
            $table->string('payment_method', 50);
            $table->decimal('amount', 15, 2);
            $table->string('cheque_number', 50)->nullable();
            $table->string('bank_name', 100)->nullable();
            $table->timestamps();

            $table->index('sale_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sale_payment_splits');
    }
};
