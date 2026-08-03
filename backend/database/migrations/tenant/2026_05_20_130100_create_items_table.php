<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('item_number', 50);
            $table->string('description');
            $table->string('category')->nullable();
            $table->string('sub_category')->nullable();
            $table->string('product_type')->nullable();
            $table->string('location')->default('Main Location');
            $table->decimal('selling_price', 15, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['company_id', 'item_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('items');
    }
};
