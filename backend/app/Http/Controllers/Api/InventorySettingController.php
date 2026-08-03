<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\InventorySettingService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class InventorySettingController extends Controller
{
    public function __construct(private InventorySettingService $inventorySettingService)
    {
    }

    public function show(Request $request)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $this->inventorySettingService->getForUser($request->user()),
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
                'manage_multiple_locations' => 'nullable|boolean',
                'costing_method' => ['nullable', 'string', Rule::in(['FIFO', 'LIFO'])],
                'allow_tog' => 'nullable|boolean',
                'allow_request_for_quotation' => 'nullable|boolean',
                'allow_inventory_location_filter' => 'nullable|boolean',
            ]);

            $data = $this->inventorySettingService->updateForUser(
                $request->user(),
                $validated
            );

            return response()->json([
                'success' => true,
                'message' => 'Inventory settings saved successfully',
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
