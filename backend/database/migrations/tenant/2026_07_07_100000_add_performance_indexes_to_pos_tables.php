<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->index(['company_id', 'order_status', 'updated_at'], 'sales_company_status_updated_idx');
            $table->index(['company_id', 'sale_date', 'transaction_type', 'order_status'], 'sales_company_date_type_status_idx');
            $table->index(['company_id', 'created_at'], 'sales_company_created_idx');
            $table->index(['company_id', 'location', 'sale_date'], 'sales_company_location_date_idx');
            $table->index(['company_id', 'customer_id', 'sale_date'], 'sales_company_customer_date_idx');
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->index(['company_id', 'net_balance'], 'customers_company_balance_idx');
            $table->index(['company_id', 'contact_no'], 'customers_company_phone_idx');
            $table->index(['company_id', 'location'], 'customers_company_location_idx');
        });

        Schema::table('items', function (Blueprint $table) {
            $table->index(['company_id', 'is_active', 'track_with_inventory', 'location'], 'items_company_stock_location_idx');
        });

        Schema::table('pos_payments', function (Blueprint $table) {
            $table->index(['company_id', 'payment_date', 'location'], 'payments_company_date_location_idx');
            $table->index(['company_id', 'payment_method', 'payment_date'], 'payments_company_method_date_idx');
            $table->index(['company_id', 'created_at'], 'payments_company_created_idx');
        });

        Schema::table('purchases', function (Blueprint $table) {
            $table->index(['company_id', 'location', 'purchase_date'], 'purchases_company_location_date_idx');
            $table->index(['company_id', 'created_at'], 'purchases_company_created_idx');
        });

        Schema::table('sale_items', function (Blueprint $table) {
            $table->index(['item_id', 'created_at'], 'sale_items_item_created_idx');
        });

        if (Schema::hasTable('item_batches')) {
            Schema::table('item_batches', function (Blueprint $table) {
                $table->index(['company_id', 'item_id', 'location'], 'item_batches_company_item_location_idx');
            });
        }
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropIndex('sales_company_status_updated_idx');
            $table->dropIndex('sales_company_date_type_status_idx');
            $table->dropIndex('sales_company_created_idx');
            $table->dropIndex('sales_company_location_date_idx');
            $table->dropIndex('sales_company_customer_date_idx');
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->dropIndex('customers_company_balance_idx');
            $table->dropIndex('customers_company_phone_idx');
            $table->dropIndex('customers_company_location_idx');
        });

        Schema::table('items', function (Blueprint $table) {
            $table->dropIndex('items_company_stock_location_idx');
        });

        Schema::table('pos_payments', function (Blueprint $table) {
            $table->dropIndex('payments_company_date_location_idx');
            $table->dropIndex('payments_company_method_date_idx');
            $table->dropIndex('payments_company_created_idx');
        });

        Schema::table('purchases', function (Blueprint $table) {
            $table->dropIndex('purchases_company_location_date_idx');
            $table->dropIndex('purchases_company_created_idx');
        });

        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropIndex('sale_items_item_created_idx');
        });

        if (Schema::hasTable('item_batches')) {
            Schema::table('item_batches', function (Blueprint $table) {
                $table->dropIndex('item_batches_company_item_location_idx');
            });
        }
    }
};
