<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pos_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('payment_type', 20)->default('1008');
            $table->string('location')->default('Main Location');
            $table->date('payment_date');
            $table->string('sales_no', 50);
            $table->string('receipt_type', 50)->default('Sale');
            $table->string('payment_method', 50)->default('Cash');
            $table->decimal('discount', 15, 2)->default(0);
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'sales_no']);
            $table->index(['company_id', 'payment_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_payments');
    }
};
