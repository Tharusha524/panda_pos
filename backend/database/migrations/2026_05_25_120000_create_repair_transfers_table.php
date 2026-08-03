<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('repair_transfers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('transfer_type', 20);
            $table->string('from_location', 100);
            $table->string('to_location', 100);
            $table->date('transfer_date');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('repair_transfer_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('repair_transfer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('item_id')->nullable()->constrained()->nullOnDelete();
            $table->string('item_number', 50)->nullable();
            $table->string('description', 500)->nullable();
            $table->decimal('qty', 12, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('repair_transfer_items');
        Schema::dropIfExists('repair_transfers');
    }
};
