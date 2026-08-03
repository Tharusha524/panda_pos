<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shipments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('location')->default('Main Location');
            $table->string('shipment_no', 50);
            $table->foreignId('sale_id')->nullable()->constrained()->nullOnDelete();
            $table->string('sales_id', 50)->nullable();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->string('customer_name')->nullable();
            $table->date('shipment_date');
            $table->string('destination')->nullable();
            $table->date('estimated_delivery_date')->nullable();
            $table->decimal('weight', 15, 2)->nullable();
            $table->decimal('freight_cost', 15, 2)->default(0);
            $table->decimal('invoice_cost', 15, 2)->default(0);
            $table->string('bsl_number')->nullable();
            $table->string('us_lot_number')->nullable();
            $table->string('status', 30)->default('Pending');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'shipment_no']);
            $table->index(['company_id', 'shipment_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shipments');
    }
};
