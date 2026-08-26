<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A customer's net_balance is a running total that keeps changing — without
 * this, an old "receive payment" record can't say what the balance was
 * right after it specifically (later payments/sales would have moved it).
 * Frozen at write time in CustomerService::receivePaymentForUser(), so old
 * payment receipts stay accurate no matter what happens afterward.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pos_payments', function (Blueprint $table) {
            if (!Schema::hasColumn('pos_payments', 'previous_balance')) {
                $table->decimal('previous_balance', 15, 2)->nullable()->after('bank_name');
            }
            if (!Schema::hasColumn('pos_payments', 'new_balance')) {
                $table->decimal('new_balance', 15, 2)->nullable()->after('previous_balance');
            }
        });
    }

    public function down(): void
    {
        Schema::table('pos_payments', function (Blueprint $table) {
            if (Schema::hasColumn('pos_payments', 'new_balance')) {
                $table->dropColumn('new_balance');
            }
            if (Schema::hasColumn('pos_payments', 'previous_balance')) {
                $table->dropColumn('previous_balance');
            }
        });
    }
};
