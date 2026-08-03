<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('api_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->boolean('api_enabled')->default(false);
            $table->string('public_base_url', 500)->nullable();
            $table->text('integration_api_key')->nullable();
            $table->boolean('webhook_enabled')->default(false);
            $table->string('webhook_url', 500)->nullable();
            $table->text('webhook_secret')->nullable();
            $table->text('cors_allowed_origins')->nullable();
            $table->boolean('mobile_sync_enabled')->default(false);
            $table->unsignedSmallInteger('mobile_sync_interval_seconds')->default(300);
            $table->string('sms_api_url', 500)->nullable();
            $table->text('sms_api_key')->nullable();
            $table->string('payment_gateway', 50)->default('none');
            $table->text('payment_gateway_key')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('api_settings');
    }
};
