<?php

namespace App\Interfaces;

interface ActivityLogRepositoryInterface
{
    /**
     * Get all activity logs with pagination.
     */
    public function getAll(int $perPage = 15);

    /**
     * Get activity log by ID.
     */
    public function getById(int $id);

    /**
     * Create a new activity log.
     */
    public function create(array $data);

    /**
     * Get recent activity logs.
     */
    public function getRecent(int $limit = 50);

    /**
     * Get activity logs for a specific user.
     */
    public function getForUser(int $userId, int $limit = 50);

    /**
     * Get activity logs for a specific model.
     */
    public function getForModel(string $modelType, int $modelId, int $limit = 50);

    /**
     * Get activity logs by action.
     */
    public function getByAction(string $action, int $limit = 50);

    /**
     * Paginated login logs for one or more users.
     *
     * @param  list<int>  $userIds
     */
    public function getLoginHistory(array $userIds, int $perPage = 25, ?int $filterUserId = null, int $page = 1);

    /**
     * Delete old activity logs (older than N days).
     */
    public function deleteOldLogs(int $days = 90);
}
