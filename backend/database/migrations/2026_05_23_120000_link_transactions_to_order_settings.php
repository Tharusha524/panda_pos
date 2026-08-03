<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->string('order_status', 20)->default('completed')->after('transaction_type');
            $table->string('pricing_mode', 20)->default('retail')->after('sales_type');
            $table->decimal('service_charge', 15, 2)->default(0)->after('discount');
            $table->decimal('card_payment_charge', 15, 2)->default(0)->after('service_charge');
            $table->boolean('offer_applied')->default(false)->after('card_payment_charge');
            $table->string('refund_card_last4', 4)->nullable()->after('cheque_number');
        });

        Schema::table('sale_items', function (Blueprint $table) {
            $table->string('imei_serial', 100)->nullable()->after('line_total');
            $table->string('batch_id', 100)->nullable()->after('imei_serial');
            $table->string('secondary_uom', 50)->nullable()->after('batch_id');
            $table->decimal('secondary_uom_qty', 15, 2)->nullable()->after('secondary_uom');
            $table->text('additional_details')->nullable()->after('secondary_uom_qty');
            $table->decimal('purchase_price', 15, 2)->nullable()->after('additional_details');
        });
    }

    public function down(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropColumn([
                'imei_serial',
                'batch_id',
                'secondary_uom',
                'secondary_uom_qty',
                'additional_details',
                'purchase_price',
            ]);
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn([
                'order_status',
                'pricing_mode',
                'service_charge',
                'card_payment_charge',
                'offer_applied',
                'refund_card_last4',
            ]);
        });
    }
};
