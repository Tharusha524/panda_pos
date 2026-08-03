<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('order_settings')
            ->where('allow_offer_for_wholesale_price', false)
            ->update(['allow_offer_for_wholesale_price' => true]);
    }

    public function down(): void
    {
        // No rollback — wholesale offers are intended for both pricing modes.
    }
};
