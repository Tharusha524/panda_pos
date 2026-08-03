<?php

namespace App\Services;

use App\Models\ApiSetting;
use App\Models\Company;
use App\Models\User;
use Illuminate\Support\Facades\Crypt;

class SmsConfigService
{
    public function __construct(private CompanyNotificationSettingService $companyNotificationSettingService)
    {
    }

    /**
     * Company notification settings → API settings → .env.
     *
     * @return array<string, mixed>|null
     */
    public function resolveForUser(User $user): ?array
    {
        $companyId = $user->company_id;
        if ($companyId) {
            $companyGateway = $this->resolveForCompanyId((int) $companyId);
            if ($companyGateway !== null) {
                return $companyGateway;
            }
        }

        $fromApi = $this->resolveFromApiSettings($user);
        if ($fromApi !== null) {
            return $fromApi;
        }

        return $this->resolveFromEnv();
    }

    /**
     * @return array<string, mixed>|null
     */
    public function resolveForCompany(Company $company): ?array
    {
        return $this->resolveForCompanyId((int) $company->id);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function resolveForCompanyId(int $companyId): ?array
    {
        $company = Company::find($companyId);
        if (!$company) {
            return null;
        }

        $setting = $this->companyNotificationSettingService->getOrCreateSetting($company);
        $provider = strtolower((string) ($setting->sms_provider ?? 'http'));

        if ($provider === 'log') {
            return ['provider' => 'log', 'source' => 'company'];
        }

        if ($provider === 'twilio') {
            return $this->resolveFromEnv(); // twilio still from env for now
        }

        if (!empty($setting->sms_api_url)) {
            return [
                'provider' => 'http',
                'url' => rtrim((string) $setting->sms_api_url, '/'),
                'key' => $this->companyNotificationSettingService->decryptSmsApiKey($setting->sms_api_key),
                'source' => 'company',
            ];
        }

        return null;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function resolveFromApiSettings(User $user): ?array
    {
        $companyId = $user->company_id;

        $setting = $companyId
            ? ApiSetting::query()
                ->whereNotNull('sms_api_url')
                ->where('sms_api_url', '!=', '')
                ->whereHas('user', fn ($q) => $q->where('company_id', $companyId))
                ->first()
            : ApiSetting::query()->where('user_id', $user->id)->first();

        if (!$setting || empty($setting->sms_api_url)) {
            return null;
        }

        $key = null;
        if (!empty($setting->sms_api_key)) {
            try {
                $key = Crypt::decryptString($setting->sms_api_key);
            } catch (\Throwable) {
                $key = null;
            }
        }

        return [
            'provider' => 'http',
            'url' => rtrim((string) $setting->sms_api_url, '/'),
            'key' => $key,
            'source' => 'api_settings',
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function resolveFromEnv(): ?array
    {
        $provider = strtolower((string) config('sms.default', 'none'));

        if ($provider === '' || $provider === 'none') {
            return null;
        }

        if ($provider === 'log') {
            return ['provider' => 'log', 'source' => 'env'];
        }

        if ($provider === 'twilio') {
            $sid = (string) config('sms.twilio.account_sid');
            $token = (string) config('sms.twilio.auth_token');
            $from = (string) config('sms.twilio.from');

            if ($sid === '' || $token === '' || $from === '') {
                return null;
            }

            return [
                'provider' => 'twilio',
                'account_sid' => $sid,
                'auth_token' => $token,
                'from' => $from,
                'source' => 'env',
            ];
        }

        $url = config('sms.http.url');
        if (!$url) {
            return null;
        }

        return [
            'provider' => 'http',
            'url' => rtrim((string) $url, '/'),
            'key' => config('sms.http.key') ?: null,
            'source' => 'env',
        ];
    }

    /**
     * @return array{configured: bool, provider: ?string, source: ?string, hint: string}
     */
    public function statusForUser(User $user): array
    {
        $gateway = $this->resolveForUser($user);

        if ($gateway === null) {
            return [
                'configured' => false,
                'provider' => null,
                'source' => null,
                'hint' => 'Company owner must configure SMS in Settings → Company → Alert notifications (SMS API URL and key).',
            ];
        }

        return [
            'configured' => true,
            'provider' => $gateway['provider'],
            'source' => $gateway['source'] ?? null,
            'hint' => match ($gateway['provider']) {
                'log' => 'SMS test mode — messages go to laravel.log only.',
                'twilio' => 'Twilio SMS configured.',
                default => 'Company SMS gateway configured.',
            },
        ];
    }
}
