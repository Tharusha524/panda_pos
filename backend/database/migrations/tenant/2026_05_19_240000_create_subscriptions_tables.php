<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('cloud_id')->unique();
            $table->string('product_name')->default('Online POS Pro');
            $table->unsignedSmallInteger('license_count')->default(1);
            $table->date('period_start');
            $table->date('period_end');
            $table->decimal('monthly_charge', 12, 2)->default(0);
            $table->date('next_payment_date');
            $table->string('status')->default('active');
            $table->timestamps();

            $table->unique('company_id');
        });

        Schema::create('subscription_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subscription_id')->constrained()->cascadeOnDelete();
            $table->date('paid_at');
            $table->string('card_type', 50)->nullable();
            $table->string('card_last_four', 4)->nullable();
            $table->decimal('amount', 12, 2);
            $table->string('payment_method')->default('online');
            $table->timestamps();

            $table->index(['subscription_id', 'paid_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_payments');
        Schema::dropIfExists('subscriptions');
    }
};
