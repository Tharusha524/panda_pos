<?php

namespace App\Services;

use App\Interfaces\ActivityLogRepositoryInterface;
use Illuminate\Support\Facades\Auth;

class ActivityLogService
{
    public function __construct(
        private ActivityLogRepositoryInterface $activityLogRepository,
        private PermissionService $permissionService,
    ) {
    }

    /**
     * Log user login.
     */
    public function logLogin(
        int $userId,
        ?string $email = null,
        ?string $ipAddress = null,
        ?string $userAgent = null
    ): void {
        $description = $email
            ? 'User logged in: ' . $email
            : 'User logged in';

        $this->activityLogRepository->create([
            'user_id' => $userId,
            'action' => 'login',
            'description' => $description,
            'ip_address' => $ipAddress ?? request()->ip(),
            'user_agent' => $userAgent ?? request()->userAgent(),
        ]);
    }

    /**
     * Paginated login history for the current company (admins) or own account.
     */
    public function getLoginHistoryForUser(\App\Models\User $requestUser, int $perPage = 25, ?int $filterUserId = null, int $page = 1): array
    {
        $resolved = $this->permissionService->resolveForUser($requestUser);
        $canViewAll = (bool) ($resolved['can_manage_users'] ?? false);

        $companyId = $requestUser->company_id;

        if ($canViewAll && $companyId) {
            $userIds = \App\Models\User::where('company_id', $companyId)->pluck('id');
            if ($userIds->isEmpty()) {
                $userIds = collect([$requestUser->id]);
            }
            $scopedUserId = $filterUserId;
        } else {
            $userIds = collect([$requestUser->id]);
            $scopedUserId = null;
        }

        $paginator = $this->activityLogRepository->getLoginHistory(
            $userIds->all(),
            $perPage,
            $scopedUserId,
            $page
        );

        return [
            'logs' => collect($paginator->items())->map(function ($log) {
                return [
                    'id' => $log->id,
                    'user_id' => $log->user_id,
                    'user_name' => $log->user?->name,
                    'user_email' => $log->user?->email,
                    'ip_address' => $log->ip_address,
                    'user_agent' => $log->user_agent,
                    'description' => $log->description,
                    'logged_at' => $log->created_at?->format('Y-m-d H:i:s'),
                ];
            })->values(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
            'can_view_all' => $canViewAll,
        ];
    }

    /**
     * Log user logout.
     */
    public function logLogout(int $userId): void
    {
        $this->activityLogRepository->create([
            'user_id' => $userId,
            'action' => 'logout',
            'description' => 'User logged out',
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    /**
     * Log user registration.
     */
    public function logRegistration(int $userId, array $data): void
    {
        $this->activityLogRepository->create([
            'user_id' => $userId,
            'action' => 'register',
            'model_type' => 'User',
            'model_id' => $userId,
            'description' => 'User registered',
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    /**
     * Log user creation by admin.
     */
    public function logUserCreation(int $createdUserId, array $userData): void
    {
        unset($userData['password'], $userData['new_password']);

        $this->activityLogRepository->create([
            'user_id' => Auth::id(),
            'action' => 'create',
            'model_type' => 'User',
            'model_id' => $createdUserId,
            'description' => 'Created user: ' . $userData['name'],
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    /**
     * Log user update.
     */
    public function logUserUpdate(int $userId, array $oldData, array $newData): void
    {
        unset($oldData['password'], $newData['password'], $newData['new_password'], $newData['old_password']);

        $changes = [];
        foreach ($newData as $key => $value) {
            if (isset($oldData[$key]) && $oldData[$key] !== $value) {
                $changes[$key] = [
                    'old' => $oldData[$key],
                    'new' => $value,
                ];
            }
        }

        $this->activityLogRepository->create([
            'user_id' => Auth::id(),
            'action' => 'update',
            'model_type' => 'User',
            'model_id' => $userId,
            'description' => 'Updated user profile',
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'changes' => $changes,
        ]);
    }

    /**
     * Log user deletion.
     */
    public function logUserDeletion(int $userId, string $userName): void
    {
        $this->activityLogRepository->create([
            'user_id' => Auth::id(),
            'action' => 'delete',
            'model_type' => 'User',
            'model_id' => $userId,
            'description' => 'Deleted user: ' . $userName,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    /**
     * Log password change.
     */
    public function logPasswordChange(int $userId): void
    {
        $this->activityLogRepository->create([
            'user_id' => $userId,
            'action' => 'change_password',
            'description' => 'Password changed',
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    /**
     * Log password reset.
     */
    public function logPasswordReset(int $userId, int $resetById): void
    {
        $this->activityLogRepository->create([
            'user_id' => $resetById,
            'action' => 'reset_password',
            'model_type' => 'User',
            'model_id' => $userId,
            'description' => 'Password reset performed',
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    /**
     * Log generic action.
     */
    public function log(string $action, ?int $userId = null, ?string $modelType = null, ?int $modelId = null, ?string $description = null, ?array $changes = null): void
    {
        $this->activityLogRepository->create([
            'user_id' => $userId ?? Auth::id(),
            'action' => $action,
            'model_type' => $modelType,
            'model_id' => $modelId,
            'description' => $description,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'changes' => $changes,
        ]);
    }

    public function getPaginatedForUser(\App\Models\User $user, int $perPage = 15)
    {
        $this->assertCanViewActivityLogs($user);

        return $this->activityLogRepository->getAllForUserIds($this->companyUserIds($user), $perPage);
    }

    public function getRecentForUser(\App\Models\User $user, int $limit = 50)
    {
        $this->assertCanViewActivityLogs($user);

        return $this->activityLogRepository->getRecentForUserIds($this->companyUserIds($user), $limit);
    }

    public function getByIdForUser(\App\Models\User $user, int $id)
    {
        $this->assertCanViewActivityLogs($user);

        return $this->activityLogRepository->getByIdForUserIds($id, $this->companyUserIds($user));
    }

    public function getForUserIdScoped(\App\Models\User $user, int $targetUserId, int $limit = 50)
    {
        $this->assertCanViewActivityLogs($user);

        return $this->activityLogRepository->getForUserScoped(
            $targetUserId,
            $this->companyUserIds($user),
            $limit
        );
    }

    public function getForModelScoped(\App\Models\User $user, string $modelType, int $modelId, int $limit = 50)
    {
        $this->assertCanViewActivityLogs($user);

        return $this->activityLogRepository->getForModelScoped(
            $modelType,
            $modelId,
            $this->companyUserIds($user),
            $limit
        );
    }

    public function getByActionForUser(\App\Models\User $user, string $action, int $limit = 50)
    {
        $this->assertCanViewActivityLogs($user);

        return $this->activityLogRepository->getByActionForUserIds(
            $action,
            $this->companyUserIds($user),
            $limit
        );
    }

    private function assertCanViewActivityLogs(\App\Models\User $user): void
    {
        if (!$this->permissionService->canManageUsers($user)) {
            throw new \Exception('You do not have permission to view activity logs.');
        }
    }

    /**
     * @return list<int>
     */
    private function companyUserIds(\App\Models\User $user): array
    {
        $companyId = $user->company_id;
        if (!$companyId) {
            return [(int) $user->id];
        }

        $ids = \App\Models\User::where('company_id', $companyId)->pluck('id')->all();
        $ownerIds = \App\Models\Company::where('id', $companyId)
            ->whereNotNull('user_id')
            ->pluck('user_id')
            ->all();

        return array_values(array_unique(array_merge($ids, $ownerIds, [(int) $user->id])));
    }
}
