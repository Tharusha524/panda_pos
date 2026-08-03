<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\EmployeeService;
use Illuminate\Http\Request;

class EmployeeController extends Controller
{
    public function __construct(private EmployeeService $employeeService)
    {
    }

    public function index(Request $request)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $this->employeeService->getAllForUser($request->user()),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'phone' => 'nullable|string|max:30',
                'address' => 'nullable|string|max:500',
                'employee_code' => 'nullable|string|max:50',
                'is_active' => 'nullable|boolean',
                'monthly_salary' => 'nullable|numeric|min:0',
            ]);

            $employee = $this->employeeService->createForUser($request->user(), $validated);

            return response()->json([
                'success' => true,
                'message' => 'Employee created successfully',
                'data' => $employee,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function update(Request $request, int $id)
    {
        try {
            $validated = $request->validate([
                'name' => 'nullable|string|max:255',
                'phone' => 'nullable|string|max:30',
                'address' => 'nullable|string|max:500',
                'employee_code' => 'nullable|string|max:50',
                'is_active' => 'nullable|boolean',
                'monthly_salary' => 'nullable|numeric|min:0',
            ]);

            $employee = $this->employeeService->updateForUser(
                $request->user(),
                $id,
                $validated
            );

            return response()->json([
                'success' => true,
                'message' => 'Employee updated successfully',
                'data' => $employee,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function destroy(Request $request, int $id)
    {
        try {
            $this->employeeService->deleteForUser($request->user(), $id);

            return response()->json([
                'success' => true,
                'message' => 'Employee deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
