<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('company_notification_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();

            $table->boolean('alerts_enabled')->default(true);
            $table->boolean('send_email')->default(false);
            $table->boolean('send_sms')->default(false);
            $table->boolean('notify_owner')->default(true);
            $table->boolean('notify_employees')->default(true);
            $table->boolean('daily_digest')->default(true);
            $table->timestamp('last_broadcast_at')->nullable();

            $table->string('smtp_host')->nullable();
            $table->unsignedSmallInteger('smtp_port')->nullable();
            $table->string('smtp_username')->nullable();
            $table->text('smtp_password')->nullable();
            $table->string('smtp_encryption', 10)->nullable();
            $table->string('mail_from_address')->nullable();
            $table->string('mail_from_name')->nullable();

            $table->string('sms_api_url', 500)->nullable();
            $table->text('sms_api_key')->nullable();
            $table->string('sms_provider', 20)->default('http');

            $table->timestamps();
            $table->unique('company_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('company_notification_settings');
    }
};
