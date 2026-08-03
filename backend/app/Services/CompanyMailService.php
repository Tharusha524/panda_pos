<?php

namespace App\Services;

use App\Models\CompanyNotificationSetting;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Mail;

class CompanyMailService
{
    public function __construct(private CompanyNotificationSettingService $companyNotificationSettingService)
    {
    }

    public function send(
        CompanyNotificationSetting $setting,
        string $to,
        string $subject,
        string $htmlBody,
        ?string $textBody = null,
    ): void {
        if (empty($setting->smtp_host)) {
            $this->sendWithDefaultMailer($to, $subject, $htmlBody, $textBody, $setting);

            return;
        }

        $password = $this->companyNotificationSettingService->decryptSmtpPassword($setting->smtp_password);
        $encryption = $setting->smtp_encryption ?: null;

        Config::set('mail.mailers.company_alert', [
            'transport' => 'smtp',
            'host' => $setting->smtp_host,
            'port' => (int) ($setting->smtp_port ?: 587),
            'encryption' => $encryption,
            'username' => $setting->smtp_username,
            'password' => $password,
            'timeout' => null,
        ]);

        $fromAddress = $setting->mail_from_address ?: config('mail.from.address');
        $fromName = $setting->mail_from_name ?: config('mail.from.name');

        Mail::mailer('company_alert')->send([], [], function ($message) use ($to, $subject, $htmlBody, $textBody, $fromAddress, $fromName) {
            $message->to($to)->subject($subject);
            $message->html($htmlBody);
            if ($textBody) {
                $message->text($textBody);
            }
            if ($fromAddress) {
                $message->from($fromAddress, $fromName ?: null);
            }
        });
    }

    private function sendWithDefaultMailer(
        string $to,
        string $subject,
        string $htmlBody,
        ?string $textBody,
        CompanyNotificationSetting $setting,
    ): void {
        $fromAddress = $setting->mail_from_address ?: config('mail.from.address');
        $fromName = $setting->mail_from_name ?: config('mail.from.name');

        Mail::send([], [], function ($message) use ($to, $subject, $htmlBody, $textBody, $fromAddress, $fromName) {
            $message->to($to)->subject($subject);
            $message->html($htmlBody);
            if ($textBody) {
                $message->text($textBody);
            }
            if ($fromAddress) {
                $message->from($fromAddress, $fromName ?: null);
            }
        });
    }
}
