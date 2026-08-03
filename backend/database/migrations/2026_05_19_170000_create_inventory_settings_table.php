<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('costing_method', 10)->default('FIFO');
            $table->boolean('allow_tog')->default(true);
            $table->boolean('allow_request_for_quotation')->default(true);
            $table->boolean('allow_inventory_location_filter')->default(true);
            $table->timestamps();

            $table->unique('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_settings');
    }
};
