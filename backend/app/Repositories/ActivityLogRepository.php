<?php

namespace App\Repositories;

use App\Interfaces\ActivityLogRepositoryInterface;
use App\Models\ActivityLog;
use Carbon\Carbon;

class ActivityLogRepository implements ActivityLogRepositoryInterface
{
    /**
     * Get all activity logs with pagination.
     */
    public function getAll(int $perPage = 15)
    {
        return ActivityLog::latest()->paginate($perPage);
    }

    /**
     * Get activity log by ID.
     */
    public function getById(int $id)
    {
        return ActivityLog::findOrFail($id);
    }

    /**
     * Create a new activity log.
     */
    public function create(array $data)
    {
        return ActivityLog::create($data);
    }

    /**
     * Get recent activity logs.
     */
    public function getRecent(int $limit = 50)
    {
        return ActivityLog::latest()->take($limit)->get();
    }

    /**
     * Get activity logs for a specific user.
     */
    public function getForUser(int $userId, int $limit = 50)
    {
        return ActivityLog::where('user_id', $userId)
            ->latest()
            ->take($limit)
            ->get();
    }

    public function getAllForUserIds(array $userIds, int $perPage = 15)
    {
        return ActivityLog::whereIn('user_id', $userIds)
            ->latest()
            ->paginate($perPage);
    }

    public function getRecentForUserIds(array $userIds, int $limit = 50)
    {
        return ActivityLog::whereIn('user_id', $userIds)
            ->latest()
            ->take($limit)
            ->get();
    }

    public function getByIdForUserIds(int $id, array $userIds)
    {
        return ActivityLog::whereIn('user_id', $userIds)->where('id', $id)->firstOrFail();
    }

    public function getForUserScoped(int $userId, array $allowedUserIds, int $limit = 50)
    {
        if (!in_array($userId, $allowedUserIds, true)) {
            return collect();
        }

        return $this->getForUser($userId, $limit);
    }

    public function getForModelScoped(string $modelType, int $modelId, array $userIds, int $limit = 50)
    {
        return ActivityLog::where('model_type', $modelType)
            ->where('model_id', $modelId)
            ->whereIn('user_id', $userIds)
            ->latest()
            ->take($limit)
            ->get();
    }

    public function getByActionForUserIds(string $action, array $userIds, int $limit = 50)
    {
        return ActivityLog::where('action', $action)
            ->whereIn('user_id', $userIds)
            ->latest()
            ->take($limit)
            ->get();
    }

    /**
     * Get activity logs for a specific model.
     */
    public function getForModel(string $modelType, int $modelId, int $limit = 50)
    {
        return ActivityLog::where('model_type', $modelType)
            ->where('model_id', $modelId)
            ->latest()
            ->take($limit)
            ->get();
    }

    /**
     * Get activity logs by action.
     */
    public function getByAction(string $action, int $limit = 50)
    {
        return ActivityLog::where('action', $action)
            ->latest()
            ->take($limit)
            ->get();
    }

    /**
     * Paginated login logs for company users.
     */
    public function getLoginHistory(array $userIds, int $perPage = 25, ?int $filterUserId = null, int $page = 1)
    {
        $query = ActivityLog::query()
            ->where('action', 'login')
            ->whereIn('user_id', $userIds)
            ->with('user:id,name,email')
            ->latest();

        if ($filterUserId !== null) {
            $query->where('user_id', $filterUserId);
        }

        return $query->paginate($perPage, ['*'], 'page', $page);
    }

    /**
     * Delete old activity logs (older than N days).
     */
    public function deleteOldLogs(int $days = 90)
    {
        $date = Carbon::now()->subDays($days);
        return ActivityLog::where('created_at', '<', $date)->delete();
    }
}
