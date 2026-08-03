<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class FixUserPasswords extends Command
{
    protected $signature = 'users:fix-passwords';

    protected $description = 'Reset default seeded user passwords (fixes double-hashed passwords)';

    public function handle(): int
    {
        $defaults = [
            'admin@pos.com' => 'admin123',
            'manager@pos.com' => 'manager123',
            'user@pos.com' => 'user123',
            'inactive@pos.com' => 'password123',
        ];

        foreach ($defaults as $email => $password) {
            $user = User::where('email', $email)->first();
            if (!$user) {
                $this->warn("Skipped {$email} (not found)");
                continue;
            }
            $user->password = $password;
            $user->save();
            $this->info("Updated password for {$email}");
        }

        $this->info('Done. You can log in with admin@pos.com / admin123');

        return self::SUCCESS;
    }
}
