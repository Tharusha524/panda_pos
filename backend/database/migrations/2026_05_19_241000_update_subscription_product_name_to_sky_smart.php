<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('subscriptions')
            ->whereIn('product_name', ['Online POS Pro', 'Kale Online POS Pro'])
            ->update(['product_name' => 'Sky Smart Software']);
    }

    public function down(): void
    {
        DB::table('subscriptions')
            ->where('product_name', 'Sky Smart Software')
            ->update(['product_name' => 'Online POS Pro']);
    }
};
