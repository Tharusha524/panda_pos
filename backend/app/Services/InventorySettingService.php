<?php

namespace App\Services;

use App\Models\InventorySetting;
use App\Models\User;
use Exception;

class InventorySettingService
{
    private const COSTING_METHODS = ['FIFO', 'LIFO'];

    public function getForUser(User $user): array
    {
        return $this->formatSetting($this->getOrCreateSetting($user));
    }

    public function updateForUser(User $user, array $data): array
    {
        $setting = $this->getOrCreateSetting($user);
        $payload = [];

        if (array_key_exists('costing_method', $data)) {
            $method = strtoupper((string) $data['costing_method']);
            if (!in_array($method, self::COSTING_METHODS, true)) {
                throw new Exception('Invalid costing method. Use FIFO or LIFO.');
            }
            $payload['costing_method'] = $method;
        }

        foreach ([
            'manage_multiple_locations',
            'allow_tog',
            'allow_request_for_quotation',
            'allow_inventory_location_filter',
        ] as $field) {
            if (array_key_exists($field, $data)) {
                $payload[$field] = (bool) $data[$field];
            }
        }

        if ($payload !== []) {
            $setting->update($payload);
        }

        return $this->formatSetting($setting->fresh());
    }

    private function getOrCreateSetting(User $user): InventorySetting
    {
        return InventorySetting::firstOrCreate(
            ['user_id' => $user->id],
            [
                'manage_multiple_locations' => true,
                'costing_method' => 'FIFO',
                'allow_tog' => true,
                'allow_request_for_quotation' => true,
                'allow_inventory_location_filter' => true,
            ]
        );
    }

    private function formatSetting(InventorySetting $setting): array
    {
        return [
            'id' => $setting->id,
            'manage_multiple_locations' => (bool) $setting->manage_multiple_locations,
            'costing_method' => $setting->costing_method,
            'allow_tog' => (bool) $setting->allow_tog,
            'allow_request_for_quotation' => (bool) $setting->allow_request_for_quotation,
            'allow_inventory_location_filter' => (bool) $setting->allow_inventory_location_filter,
        ];
    }
}
