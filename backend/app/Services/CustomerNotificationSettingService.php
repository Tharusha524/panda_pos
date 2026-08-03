<?php

namespace App\Services;

use App\Models\CustomerNotificationSetting;
use App\Models\User;

class CustomerNotificationSettingService
{
    private const BOOLEAN_FIELDS = [
        'sales_enabled',
        'sales_send_email',
        'sales_send_sms',
        'payment_enabled',
        'payment_send_email',
        'payment_send_sms',
    ];

    public function getForUser(User $user): array
    {
        return $this->formatSetting($this->getOrCreateSetting($user));
    }

    public function getSalesForUser(User $user): array
    {
        $all = $this->getForUser($user);

        return [
            'enabled' => $all['sales_enabled'],
            'send_email' => $all['sales_send_email'],
            'send_sms' => $all['sales_send_sms'],
            'email_subject' => $all['sales_email_subject'],
            'email_body' => $all['sales_email_body'],
            'sms_template' => $all['sales_sms_template'],
        ];
    }

    public function getPaymentForUser(User $user): array
    {
        $all = $this->getForUser($user);

        return [
            'enabled' => $all['payment_enabled'],
            'send_email' => $all['payment_send_email'],
            'send_sms' => $all['payment_send_sms'],
            'email_subject' => $all['payment_email_subject'],
            'email_body' => $all['payment_email_body'],
            'sms_template' => $all['payment_sms_template'],
        ];
    }

    public function updateSalesForUser(User $user, array $data): array
    {
        $mapped = [];
        if (array_key_exists('enabled', $data)) {
            $mapped['sales_enabled'] = (bool) $data['enabled'];
        }
        if (array_key_exists('send_email', $data)) {
            $mapped['sales_send_email'] = (bool) $data['send_email'];
        }
        if (array_key_exists('send_sms', $data)) {
            $mapped['sales_send_sms'] = (bool) $data['send_sms'];
        }
        if (array_key_exists('email_subject', $data)) {
            $mapped['sales_email_subject'] = $data['email_subject'];
        }
        if (array_key_exists('email_body', $data)) {
            $mapped['sales_email_body'] = $data['email_body'];
        }
        if (array_key_exists('sms_template', $data)) {
            $mapped['sales_sms_template'] = $data['sms_template'];
        }

        return $this->updateFields($user, $mapped);
    }

    public function updatePaymentForUser(User $user, array $data): array
    {
        $mapped = [];
        if (array_key_exists('enabled', $data)) {
            $mapped['payment_enabled'] = (bool) $data['enabled'];
        }
        if (array_key_exists('send_email', $data)) {
            $mapped['payment_send_email'] = (bool) $data['send_email'];
        }
        if (array_key_exists('send_sms', $data)) {
            $mapped['payment_send_sms'] = (bool) $data['send_sms'];
        }
        if (array_key_exists('email_subject', $data)) {
            $mapped['payment_email_subject'] = $data['email_subject'];
        }
        if (array_key_exists('email_body', $data)) {
            $mapped['payment_email_body'] = $data['email_body'];
        }
        if (array_key_exists('sms_template', $data)) {
            $mapped['payment_sms_template'] = $data['sms_template'];
        }

        return $this->updateFields($user, $mapped);
    }

    private function updateFields(User $user, array $data): array
    {
        $setting = $this->getOrCreateSetting($user);
        $payload = [];

        foreach (self::BOOLEAN_FIELDS as $field) {
            if (array_key_exists($field, $data)) {
                $payload[$field] = (bool) $data[$field];
            }
        }

        foreach ([
            'sales_email_subject',
            'sales_email_body',
            'sales_sms_template',
            'payment_email_subject',
            'payment_email_body',
            'payment_sms_template',
        ] as $field) {
            if (array_key_exists($field, $data)) {
                $payload[$field] = $data[$field];
            }
        }

        if ($payload !== []) {
            $setting->update($payload);
        }

        return $this->formatSetting($setting->fresh());
    }

    private function getOrCreateSetting(User $user): CustomerNotificationSetting
    {
        return CustomerNotificationSetting::firstOrCreate(
            ['user_id' => $user->id],
            [
                'sales_enabled' => true,
                'sales_send_email' => true,
                'sales_send_sms' => true,
                'sales_email_subject' => 'Your order confirmation',
                'sales_email_body' => 'Thank you for your purchase. Order #{order_id} total: {amount}.',
                'sales_sms_template' => 'Thank you! Order #{order_id} confirmed. Total: {amount}.',
                'payment_enabled' => true,
                'payment_send_email' => true,
                'payment_send_sms' => true,
                'payment_email_subject' => 'Payment received',
                'payment_email_body' => 'We received your payment of {amount} for order #{order_id}.',
                'payment_sms_template' => 'Payment received: {amount} for order #{order_id}. Thank you!',
            ]
        );
    }

    private function formatSetting(CustomerNotificationSetting $setting): array
    {
        $data = ['id' => $setting->id];

        foreach (array_merge(self::BOOLEAN_FIELDS, [
            'sales_email_subject',
            'sales_email_body',
            'sales_sms_template',
            'payment_email_subject',
            'payment_email_body',
            'payment_sms_template',
        ]) as $field) {
            if (in_array($field, self::BOOLEAN_FIELDS, true)) {
                $data[$field] = (bool) $setting->{$field};
            } else {
                $data[$field] = $setting->{$field} ?? '';
            }
        }

        return $data;
    }
}
