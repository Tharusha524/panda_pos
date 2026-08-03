<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('offers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('days_of_week_enabled')->default(false);
            $table->json('days_of_week')->nullable();
            $table->boolean('expiration_enabled')->default(false);
            $table->date('expiration_date')->nullable();
            $table->string('discount_type')->default('product');
            $table->json('discount_rules');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('company_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('offers');
    }
};
