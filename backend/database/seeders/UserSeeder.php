<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = [
            [
                'name' => 'Admin User',
                'email' => 'admin@pos.com',
                'password' => 'admin123',
                'phone' => '1234567890',
                'city' => 'New York',
                'role' => 'admin',
                'status' => 'active',
            ],
            [
                'name' => 'Store Manager',
                'email' => 'manager@pos.com',
                'password' => 'manager123',
                'phone' => '0987654321',
                'city' => 'Los Angeles',
                'role' => 'manager',
                'status' => 'active',
            ],
            [
                'name' => 'Sales Staff',
                'email' => 'user@pos.com',
                'password' => 'user123',
                'phone' => '5555555555',
                'city' => 'Chicago',
                'role' => 'user',
                'status' => 'active',
            ],
            [
                'name' => 'Inactive User',
                'email' => 'inactive@pos.com',
                'password' => 'password123',
                'phone' => '4444444444',
                'city' => 'Houston',
                'role' => 'user',
                'status' => 'inactive',
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );
        }

        $this->syncRoleIds();

        $seedEmails = collect($users)->pluck('email');
        $extraCount = User::whereNotIn('email', $seedEmails)->count();
        if ($extraCount < 5) {
            User::factory(5 - $extraCount)->create();
            $this->syncRoleIds();
        }
    }

    private function syncRoleIds(): void
    {
        User::query()->each(function (User $user) {
            if (!$user->role) {
                return;
            }

            $role = Role::where('slug', $user->role)->first();
            if ($role && $user->role_id !== $role->id) {
                $user->update(['role_id' => $role->id]);
            }
        });
    }
}
