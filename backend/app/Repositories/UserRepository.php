<?php

namespace App\Repositories;

use App\Interfaces\UserRepositoryInterface;
use App\Models\Company;
use App\Models\User;
use App\Support\UserSchema;

class UserRepository implements UserRepositoryInterface
{
    /**
     * Get all users with pagination
     */
    public function getAll(int $perPage = 15)
    {
        return User::with('roleModel')->orderBy('id')->paginate($perPage);
    }

    public function getAllForCompany(int $companyId, int $perPage = 15)
    {
        $query = User::with('roleModel')->orderBy('id');

        if (UserSchema::hasCompanyIdColumn()) {
            $ownerUserIds = Company::where('id', $companyId)
                ->whereNotNull('user_id')
                ->pluck('user_id');

            $query->where(function ($q) use ($companyId, $ownerUserIds) {
                $q->where('company_id', $companyId);
                if ($ownerUserIds->isNotEmpty()) {
                    $q->orWhereIn('id', $ownerUserIds);
                }
            });
        }

        return $query->paginate($perPage);
    }

    /**
     * Get user by ID
     */
    public function getById(int $id)
    {
        return User::with('roleModel')->find($id);
    }

    public function getByIdForCompany(int $id, int $companyId)
    {
        $query = User::with('roleModel')->where('id', $id);

        if (UserSchema::hasCompanyIdColumn()) {
            $ownerUserIds = Company::where('id', $companyId)
                ->whereNotNull('user_id')
                ->pluck('user_id');

            $query->where(function ($q) use ($companyId, $ownerUserIds) {
                $q->where('company_id', $companyId);
                if ($ownerUserIds->isNotEmpty()) {
                    $q->orWhereIn('id', $ownerUserIds);
                }
            });
        }

        return $query->first();
    }

    public function searchForCompany(string $queryText, int $companyId, int $perPage = 15)
    {
        $base = User::with('roleModel');

        if (UserSchema::hasCompanyIdColumn()) {
            $ownerUserIds = Company::where('id', $companyId)
                ->whereNotNull('user_id')
                ->pluck('user_id');

            $base->where(function ($q) use ($companyId, $ownerUserIds) {
                $q->where('company_id', $companyId);
                if ($ownerUserIds->isNotEmpty()) {
                    $q->orWhereIn('id', $ownerUserIds);
                }
            });
        }

        return $base->where(function ($q) use ($queryText) {
            $q->where('name', 'like', "%{$queryText}%")
                ->orWhere('email', 'like', "%{$queryText}%")
                ->orWhere('phone', 'like', "%{$queryText}%");
        })->paginate($perPage);
    }

    /**
     * Get user by email
     */
    public function getByEmail(string $email)
    {
        return User::where('email', $email)->first();
    }

    /**
     * Create a new user
     */
    public function create(array $data)
    {
        $user = User::create($data);
        return $user->load('roleModel');
    }

    /**
     * Update user
     */
    public function update(int $id, array $data)
    {
        $user = User::find($id);
        if ($user) {
            $user->update($data);
            return $user->fresh()->load('roleModel');
        }
        return null;
    }

    /**
     * Delete user
     */
    public function delete(int $id)
    {
        $user = User::find($id);
        if ($user) {
            return $user->delete();
        }
        return false;
    }

    /**
     * Search users by name or email
     */
    public function search(string $query, int $perPage = 15)
    {
        return User::where('name', 'like', "%{$query}%")
            ->orWhere('email', 'like', "%{$query}%")
            ->orWhere('phone', 'like', "%{$query}%")
            ->paginate($perPage);
    }

    /**
     * Check if email exists
     */
    public function emailExists(string $email, int $exceptId = null)
    {
        $query = User::where('email', $email);
        if ($exceptId) {
            $query->where('id', '!=', $exceptId);
        }
        return $query->exists();
    }
}
