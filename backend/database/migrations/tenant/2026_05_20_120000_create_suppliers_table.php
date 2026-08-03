<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('supplier_code', 50);
            $table->string('first_name');
            $table->string('phone', 30);
            $table->string('email')->nullable();
            $table->decimal('opening_balance', 15, 2)->default(0);
            $table->decimal('net_balance', 15, 2)->default(0);
            $table->string('address_line1')->nullable();
            $table->string('address_line2')->nullable();
            $table->string('city')->nullable();
            $table->string('province')->nullable();
            $table->string('postal_code', 20)->nullable();
            $table->string('country')->default('Sri Lanka');
            $table->timestamps();

            $table->unique(['company_id', 'supplier_code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('suppliers');
    }
};
