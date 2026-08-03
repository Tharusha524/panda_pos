<?php

namespace App\Services;

use App\Models\AlertSetting;
use App\Models\User;
use Exception;

class AlertSettingService
{
    public function getForUser(User $user): array
    {
        return $this->formatSetting($this->getOrCreateSetting($user));
    }

    public function updateForUser(User $user, array $data): array
    {
        $setting = $this->getOrCreateSetting($user);
        $payload = [];

        if (array_key_exists('expiry_alert_period_days', $data)) {
            $days = (int) $data['expiry_alert_period_days'];
            if ($days < 0 || $days > 365) {
                throw new Exception('Expiry alert period must be between 0 and 365 days.');
            }
            $payload['expiry_alert_period_days'] = $days;
        }

        if (array_key_exists('cheque_alert_period_days', $data)) {
            $days = (int) $data['cheque_alert_period_days'];
            if ($days < 0 || $days > 365) {
                throw new Exception('Cheque alert period must be between 0 and 365 days.');
            }
            $payload['cheque_alert_period_days'] = $days;
        }

        if (array_key_exists('staff_notify_email', $data)) {
            $email = $data['staff_notify_email'] !== null && $data['staff_notify_email'] !== ''
                ? trim((string) $data['staff_notify_email'])
                : null;
            if ($email !== null && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw new Exception('Staff notification email must be a valid email address.');
            }
            $payload['staff_notify_email'] = $email;
        }

        if (array_key_exists('staff_notify_phone', $data)) {
            $phone = $data['staff_notify_phone'] !== null && $data['staff_notify_phone'] !== ''
                ? preg_replace('/\s+/', '', (string) $data['staff_notify_phone'])
                : null;
            if ($phone !== null && strlen($phone) < 9) {
                throw new Exception('Staff notification phone must be at least 9 digits.');
            }
            $payload['staff_notify_phone'] = $phone;
        }

        foreach (['staff_send_email', 'staff_send_sms', 'staff_daily_digest'] as $boolField) {
            if (array_key_exists($boolField, $data)) {
                $payload[$boolField] = (bool) $data[$boolField];
            }
        }

        if ($payload !== []) {
            $setting->update($payload);
        }

        return $this->formatSetting($setting->fresh());
    }

    public function markStaffNotified(User $user): void
    {
        $this->getOrCreateSetting($user)->update([
            'staff_last_notified_at' => now(),
        ]);
    }

    /**
     * @return array{email: ?string, phone: ?string, send_email: bool, send_sms: bool, daily_digest: bool}
     */
    public function getStaffDeliveryTargets(User $user): array
    {
        $setting = $this->getOrCreateSetting($user);

        return [
            'email' => $user->email,
            'phone' => $user->phone ?: null,
            'send_email' => (bool) $setting->staff_send_email,
            'send_sms' => (bool) $setting->staff_send_sms,
            'daily_digest' => (bool) $setting->staff_daily_digest,
            'last_notified_at' => $setting->staff_last_notified_at?->format('Y-m-d H:i:s'),
        ];
    }

    private function getOrCreateSetting(User $user): AlertSetting
    {
        return AlertSetting::firstOrCreate(
            ['user_id' => $user->id],
            [
                'expiry_alert_period_days' => 7,
                'cheque_alert_period_days' => 10,
                'staff_send_email' => false,
                'staff_send_sms' => false,
                'staff_daily_digest' => true,
            ]
        );
    }

    private function formatSetting(AlertSetting $setting): array
    {
        return [
            'id' => $setting->id,
            'expiry_alert_period_days' => (int) $setting->expiry_alert_period_days,
            'cheque_alert_period_days' => (int) $setting->cheque_alert_period_days,
            'staff_notify_email' => $setting->staff_notify_email,
            'staff_notify_phone' => $setting->staff_notify_phone,
            'staff_send_email' => (bool) $setting->staff_send_email,
            'staff_send_sms' => (bool) $setting->staff_send_sms,
            'staff_daily_digest' => (bool) $setting->staff_daily_digest,
            'staff_last_notified_at' => $setting->staff_last_notified_at?->format('Y-m-d H:i:s'),
        ];
    }
}
