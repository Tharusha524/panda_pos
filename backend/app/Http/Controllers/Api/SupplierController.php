<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SupplierService;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function __construct(private SupplierService $supplierService)
    {
    }

    public function index(Request $request)
    {
        try {
            $result = $this->supplierService->getAllForUser(
                $request->user(),
                is_string($request->query('location')) ? $request->query('location') : null,
            );

            return response()->json([
                'success' => true,
                'data' => $result['suppliers'],
                'summary' => $result['summary'],
                'filters' => $result['filters'],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function show(Request $request, int $id)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $this->supplierService->getForUser($request->user(), $id),
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
            $validated = $this->validateSupplier($request);

            $supplier = $this->supplierService->createForUser($request->user(), $validated);

            return response()->json([
                'success' => true,
                'message' => 'Supplier saved successfully',
                'data' => $supplier,
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
            $validated = $this->validateSupplier($request, false);

            $supplier = $this->supplierService->updateForUser($request->user(), $id, $validated);

            return response()->json([
                'success' => true,
                'message' => 'Supplier updated successfully',
                'data' => $supplier,
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
            $this->supplierService->deleteForUser($request->user(), $id);

            return response()->json([
                'success' => true,
                'message' => 'Supplier deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    private function validateSupplier(Request $request, bool $requireName = true): array
    {
        return $request->validate([
            'supplier_code' => 'nullable|string|max:50',
            'first_name' => ($requireName ? 'required' : 'nullable').'|string|max:255',
            'phone' => ($requireName ? 'required' : 'nullable').'|string|max:30',
            'email' => 'nullable|email|max:255',
            'opening_balance' => 'nullable|numeric',
            'address_line1' => 'nullable|string|max:255',
            'address_line2' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'province' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'country' => 'nullable|string|max:100',
            'location' => 'nullable|string|max:255',
        ]);
    }
}
