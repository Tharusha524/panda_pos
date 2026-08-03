<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('item_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->timestamps();

            $table->unique(['company_id', 'name']);
        });

        Schema::create('item_sub_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('item_category_id')->constrained('item_categories')->cascadeOnDelete();
            $table->string('name');
            $table->timestamps();

            $table->unique(['item_category_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('item_sub_categories');
        Schema::dropIfExists('item_categories');
    }
};
