<?php

namespace App\Services;

use App\Interfaces\UserRepositoryInterface;
use App\Models\Role;
use App\Support\UserSchema;
use Exception;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class UserService
{
    private UserRepositoryInterface $userRepository;
    private ActivityLogService $activityLogService;

    public function __construct(UserRepositoryInterface $userRepository, ActivityLogService $activityLogService)
    {
        $this->userRepository = $userRepository;
        $this->activityLogService = $activityLogService;
    }

    /**
     * Register a new user
     */
    public function register(array $data)
    {
        if ($this->userRepository->emailExists($data['email'])) {
            throw new Exception('Email already exists');
        }

        $roleSlug = $data['role'] ?? 'user';
        $role = Role::where('slug', $roleSlug)->first();

        $payload = [
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'phone' => $data['phone'] ?? null,
            'city' => $data['city'] ?? null,
            'role' => $roleSlug,
            'role_id' => $role?->id,
            'status' => $data['status'] ?? 'active',
        ];

        if (UserSchema::hasCompanyIdColumn()) {
            $payload['company_id'] = $data['company_id'] ?? null;
        }

        return $this->userRepository->create($payload);
    }

    /**
     * Login user
     */
    public function login(string $email, string $password)
    {
        $user = $this->userRepository->getByEmail($email);

        if (!$user) {
            throw new Exception('User not found');
        }

        if (!Hash::check($password, $user->password)) {
            throw new Exception('Invalid credentials');
        }

        if ($user->status !== 'active') {
            throw new Exception('User account is inactive');
        }

        return $user;
    }

    /**
     * Get all users
     */
    public function getAllUsers(int $perPage = 15)
    {
        return $this->userRepository->getAll($perPage);
    }

    public function getUsersForCompany(int $companyId, int $perPage = 15)
    {
        return $this->userRepository->getAllForCompany($companyId, $perPage);
    }

    /**
     * Get user by ID
     */
    public function getUserById(int $id)
    {
        $user = $this->userRepository->getById($id);
        if (!$user) {
            throw new Exception('User not found');
        }
        return $user;
    }

    public function getUserByIdForCompany(int $id, int $companyId)
    {
        $user = $this->userRepository->getByIdForCompany($id, $companyId);
        if (!$user) {
            throw new Exception('User not found');
        }

        return $user;
    }

    /**
     * Update user
     */
    public function updateUser(int $id, array $data)
    {
        $user = $this->userRepository->getById($id);
        if (!$user) {
            throw new Exception('User not found');
        }

        // Check if email is being changed and if it already exists
        if (isset($data['email']) && $data['email'] !== $user->email) {
            if ($this->userRepository->emailExists($data['email'], $id)) {
                throw new Exception('Email already exists');
            }
        }

        if (isset($data['role'])) {
            $role = Role::where('slug', $data['role'])->first();
            if ($role) {
                $data['role_id'] = $role->id;
            }
        }

        if (isset($data['password']) && $data['password'] === '') {
            unset($data['password']);
        }

        return $this->userRepository->update($id, $data);
    }

    /**
     * Delete user
     */
    public function deleteUser(int $id)
    {
        $user = $this->userRepository->getById($id);
        if (!$user) {
            throw new Exception('User not found');
        }

        return $this->userRepository->delete($id);
    }

    /**
     * Search users
     */
    public function searchUsers(string $query, int $perPage = 15)
    {
        return $this->userRepository->search($query, $perPage);
    }

    public function searchUsersForCompany(string $query, int $companyId, int $perPage = 15)
    {
        return $this->userRepository->searchForCompany($query, $companyId, $perPage);
    }

    /**
     * Change user password
     */
    public function changePassword(int $id, string $oldPassword, string $newPassword)
    {
        $user = $this->userRepository->getById($id);
        if (!$user) {
            throw new Exception('User not found');
        }

        if (!Hash::check($oldPassword, $user->password)) {
            throw new Exception('Current password is incorrect');
        }

        $result = $this->userRepository->update($id, [
            'password' => $newPassword,
        ]);

        $this->activityLogService->logPasswordChange($id);

        return $result;
    }

    /**
     * Reset user password
     */
    public function resetPassword(int $id, string $newPassword)
    {
        $user = $this->userRepository->getById($id);
        if (!$user) {
            throw new Exception('User not found');
        }

        return $this->userRepository->update($id, [
            'password' => $newPassword,
        ]);
    }

    /**
     * Upload (replace) a user's profile image
     */
    public function uploadProfileImage(int $id, UploadedFile $file)
    {
        $user = $this->userRepository->getById($id);
        if (!$user) {
            throw new Exception('User not found');
        }

        if ($user->profile_image_path) {
            Storage::disk('public')->delete($user->profile_image_path);
        }

        $path = $file->store('profile-images', 'public');

        return $this->userRepository->update($id, ['profile_image_path' => $path]);
    }

    /**
     * Remove a user's profile image
     */
    public function deleteProfileImage(int $id)
    {
        $user = $this->userRepository->getById($id);
        if (!$user) {
            throw new Exception('User not found');
        }

        if ($user->profile_image_path) {
            Storage::disk('public')->delete($user->profile_image_path);
        }

        return $this->userRepository->update($id, ['profile_image_path' => null]);
    }
}
