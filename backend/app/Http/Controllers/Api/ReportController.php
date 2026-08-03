<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReportService;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(private ReportService $reportService)
    {
    }

    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => $this->reportService->listReportKeys(),
        ]);
    }

    public function show(Request $request, string $reportKey)
    {
        try {
            $filters = [
                'date_from' => $request->query('date_from'),
                'date_to' => $request->query('date_to'),
                'branch_id' => $request->query('branch_id'),
                'location' => $request->query('location'),
            ];

            return response()->json([
                'success' => true,
                'data' => $this->reportService->generate($request->user(), $reportKey, $filters),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
