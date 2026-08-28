<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Cheque return for a sale-time payment (as opposed to a Receive Payment
 * cheque, see pos_payments.is_returned) — distinct from
 * "returned_sale_ids" (a product return), which is a completely different
 * concept. See CustomerService::markSaleChequeReturnedForUser().
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            if (!Schema::hasColumn('sales', 'cheque_returned')) {
                $table->boolean('cheque_returned')->default(false)->after('cheque_number');
            }
            if (!Schema::hasColumn('sales', 'cheque_returned_at')) {
                $table->timestamp('cheque_returned_at')->nullable()->after('cheque_returned');
            }
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            if (Schema::hasColumn('sales', 'cheque_returned_at')) {
                $table->dropColumn('cheque_returned_at');
            }
            if (Schema::hasColumn('sales', 'cheque_returned')) {
                $table->dropColumn('cheque_returned');
            }
        });
    }
};
