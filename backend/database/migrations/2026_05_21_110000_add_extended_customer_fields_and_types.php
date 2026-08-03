<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->timestamps();
            $table->unique(['company_id', 'name']);
        });

        Schema::create('customer_advance_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 15, 2);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::table('customers', function (Blueprint $table) {
            $columns = [
                'first_name' => fn () => $table->string('first_name')->nullable()->after('customer_code'),
                'business_name' => fn () => $table->string('business_name')->nullable()->after('first_name'),
                'allow_duplicate_phone' => fn () => $table->boolean('allow_duplicate_phone')->default(false)->after('contact_no'),
                'date_of_birth' => fn () => $table->date('date_of_birth')->nullable()->after('email'),
                'passport_no' => fn () => $table->string('passport_no')->nullable()->after('date_of_birth'),
                'nic' => fn () => $table->string('nic')->nullable()->after('passport_no'),
                'address_line1' => fn () => $table->string('address_line1')->nullable()->after('nic'),
                'city' => fn () => $table->string('city')->nullable()->after('address_line1'),
                'postal_code' => fn () => $table->string('postal_code', 20)->nullable()->after('city'),
                'country' => fn () => $table->string('country')->default('Sri Lanka')->after('postal_code'),
                'province' => fn () => $table->string('province')->nullable()->after('country'),
                'source' => fn () => $table->string('source', 50)->nullable()->after('province'),
                'sales_person_id' => fn () => $table->string('sales_person_id')->nullable()->after('source'),
                'lead_sales_person' => fn () => $table->string('lead_sales_person')->nullable()->after('sales_person_id'),
                'other_sales_person' => fn () => $table->string('other_sales_person')->nullable()->after('lead_sales_person'),
                'support_person' => fn () => $table->string('support_person')->nullable()->after('other_sales_person'),
                'customer_status' => fn () => $table->string('customer_status', 50)->default('Product')->after('support_person'),
                'product' => fn () => $table->string('product')->nullable()->after('customer_status'),
                'opening_balance' => fn () => $table->decimal('opening_balance', 15, 2)->default(0)->after('credit_limit'),
                'notes' => fn () => $table->text('notes')->nullable()->after('opening_balance'),
                'language' => fn () => $table->string('language', 50)->nullable()->after('notes'),
                'inventory_location' => fn () => $table->string('inventory_location')->nullable()->after('language'),
                'customer_type_id' => fn () => $table->unsignedBigInteger('customer_type_id')->nullable()->after('inventory_location'),
                'customer_discount' => fn () => $table->decimal('customer_discount', 8, 2)->default(0)->after('customer_type_id'),
            ];

            foreach ($columns as $name => $callback) {
                if (!Schema::hasColumn('customers', $name)) {
                    $callback();
                }
            }
        });

        // Backfill first_name from customer_name for existing rows
        if (Schema::hasColumn('customers', 'first_name')) {
            \DB::table('customers')
                ->whereNull('first_name')
                ->update(['first_name' => \DB::raw('customer_name')]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_advance_payments');
        Schema::dropIfExists('customer_types');

        $cols = [
            'first_name', 'business_name', 'allow_duplicate_phone', 'date_of_birth', 'passport_no', 'nic',
            'address_line1', 'city', 'postal_code', 'country', 'province', 'source',
            'sales_person_id', 'lead_sales_person', 'other_sales_person', 'support_person',
            'customer_status', 'product', 'opening_balance', 'notes', 'language',
            'inventory_location', 'customer_type_id', 'customer_discount',
        ];

        Schema::table('customers', function (Blueprint $table) use ($cols) {
            $existing = array_filter($cols, fn ($c) => Schema::hasColumn('customers', $c));
            if ($existing !== []) {
                $table->dropColumn($existing);
            }
        });
    }
};
