<?php

namespace App\Services;

use App\Models\Company;
use App\Models\User;
use App\Support\UserSchema;

class PermissionService
{
    /** All POS menu / feature keys used by the frontend sidebar */
    public const POS_KEYS = [
        'pos.dashboard',
        'pos.sales',
        'pos.payments',
        'pos.expenses',
        'pos.customers',
        'pos.items',
        'pos.inventory',
        'pos.purchasing',
        'pos.suppliers',
        'pos.shipping',
        'pos.offers',
        'pos.repair',
        'pos.reports',
        'pos.settings',
        'users.manage',
    ];

    /** Map role permission strings → POS access keys */
    private const PERMISSION_TO_POS = [
        'sales.view' => ['pos.dashboard', 'pos.sales'],
        'sales.create' => ['pos.sales'],
        'inventory.view' => ['pos.items', 'pos.inventory'],
        'inventory.edit' => ['pos.items', 'pos.inventory'],
        'customers.view' => ['pos.customers'],
        'payments.create' => ['pos.payments', 'pos.expenses'],
        'purchasing.view' => ['pos.purchasing', 'pos.suppliers'],
        'shipping.view' => ['pos.shipping'],
        'offers.view' => ['pos.offers'],
        'repair.view' => ['pos.repair'],
        'reports.view' => ['pos.reports'],
        'settings.view' => ['pos.settings'],
        'users.view' => ['users.manage', 'pos.settings'],
    ];

    public function isAdmin(User $user): bool
    {
        $slug = strtolower((string) ($user->roleModel?->slug ?? $user->role ?? ''));

        return $slug === 'admin' || in_array('*', $this->rolePermissionList($user), true);
    }

    public function canManageUsers(User $user): bool
    {
        if ($this->isAdmin($user)) {
            return true;
        }

        $perms = $this->rolePermissionList($user);

        return in_array('users.view', $perms, true) || in_array('users.manage', $perms, true);
    }

    /**
     * @return list<string>
     */
    public function rolePermissionList(User $user): array
    {
        $user->loadMissing('roleModel');
        $raw = $user->roleModel?->permissions ?? [];

        if (!is_array($raw)) {
            return [];
        }

        return array_values(array_filter(array_map('strval', $raw)));
    }

    /**
     * @return array{list: list<string>, pos_access: array<string, bool>, can_manage_users: bool, is_admin: bool}
     */
    public function resolveForUser(User $user): array
    {
        $list = $this->rolePermissionList($user);
        $isAdmin = $this->isAdmin($user);
        $posAccess = [];

        foreach (self::POS_KEYS as $key) {
            $posAccess[$key] = false;
        }

        if ($isAdmin) {
            foreach (self::POS_KEYS as $key) {
                $posAccess[$key] = true;
            }

            return [
                'list' => array_merge(['*'], $list),
                'pos_access' => $posAccess,
                'can_manage_users' => true,
                'is_admin' => true,
            ];
        }

        foreach ($list as $perm) {
            foreach (self::PERMISSION_TO_POS[$perm] ?? [] as $posKey) {
                $posAccess[$posKey] = true;
            }
        }

        if (in_array('users.view', $list, true)) {
            $posAccess['users.manage'] = true;
            $posAccess['pos.settings'] = true;
        }

        if (
            $posAccess['pos.sales']
            || $posAccess['pos.payments']
            || $posAccess['pos.items']
            || $posAccess['pos.inventory']
        ) {
            $posAccess['pos.dashboard'] = true;
        }

        return [
            'list' => $list,
            'pos_access' => $posAccess,
            'can_manage_users' => $this->canManageUsers($user),
            'is_admin' => false,
        ];
    }

    public function formatUserForApi(User $user): array
    {
        $user->loadMissing('roleModel');
        $resolved = $this->resolveForUser($user);

        $company = null;
        $userCompanyId = UserSchema::companyIdFor($user);
        if ($userCompanyId) {
            $company = Company::find($userCompanyId);
        }
        if (!$company) {
            $company = Company::where('user_id', $user->id)->first();
        }

        $companyPayload = $company ? [
            'id' => $company->id,
            'name' => $company->name,
        ] : null;

        return [
            'id' => $user->id,
            'company_id' => $company?->id ?? $userCompanyId,
            'company' => $companyPayload,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'city' => $user->city,
            'role' => $user->role,
            'role_id' => $user->role_id,
            'status' => $user->status,
            'role_model' => $user->roleModel ? [
                'id' => $user->roleModel->id,
                'name' => $user->roleModel->name,
                'slug' => $user->roleModel->slug,
                'permissions' => $user->roleModel->permissions ?? [],
            ] : null,
            'permissions' => $resolved['list'],
            'pos_access' => $resolved['pos_access'],
            'can_manage_users' => $resolved['can_manage_users'],
            'is_admin' => $resolved['is_admin'],
            'profileImage' => $this->resolveProfileImage($user),
            'created_at' => $user->created_at?->toIso8601String(),
            'updated_at' => $user->updated_at?->toIso8601String(),
        ];
    }

    private function resolveProfileImage(User $user): array
    {
        if (!$user->profile_image_path) {
            return [];
        }

        $url = rtrim(config('app.url'), '/') . '/storage/' . ltrim($user->profile_image_path, '/');

        return [[
            'imageUrl' => $url,
            'fileName' => basename($user->profile_image_path),
        ]];
    }

    public function availablePermissions(): array
    {
        return [
            ['key' => 'sales.view', 'label' => 'Sales — view'],
            ['key' => 'sales.create', 'label' => 'Sales — create / edit'],
            ['key' => 'inventory.view', 'label' => 'Items / Inventory — view'],
            ['key' => 'inventory.edit', 'label' => 'Items / Inventory — edit'],
            ['key' => 'customers.view', 'label' => 'Customers — view'],
            ['key' => 'payments.create', 'label' => 'Payments & Expenses'],
            ['key' => 'purchasing.view', 'label' => 'Purchasing & Suppliers'],
            ['key' => 'shipping.view', 'label' => 'Shipping'],
            ['key' => 'offers.view', 'label' => 'Offers'],
            ['key' => 'repair.view', 'label' => 'Repair'],
            ['key' => 'reports.view', 'label' => 'Reports — view'],
            ['key' => 'settings.view', 'label' => 'Settings — view (company, items)'],
            ['key' => 'users.view', 'label' => 'Manage employee logins (admin only)'],
        ];
    }
}
