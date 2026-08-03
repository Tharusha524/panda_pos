<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ItemSettingService;
use Illuminate\Http\Request;

class ItemSettingController extends Controller
{
    public function __construct(private ItemSettingService $itemSettingService)
    {
    }

    public function show(Request $request)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $this->itemSettingService->getForUser($request->user()),
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
                'allow_auto_number' => 'nullable|boolean',
                'allow_item_discount' => 'nullable|boolean',
                'allow_wholesale_price' => 'nullable|boolean',
                'allow_upload_item_image' => 'nullable|boolean',
                'allow_variant_in_add_item' => 'nullable|boolean',
                'allow_quick_add_item_in_sales_screen' => 'nullable|boolean',
                'allow_favorite_items_on_sales_screen' => 'nullable|boolean',
                'allow_editing_purchase_price_in_inventory_dashboard' => 'nullable|boolean',
                'allow_total_price_entry_on_sales_screen' => 'nullable|boolean',
                'uom_options' => 'nullable|array|min:1|max:30',
                'uom_options.*' => 'required|string|max:20',
            ]);

            $data = $this->itemSettingService->updateForUser(
                $request->user(),
                $validated
            );

            return response()->json([
                'success' => true,
                'message' => 'Item settings saved successfully',
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
