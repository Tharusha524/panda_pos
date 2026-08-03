<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('customer_code', 50);
            $table->string('customer_name');
            $table->string('contact_no', 30);
            $table->string('email')->nullable();
            $table->decimal('credit_limit', 15, 2)->default(0);
            $table->decimal('net_balance', 15, 2)->default(0);
            $table->string('location')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'customer_code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
