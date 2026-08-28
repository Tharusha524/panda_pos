<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Cheque return (bounced cheque) support — flags a customer payment as
 * returned so it stops counting as a real settlement. See
 * CustomerService::markPaymentReturnedForUser().
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pos_payments', function (Blueprint $table) {
            if (!Schema::hasColumn('pos_payments', 'is_returned')) {
                $table->boolean('is_returned')->default(false)->after('new_balance');
            }
            if (!Schema::hasColumn('pos_payments', 'returned_at')) {
                $table->timestamp('returned_at')->nullable()->after('is_returned');
            }
        });
    }

    public function down(): void
    {
        Schema::table('pos_payments', function (Blueprint $table) {
            if (Schema::hasColumn('pos_payments', 'returned_at')) {
                $table->dropColumn('returned_at');
            }
            if (Schema::hasColumn('pos_payments', 'is_returned')) {
                $table->dropColumn('is_returned');
            }
        });
    }
};
