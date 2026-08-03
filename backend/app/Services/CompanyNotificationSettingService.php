<?php

namespace App\Services;

use App\Models\Company;
use App\Models\CompanyNotificationSetting;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\Crypt;

class CompanyNotificationSettingService
{
    public function __construct(
        private CompanySettingService $companySettingService,
        private PermissionService $permissionService,
    ) {
    }

    public function getForUser(User $user): array
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $setting = $this->getOrCreateSetting($company);

        return $this->formatSetting($setting, $company);
    }

    public function updateForUser(User $user, array $data): array
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $this->assertCanConfigure($user, $company);

        $setting = $this->getOrCreateSetting($company);
        $payload = [];

        foreach (['alerts_enabled', 'send_email', 'send_sms', 'notify_owner', 'notify_employees', 'daily_digest'] as $field) {
            if (array_key_exists($field, $data)) {
                $payload[$field] = (bool) $data[$field];
            }
        }

        foreach (['smtp_host', 'smtp_username', 'mail_from_address', 'mail_from_name', 'sms_api_url'] as $field) {
            if (array_key_exists($field, $data)) {
                $payload[$field] = $data[$field] !== null && $data[$field] !== ''
                    ? trim((string) $data[$field])
                    : null;
            }
        }

        if (array_key_exists('smtp_port', $data)) {
            $port = $data['smtp_port'] !== null && $data['smtp_port'] !== '' ? (int) $data['smtp_port'] : null;
            if ($port !== null && ($port < 1 || $port > 65535)) {
                throw new Exception('SMTP port must be between 1 and 65535.');
            }
            $payload['smtp_port'] = $port;
        }

        if (array_key_exists('smtp_encryption', $data)) {
            $enc = $data['smtp_encryption'] !== null ? strtolower((string) $data['smtp_encryption']) : null;
            if ($enc !== null && $enc !== '' && !in_array($enc, ['tls', 'ssl', 'none'], true)) {
                throw new Exception('SMTP encryption must be tls, ssl, or none.');
            }
            $payload['smtp_encryption'] = $enc === 'none' || $enc === '' ? null : $enc;
        }

        if (array_key_exists('mail_from_address', $data) && !empty($payload['mail_from_address'])) {
            if (!filter_var($payload['mail_from_address'], FILTER_VALIDATE_EMAIL)) {
                throw new Exception('From email address must be valid.');
            }
        }

        if (array_key_exists('sms_provider', $data)) {
            $provider = strtolower((string) $data['sms_provider']);
            if (!in_array($provider, ['http', 'twilio', 'log'], true)) {
                throw new Exception('SMS provider must be http, twilio, or log.');
            }
            $payload['sms_provider'] = $provider;
        }

        if (!empty($data['smtp_password'])) {
            $payload['smtp_password'] = Crypt::encryptString((string) $data['smtp_password']);
        }

        if (!empty($data['sms_api_key'])) {
            $payload['sms_api_key'] = Crypt::encryptString((string) $data['sms_api_key']);
        }

        if ($payload !== []) {
            $setting->update($payload);
        }

        return $this->formatSetting($setting->fresh(), $company->fresh());
    }

    public function getOrCreateSetting(Company $company): CompanyNotificationSetting
    {
        return CompanyNotificationSetting::firstOrCreate(
            ['company_id' => $company->id],
            [
                'mail_from_name' => $company->name,
                'mail_from_address' => $company->email,
            ]
        );
    }

    public function assertCanConfigure(User $user, Company $company): void
    {
        if ($this->permissionService->isAdmin($user)) {
            return;
        }

        if ((int) $company->user_id === (int) $user->id) {
            return;
        }

        throw new Exception('Only the company owner or an administrator can configure company notifications.');
    }

    public function markBroadcast(Company $company): void
    {
        $this->getOrCreateSetting($company)->update(['last_broadcast_at' => now()]);
    }

    /**
     * @return array<string, mixed>
     */
    public function formatSetting(CompanyNotificationSetting $setting, Company $company): array
    {
        return [
            'id' => $setting->id,
            'company_id' => $setting->company_id,
            'company_name' => $company->name,
            'company_email' => $company->email ?? '',
            'company_phone' => $company->phone ?? '',
            'alerts_enabled' => (bool) $setting->alerts_enabled,
            'send_email' => (bool) $setting->send_email,
            'send_sms' => (bool) $setting->send_sms,
            'notify_owner' => (bool) $setting->notify_owner,
            'notify_employees' => (bool) $setting->notify_employees,
            'daily_digest' => (bool) $setting->daily_digest,
            'last_broadcast_at' => $setting->last_broadcast_at?->format('Y-m-d H:i:s'),
            'smtp_host' => $setting->smtp_host,
            'smtp_port' => $setting->smtp_port,
            'smtp_username' => $setting->smtp_username,
            'has_smtp_password' => !empty($setting->smtp_password),
            'smtp_encryption' => $setting->smtp_encryption ?? 'tls',
            'mail_from_address' => $setting->mail_from_address ?? $company->email,
            'mail_from_name' => $setting->mail_from_name ?? $company->name,
            'sms_api_url' => $setting->sms_api_url,
            'sms_provider' => $setting->sms_provider ?? 'http',
            'has_sms_api_key' => !empty($setting->sms_api_key),
            'email_configured' => !empty($setting->smtp_host) && !empty($setting->mail_from_address),
            'sms_configured' => !empty($setting->sms_api_url) || ($setting->sms_provider ?? '') === 'log',
        ];
    }

    public function decryptSmtpPassword(?string $encrypted): ?string
    {
        if (empty($encrypted)) {
            return null;
        }

        try {
            return Crypt::decryptString($encrypted);
        } catch (\Throwable) {
            return null;
        }
    }

    public function decryptSmsApiKey(?string $encrypted): ?string
    {
        if (empty($encrypted)) {
            return null;
        }

        try {
            return Crypt::decryptString($encrypted);
        } catch (\Throwable) {
            return null;
        }
    }
}
