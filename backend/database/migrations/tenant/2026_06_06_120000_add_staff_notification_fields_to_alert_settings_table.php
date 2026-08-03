<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('alert_settings', function (Blueprint $table) {
            $table->string('staff_notify_email')->nullable()->after('cheque_alert_period_days');
            $table->string('staff_notify_phone', 32)->nullable()->after('staff_notify_email');
            $table->boolean('staff_send_email')->default(false)->after('staff_notify_phone');
            $table->boolean('staff_send_sms')->default(false)->after('staff_send_email');
            $table->boolean('staff_daily_digest')->default(true)->after('staff_send_sms');
            $table->timestamp('staff_last_notified_at')->nullable()->after('staff_daily_digest');
        });
    }

    public function down(): void
    {
        Schema::table('alert_settings', function (Blueprint $table) {
            $table->dropColumn([
                'staff_notify_email',
                'staff_notify_phone',
                'staff_send_email',
                'staff_send_sms',
                'staff_daily_digest',
                'staff_last_notified_at',
            ]);
        });
    }
};
