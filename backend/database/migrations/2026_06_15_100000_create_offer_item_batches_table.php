<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('offer_item_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('offer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('item_batch_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['offer_id', 'item_batch_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('offer_item_batches');
    }
};
