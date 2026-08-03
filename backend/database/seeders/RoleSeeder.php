<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            [
                'name' => 'Administrator',
                'slug' => 'admin',
                'description' => 'Full system access',
                'permissions' => ['*'],
                'is_active' => true,
            ],
            [
                'name' => 'Manager',
                'slug' => 'manager',
                'description' => 'Manage sales, inventory, and reports',
                'permissions' => [
                    'sales.view', 'sales.create', 'inventory.view', 'inventory.edit',
                    'reports.view', 'settings.view', 'users.view',
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Staff',
                'slug' => 'staff',
                'description' => 'Day-to-day POS operations',
                'permissions' => [
                    'sales.view', 'sales.create', 'inventory.view', 'customers.view',
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Operator',
                'slug' => 'operator',
                'description' => 'Register and checkout only',
                'permissions' => ['sales.view', 'sales.create', 'payments.create'],
                'is_active' => true,
            ],
            [
                'name' => 'User',
                'slug' => 'user',
                'description' => 'Basic read-only access',
                'permissions' => ['sales.view', 'inventory.view'],
                'is_active' => true,
            ],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(['slug' => $role['slug']], $role);
        }

        User::query()->each(function (User $user) {
            $role = Role::where('slug', $user->role)->first();
            if ($role) {
                $user->update(['role_id' => $role->id]);
            }
        });
    }
}
