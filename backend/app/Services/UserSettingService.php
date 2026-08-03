<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserSetting;
use Exception;

class UserSettingService
{
    public function __construct(private RoleService $roleService)
    {
    }
    public function getForUser(User $user): array
    {
        $setting = $this->getOrCreateSetting($user);
        $user->load('roleModel');

        return $this->formatResponse($user, $setting);
    }

    public function updateForUser(User $user, array $data): array
    {
        if (isset($data['email']) && $data['email'] !== $user->email) {
            $exists = User::where('email', $data['email'])
                ->where('id', '!=', $user->id)
                ->exists();

            if ($exists) {
                throw new Exception('Email already exists');
            }
        }

        $setting = $this->getOrCreateSetting($user);

        $userPayload = [];
        if (array_key_exists('first_name', $data) || array_key_exists('last_name', $data)) {
            $userPayload['name'] = $this->buildFullName(
                $data['first_name'] ?? $setting->first_name,
                $data['last_name'] ?? $setting->last_name,
                $user->name
            );
        }
        if (array_key_exists('email', $data)) {
            $userPayload['email'] = $data['email'];
        }
        if (array_key_exists('phone', $data)) {
            $userPayload['phone'] = $data['phone'];
        }
        if (array_key_exists('role', $data)) {
            $role = $this->roleService->getBySlug($data['role']);
            if (!$role) {
                throw new Exception('Invalid role selected');
            }
            $userPayload['role'] = $role->slug;
            $userPayload['role_id'] = $role->id;
        }
        if ($userPayload !== []) {
            $user->update($userPayload);
        }

        $settingPayload = [];
        if (array_key_exists('first_name', $data)) {
            $settingPayload['first_name'] = $data['first_name'];
        }
        if (array_key_exists('last_name', $data)) {
            $settingPayload['last_name'] = $data['last_name'];
        }
        if (array_key_exists('two_factor_enabled', $data)) {
            $settingPayload['two_factor_enabled'] = (bool) $data['two_factor_enabled'];
        }
        if ($settingPayload !== []) {
            $setting->update($settingPayload);
        }

        $user->refresh()->load('roleModel');
        $setting->refresh();

        return $this->formatResponse($user, $setting);
    }

    private function getOrCreateSetting(User $user): UserSetting
    {
        $parts = preg_split('/\s+/', trim($user->name), 2);

        return UserSetting::firstOrCreate(
            ['user_id' => $user->id],
            [
                'first_name' => $parts[0] ?? '',
                'last_name' => $parts[1] ?? '',
                'two_factor_enabled' => false,
            ]
        );
    }

    private function buildFullName(?string $first, ?string $last, string $fallback): string
    {
        $fullName = trim(($first ?? '') . ' ' . ($last ?? ''));

        return $fullName !== '' ? $fullName : $fallback;
    }

    private function formatResponse(User $user, UserSetting $setting): array
    {
        return [
            'user_id' => $user->id,
            'first_name' => $setting->first_name ?? '',
            'last_name' => $setting->last_name ?? '',
            'email' => $user->email,
            'phone' => $user->phone ?? '',
            'role' => $user->role,
            'role_id' => $user->role_id,
            'role_name' => $user->roleModel?->name,
            'role_permissions' => $user->roleModel->permissions ?? [],
            'two_factor_enabled' => (bool) $setting->two_factor_enabled,
        ];
    }
}
