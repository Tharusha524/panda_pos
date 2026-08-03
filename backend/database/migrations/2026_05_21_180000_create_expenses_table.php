<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('location')->default('Main Location');
            $table->date('expense_date');
            $table->string('reference_no', 50);
            $table->string('category', 100);
            $table->string('description', 500);
            $table->decimal('amount', 15, 2)->default(0);
            $table->decimal('discount', 15, 2)->default(0);
            $table->string('payment_method', 50)->default('Cash');
            $table->string('status', 20)->default('Approved');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'reference_no']);
            $table->index(['company_id', 'expense_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
