<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('item_id')->constrained()->cascadeOnDelete();
            $table->string('movement_type', 30);
            $table->string('reference_type', 50)->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->string('reference_label', 100)->nullable();
            $table->string('location', 100)->nullable();
            $table->decimal('qty_before', 15, 2)->default(0);
            $table->decimal('qty_change', 15, 2)->default(0);
            $table->decimal('qty_after', 15, 2)->default(0);
            $table->decimal('unit_cost', 15, 2)->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();

            $table->index(['company_id', 'item_id', 'created_at']);
            $table->index(['movement_type']);
        });

        Schema::create('item_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('item_id')->constrained()->cascadeOnDelete();
            $table->string('batch_number', 100);
            $table->string('location', 100)->nullable();
            $table->decimal('qty', 15, 2)->default(0);
            $table->decimal('purchase_price', 15, 2)->default(0);
            $table->date('expiry_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['item_id', 'batch_number']);
        });

        Schema::create('item_additional_charges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('item_id')->constrained()->cascadeOnDelete();
            $table->string('name', 150);
            $table->decimal('amount', 15, 2)->default(0);
            $table->string('charge_type', 20)->default('fixed');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('item_additional_charges');
        Schema::dropIfExists('item_batches');
        Schema::dropIfExists('inventory_movements');
    }
};
