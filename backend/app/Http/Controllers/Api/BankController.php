<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\BankService;
use Illuminate\Http\Request;

class BankController extends Controller
{
    public function __construct(private BankService $bankService)
    {
    }

    public function index(Request $request)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $this->bankService->getAllForUser($request->user()),
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
                'bank_code' => 'nullable|string|max:50',
                'name' => 'required|string|max:255',
                'address' => 'nullable|string|max:500',
                'is_active' => 'nullable|boolean',
            ]);

            $bank = $this->bankService->createForUser($request->user(), $validated);

            return response()->json([
                'success' => true,
                'message' => 'Bank added successfully',
                'data' => $bank,
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
                'bank_code' => 'nullable|string|max:50',
                'name' => 'nullable|string|max:255',
                'address' => 'nullable|string|max:500',
                'is_active' => 'nullable|boolean',
            ]);

            $bank = $this->bankService->updateForUser($request->user(), $id, $validated);

            return response()->json([
                'success' => true,
                'message' => 'Bank updated successfully',
                'data' => $bank,
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
            $this->bankService->deleteForUser($request->user(), $id);

            return response()->json([
                'success' => true,
                'message' => 'Bank deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
