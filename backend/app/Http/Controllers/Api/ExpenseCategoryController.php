<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ExpenseCategoryService;
use Illuminate\Http\Request;

class ExpenseCategoryController extends Controller
{
    public function __construct(private ExpenseCategoryService $expenseCategoryService)
    {
    }

    public function index(Request $request)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $this->expenseCategoryService->getAllForUser($request->user()),
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
                'name' => 'required|string|max:100',
            ]);

            $category = $this->expenseCategoryService->createForUser($request->user(), $validated);

            return response()->json([
                'success' => true,
                'message' => 'Expense category created successfully',
                'data' => $category,
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
                'name' => 'required|string|max:100',
            ]);

            $category = $this->expenseCategoryService->updateForUser($request->user(), $id, $validated);

            return response()->json([
                'success' => true,
                'message' => 'Expense category updated successfully',
                'data' => $category,
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
            $this->expenseCategoryService->deleteForUser($request->user(), $id);

            return response()->json([
                'success' => true,
                'message' => 'Expense category deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
