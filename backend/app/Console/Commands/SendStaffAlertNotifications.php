<?php

namespace App\Console\Commands;

use App\Models\AlertSetting;
use App\Models\Company;
use App\Models\CompanyNotificationSetting;
use App\Models\User;
use App\Services\StaffAlertNotificationService;
use Illuminate\Console\Command;

class SendStaffAlertNotifications extends Command
{
    protected $signature = 'alerts:send-staff';

    protected $description = 'Send daily email/SMS inventory alerts using company setup to owner and employees';

    public function handle(StaffAlertNotificationService $service): int
    {
        $companySettings = CompanyNotificationSetting::query()
            ->where('alerts_enabled', true)
            ->where('daily_digest', true)
            ->get();

        $ownerSent = 0;
        $employeeSent = 0;

        foreach ($companySettings as $companySetting) {
            $company = Company::find($companySetting->company_id);
            if (!$company) {
                continue;
            }

            if ($companySetting->notify_owner) {
                try {
                    if ($service->sendDailyDigestToOwner($company)) {
                        $ownerSent++;
                        $this->info("Owner alert sent for company #{$company->id} ({$company->name})");
                    }
                } catch (\Throwable $e) {
                    $this->error("Owner alert failed for company #{$company->id}: {$e->getMessage()}");
                }
            }

            if (!$companySetting->notify_employees) {
                continue;
            }

            $userIds = User::where('company_id', $company->id)->pluck('id');
            $alertSettings = AlertSetting::query()
                ->whereIn('user_id', $userIds)
                ->where(function ($q) {
                    $q->where('staff_send_email', true)->orWhere('staff_send_sms', true);
                })
                ->with('user')
                ->get();

            foreach ($alertSettings as $alertSetting) {
                $user = $alertSetting->user;
                if (!$user) {
                    continue;
                }
                try {
                    if ($service->sendDailyDigestIfDue($user)) {
                        $employeeSent++;
                        $this->info("Employee alert sent to user #{$user->id} ({$user->email})");
                    }
                } catch (\Throwable $e) {
                    $this->error("Employee alert failed for user #{$user->id}: {$e->getMessage()}");
                }
            }
        }

        $this->info("Daily alerts — owner: {$ownerSent}, employees: {$employeeSent}");

        return self::SUCCESS;
    }
}
