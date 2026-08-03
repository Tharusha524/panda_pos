<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\EmployeeSettingService;
use Illuminate\Http\Request;

class EmployeeSettingController extends Controller
{
    public function __construct(private EmployeeSettingService $employeeSettingService)
    {
    }

    public function show(Request $request)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $this->employeeSettingService->getForUser($request->user()),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function update(Request $request)
    {
        try {
            $validated = $request->validate([
                'allow_employee_auto_number' => 'nullable|boolean',
            ]);

            $data = $this->employeeSettingService->updateForUser(
                $request->user(),
                $validated
            );

            return response()->json([
                'success' => true,
                'message' => 'Employee settings saved successfully',
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
