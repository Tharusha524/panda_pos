<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function __construct(
        private ActivityLogService $activityLogService,
    ) {
    }

    public function index(Request $request)
    {
        try {
            $perPage = (int) $request->query('per_page', 15);
            $logs = $this->activityLogService->getPaginatedForUser($request->user(), $perPage);

            return response()->json([
                'success' => true,
                'message' => 'Activity logs retrieved successfully',
                'data' => $logs,
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse($e);
        }
    }

    public function recent(Request $request)
    {
        try {
            $limit = (int) $request->query('limit', 50);
            $logs = $this->activityLogService->getRecentForUser($request->user(), $limit);

            return response()->json([
                'success' => true,
                'message' => 'Recent activity logs retrieved successfully',
                'data' => $logs,
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse($e);
        }
    }

    public function userLogs($userId, Request $request)
    {
        try {
            $limit = (int) $request->query('limit', 50);
            $logs = $this->activityLogService->getForUserIdScoped(
                $request->user(),
                (int) $userId,
                $limit
            );

            return response()->json([
                'success' => true,
                'message' => 'User activity logs retrieved successfully',
                'data' => $logs,
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse($e);
        }
    }

    public function modelLogs($modelType, $modelId, Request $request)
    {
        try {
            $limit = (int) $request->query('limit', 50);
            $logs = $this->activityLogService->getForModelScoped(
                $request->user(),
                (string) $modelType,
                (int) $modelId,
                $limit
            );

            return response()->json([
                'success' => true,
                'message' => 'Model activity logs retrieved successfully',
                'data' => $logs,
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse($e);
        }
    }

    public function actionLogs($action, Request $request)
    {
        try {
            $limit = (int) $request->query('limit', 50);
            $logs = $this->activityLogService->getByActionForUser($request->user(), (string) $action, $limit);

            return response()->json([
                'success' => true,
                'message' => 'Action activity logs retrieved successfully',
                'data' => $logs,
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse($e);
        }
    }

    public function show(Request $request, $id)
    {
        try {
            $log = $this->activityLogService->getByIdForUser($request->user(), (int) $id);

            return response()->json([
                'success' => true,
                'message' => 'Activity log retrieved successfully',
                'data' => $log,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Activity log not found',
            ], 404);
        }
    }

    private function errorResponse(\Exception $e)
    {
        $status = str_contains(strtolower($e->getMessage()), 'permission') ? 403 : 400;

        return response()->json([
            'success' => false,
            'message' => $e->getMessage(),
        ], $status);
    }
}
