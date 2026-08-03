<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TaxSettingService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TaxSettingController extends Controller
{
    public function __construct(private TaxSettingService $taxSettingService)
    {
    }

    public function show(Request $request)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $this->taxSettingService->getForUser($request->user()),
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
                'allow_vat' => 'nullable|boolean',
                'default_vat_rate_id' => 'nullable|integer',
                'vat_type' => ['nullable', 'string', Rule::in(['none', 'exclusive', 'inclusive'])],
            ]);

            $data = $this->taxSettingService->updateSettingsForUser($request->user(), $validated);

            return response()->json([
                'success' => true,
                'message' => 'Tax settings saved successfully',
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function storeVatRate(Request $request)
    {
        try {
            $validated = $request->validate([
                'vat_code' => 'required|string|max:50',
                'vat_desc' => 'required|string|max:255',
                'vat_rate' => 'required|numeric|min:0|max:100',
            ]);

            $data = $this->taxSettingService->createVatRateForUser($request->user(), $validated);

            return response()->json([
                'success' => true,
                'message' => 'VAT rate added',
                'data' => $data,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function updateVatRate(Request $request, int $id)
    {
        try {
            $validated = $request->validate([
                'vat_code' => 'nullable|string|max:50',
                'vat_desc' => 'nullable|string|max:255',
                'vat_rate' => 'nullable|numeric|min:0|max:100',
            ]);

            $data = $this->taxSettingService->updateVatRateForUser($request->user(), $id, $validated);

            return response()->json([
                'success' => true,
                'message' => 'VAT rate updated',
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function destroyVatRate(Request $request, int $id)
    {
        try {
            $data = $this->taxSettingService->deleteVatRateForUser($request->user(), $id);

            return response()->json([
                'success' => true,
                'message' => 'VAT rate deleted',
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function assignVatToItems(Request $request)
    {
        try {
            $validated = $request->validate([
                'item_ids' => 'required|array|min:1',
                'item_ids.*' => 'integer',
                'vat_rate_id' => 'nullable|integer',
            ]);

            $data = $this->taxSettingService->assignVatToItemsForUser($request->user(), $validated);

            return response()->json([
                'success' => true,
                'message' => 'VAT assigned to items',
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
