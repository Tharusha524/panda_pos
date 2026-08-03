<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Facades\Schema;

final class UserSchema
{
    private static ?bool $hasCompanyId = null;

    public static function hasCompanyIdColumn(): bool
    {
        return self::$hasCompanyId ??= Schema::hasColumn('users', 'company_id');
    }

    public static function companyIdFor(User $user): ?int
    {
        if (!self::hasCompanyIdColumn()) {
            return null;
        }

        $id = $user->company_id;

        return $id !== null ? (int) $id : null;
    }
}
