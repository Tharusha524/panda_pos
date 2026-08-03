<?php

namespace App\Services;

use App\Models\ApiSetting;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;

class ApiSettingService
{
    public function __construct(private PermissionService $permissionService)
    {
    }

    public function assertCanConfigure(User $user): void
    {
        if (!$this->permissionService->isAdmin($user) && !$this->permissionService->canManageUsers($user)) {
            throw new Exception('Only administrators can configure API settings.');
        }
    }

    public function getForUser(User $user): array
    {
        $this->assertCanConfigure($user);

        return $this->formatSetting($this->getOrCreateSetting($user));
    }

    public function updateForUser(User $user, array $data): array
    {
        $this->assertCanConfigure($user);
        $setting = $this->getOrCreateSetting($user);
        $payload = [];

        if (array_key_exists('api_enabled', $data)) {
            $payload['api_enabled'] = (bool) $data['api_enabled'];
        }

        if (array_key_exists('public_base_url', $data)) {
            $url = $data['public_base_url'] !== null && $data['public_base_url'] !== ''
                ? rtrim((string) $data['public_base_url'], '/')
                : null;
            if ($url !== null && !filter_var($url, FILTER_VALIDATE_URL)) {
                throw new Exception('Public API base URL must be a valid URL.');
            }
            $payload['public_base_url'] = $url;
        }

        if (array_key_exists('webhook_enabled', $data)) {
            $payload['webhook_enabled'] = (bool) $data['webhook_enabled'];
        }

        if (array_key_exists('webhook_url', $data)) {
            $url = $data['webhook_url'] !== null && $data['webhook_url'] !== ''
                ? (string) $data['webhook_url']
                : null;
            if ($url !== null && !filter_var($url, FILTER_VALIDATE_URL)) {
                throw new Exception('Webhook URL must be a valid URL.');
            }
            $payload['webhook_url'] = $url;
        }

        if (array_key_exists('cors_allowed_origins', $data)) {
            $payload['cors_allowed_origins'] = $data['cors_allowed_origins'] !== null
                ? trim((string) $data['cors_allowed_origins'])
                : null;
        }

        if (array_key_exists('mobile_sync_enabled', $data)) {
            $payload['mobile_sync_enabled'] = (bool) $data['mobile_sync_enabled'];
        }

        if (array_key_exists('mobile_sync_interval_seconds', $data)) {
            $seconds = (int) $data['mobile_sync_interval_seconds'];
            if ($seconds < 60 || $seconds > 86400) {
                throw new Exception('Mobile sync interval must be between 60 and 86400 seconds.');
            }
            $payload['mobile_sync_interval_seconds'] = $seconds;
        }

        if (array_key_exists('sms_api_url', $data)) {
            $url = $data['sms_api_url'] !== null && $data['sms_api_url'] !== ''
                ? rtrim((string) $data['sms_api_url'], '/')
                : null;
            if ($url !== null && !filter_var($url, FILTER_VALIDATE_URL)) {
                throw new Exception('SMS API URL must be a valid URL.');
            }
            $payload['sms_api_url'] = $url;
        }

        if (array_key_exists('payment_gateway', $data)) {
            $gateway = strtolower((string) $data['payment_gateway']);
            if (!in_array($gateway, ['none', 'stripe', 'paypal', 'custom'], true)) {
                throw new Exception('Invalid payment gateway.');
            }
            $payload['payment_gateway'] = $gateway;
        }

        if (array_key_exists('notes', $data)) {
            $payload['notes'] = $data['notes'] !== null ? trim((string) $data['notes']) : null;
        }

        if (!empty($data['integration_api_key'])) {
            $payload['integration_api_key'] = Crypt::encryptString((string) $data['integration_api_key']);
        }

        if (!empty($data['webhook_secret'])) {
            $payload['webhook_secret'] = Crypt::encryptString((string) $data['webhook_secret']);
        }

        if (!empty($data['sms_api_key'])) {
            $payload['sms_api_key'] = Crypt::encryptString((string) $data['sms_api_key']);
        }

        if (!empty($data['payment_gateway_key'])) {
            $payload['payment_gateway_key'] = Crypt::encryptString((string) $data['payment_gateway_key']);
        }

        if ($payload !== []) {
            $setting->update($payload);
        }

        return $this->formatSetting($setting->fresh());
    }

    public function regenerateIntegrationKey(User $user): array
    {
        $this->assertCanConfigure($user);
        $setting = $this->getOrCreateSetting($user);
        $plainKey = 'pos_' . Str::random(48);
        $setting->update([
            'integration_api_key' => Crypt::encryptString($plainKey),
            'api_enabled' => true,
        ]);

        $formatted = $this->formatSetting($setting->fresh());
        $formatted['integration_api_key_plain'] = $plainKey;

        return $formatted;
    }

    public function endpointCatalog(): array
    {
        return [
            ['method' => 'POST', 'path' => '/api/auth/login', 'description' => 'Employee / user login'],
            ['method' => 'GET', 'path' => '/api/auth/profile', 'description' => 'Current user profile & permissions'],
            ['method' => 'GET', 'path' => '/api/pos/dashboard', 'description' => 'Dashboard metrics'],
            ['method' => 'GET', 'path' => '/api/sales', 'description' => 'List sales'],
            ['method' => 'POST', 'path' => '/api/sales', 'description' => 'Create sale'],
            ['method' => 'GET', 'path' => '/api/items', 'description' => 'List items'],
            ['method' => 'GET', 'path' => '/api/customers', 'description' => 'List customers'],
            ['method' => 'GET', 'path' => '/api/reports/{reportKey}', 'description' => 'Run report'],
            ['method' => 'GET', 'path' => '/api/settings/api', 'description' => 'Read API configuration (admin)'],
            ['method' => 'PUT', 'path' => '/api/settings/api', 'description' => 'Update API configuration (admin)'],
        ];
    }

    private function getOrCreateSetting(User $user): ApiSetting
    {
        return ApiSetting::firstOrCreate(
            ['user_id' => $user->id],
            [
                'api_enabled' => false,
                'mobile_sync_interval_seconds' => 300,
                'payment_gateway' => 'none',
            ]
        );
    }

    private function formatSetting(ApiSetting $setting): array
    {
        return [
            'id' => $setting->id,
            'api_enabled' => (bool) $setting->api_enabled,
            'public_base_url' => $setting->public_base_url,
            'has_integration_api_key' => !empty($setting->integration_api_key),
            'integration_api_key_preview' => $this->secretPreview($setting->integration_api_key),
            'webhook_enabled' => (bool) $setting->webhook_enabled,
            'webhook_url' => $setting->webhook_url,
            'has_webhook_secret' => !empty($setting->webhook_secret),
            'webhook_secret_preview' => $this->secretPreview($setting->webhook_secret),
            'cors_allowed_origins' => $setting->cors_allowed_origins,
            'mobile_sync_enabled' => (bool) $setting->mobile_sync_enabled,
            'mobile_sync_interval_seconds' => (int) $setting->mobile_sync_interval_seconds,
            'sms_api_url' => $setting->sms_api_url,
            'has_sms_api_key' => !empty($setting->sms_api_key),
            'sms_api_key_preview' => $this->secretPreview($setting->sms_api_key),
            'payment_gateway' => $setting->payment_gateway ?? 'none',
            'has_payment_gateway_key' => !empty($setting->payment_gateway_key),
            'payment_gateway_key_preview' => $this->secretPreview($setting->payment_gateway_key),
            'notes' => $setting->notes,
            'endpoint_catalog' => $this->endpointCatalog(),
        ];
    }

    private function secretPreview(?string $encrypted): ?string
    {
        if (empty($encrypted)) {
            return null;
        }

        try {
            $plain = Crypt::decryptString($encrypted);

            return strlen($plain) > 4 ? '••••' . substr($plain, -4) : '••••';
        } catch (\Throwable) {
            return '••••';
        }
    }
}
