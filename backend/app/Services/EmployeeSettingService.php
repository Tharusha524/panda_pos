<?php

namespace App\Services;

use App\Models\EmployeeSetting;
use App\Models\User;

class EmployeeSettingService
{
    public function getForUser(User $user): array
    {
        return $this->formatSetting($this->getOrCreateSetting($user));
    }

    public function updateForUser(User $user, array $data): array
    {
        $setting = $this->getOrCreateSetting($user);

        if (array_key_exists('allow_employee_auto_number', $data)) {
            $setting->update([
                'allow_employee_auto_number' => (bool) $data['allow_employee_auto_number'],
            ]);
        }

        return $this->formatSetting($setting->fresh());
    }

    public function isAutoNumberEnabled(User $user): bool
    {
        return (bool) $this->getOrCreateSetting($user)->allow_employee_auto_number;
    }

    private function getOrCreateSetting(User $user): EmployeeSetting
    {
        return EmployeeSetting::firstOrCreate(
            ['user_id' => $user->id],
            ['allow_employee_auto_number' => true]
        );
    }

    private function formatSetting(EmployeeSetting $setting): array
    {
        return [
            'id' => $setting->id,
            'allow_employee_auto_number' => (bool) $setting->allow_employee_auto_number,
        ];
    }
}
