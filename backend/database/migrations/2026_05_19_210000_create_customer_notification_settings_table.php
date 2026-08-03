<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_notification_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->boolean('sales_enabled')->default(true);
            $table->boolean('sales_send_email')->default(true);
            $table->boolean('sales_send_sms')->default(true);
            $table->string('sales_email_subject')->nullable();
            $table->text('sales_email_body')->nullable();
            $table->text('sales_sms_template')->nullable();

            $table->boolean('payment_enabled')->default(true);
            $table->boolean('payment_send_email')->default(true);
            $table->boolean('payment_send_sms')->default(true);
            $table->string('payment_email_subject')->nullable();
            $table->text('payment_email_body')->nullable();
            $table->text('payment_sms_template')->nullable();

            $table->timestamps();
            $table->unique('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_notification_settings');
    }
};
