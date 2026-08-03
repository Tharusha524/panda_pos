<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\BranchService;
use Illuminate\Http\Request;

class BranchController extends Controller
{
    public function __construct(private BranchService $branchService)
    {
    }

    public function index(Request $request)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $this->branchService->getAllForUser($request->user()),
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
                'address' => 'nullable|string|max:500',
                'city' => 'nullable|string|max:255',
                'phone' => 'nullable|string|max:20',
                'is_active' => 'nullable|boolean',
            ]);

            $branch = $this->branchService->createForUser($request->user(), $validated);

            return response()->json([
                'success' => true,
                'message' => 'Branch created successfully',
                'data' => $branch,
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
                'address' => 'nullable|string|max:500',
                'city' => 'nullable|string|max:255',
                'phone' => 'nullable|string|max:20',
                'is_active' => 'nullable|boolean',
            ]);

            $branch = $this->branchService->updateForUser($request->user(), $id, $validated);

            return response()->json([
                'success' => true,
                'message' => 'Branch updated successfully',
                'data' => $branch,
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
            $this->branchService->deleteForUser($request->user(), $id);

            return response()->json([
                'success' => true,
                'message' => 'Branch deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
