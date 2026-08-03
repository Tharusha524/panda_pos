<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_items', function (Blueprint $table) {
            $table->date('expiry_date')->nullable()->after('line_total');
            $table->foreignId('item_batch_id')->nullable()->after('expiry_date')
                ->constrained('item_batches')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('purchase_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('item_batch_id');
            $table->dropColumn('expiry_date');
        });
    }
};
