<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PosDashboardService;
use Illuminate\Http\Request;

class PosDashboardController extends Controller
{
    public function __construct(private PosDashboardService $posDashboardService)
    {
    }

    public function overview(Request $request)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $this->posDashboardService->getOverviewForUser($request->user()),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function todayTables(Request $request)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $this->posDashboardService->getTodayTablesForUser($request->user()),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
