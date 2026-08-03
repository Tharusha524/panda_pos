<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ItemInventoryService;
use App\Services\ItemService;
use Illuminate\Http\Request;

class ItemController extends Controller
{
    public function __construct(
        private ItemService $itemService,
        private ItemInventoryService $itemInventoryService,
    ) {
    }

    public function index(Request $request)
    {
        try {
            $productType = $request->query('product_type');
            $location = $request->query('location');
            $forPosSale = filter_var($request->query('for_pos_sale'), FILTER_VALIDATE_BOOLEAN);

            $list = $this->itemService->getInventoryListForUser(
                $request->user(),
                is_string($productType) ? $productType : null,
                is_string($location) ? $location : null,
                $forPosSale,
            );

            return response()->json([
                'success' => true,
                'data' => $list['items'],
                'summary' => $list['summary'] ?? null,
                'filters' => $list['filters'],
                'inventory_settings' => $list['inventory_settings'],
                'item_settings' => $list['item_settings'],
                'alert_settings' => $list['alert_settings'] ?? null,
                'order_settings' => $list['order_settings'] ?? null,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function posSearch(Request $request)
    {
        try {
            $validated = $request->validate([
                'q' => 'required|string|max:200',
                'location' => 'nullable|string|max:100',
            ]);

            $result = $this->itemService->searchForPosSale(
                $request->user(),
                $validated['q'],
                $validated['location'] ?? null,
            );

            return response()->json([
                'success' => true,
                'data' => $result,
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
                'data' => $this->itemService->getForUser($request->user(), $id),
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
            $validated = $this->validateItem($request);

            $item = $this->itemService->createForUser($request->user(), $validated);

            return response()->json([
                'success' => true,
                'message' => 'Item saved successfully',
                'data' => $item,
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
            $validated = $this->validateItem($request, false);

            $item = $this->itemService->updateForUser($request->user(), $id, $validated);

            return response()->json([
                'success' => true,
                'message' => 'Item updated successfully',
                'data' => $item,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function updatePurchasePrice(Request $request, int $id)
    {
        try {
            $validated = $request->validate([
                'purchase_price' => 'required|numeric|min:0',
            ]);

            $item = $this->itemService->updatePurchasePriceForUser(
                $request->user(),
                $id,
                (float) $validated['purchase_price']
            );

            return response()->json([
                'success' => true,
                'message' => 'Purchase price updated',
                'data' => $item,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function uploadImage(Request $request, int $id)
    {
        try {
            $request->validate([
                'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:4096',
            ]);

            $item = $this->itemService->uploadImageForUser(
                $request->user(),
                $id,
                $request->file('image')
            );

            return response()->json([
                'success' => true,
                'message' => 'Item image uploaded',
                'data' => $item,
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
            $this->itemService->deleteForUser($request->user(), $id);

            return response()->json([
                'success' => true,
                'message' => 'Item deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function history(Request $request, int $id)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $this->itemInventoryService->getHistoryForUser($request->user(), $id),
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function costView(Request $request, int $id)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $this->itemInventoryService->getCostViewForUser($request->user(), $id),
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function adjust(Request $request, int $id)
    {
        try {
            $validated = $request->validate([
                'new_qty' => 'nullable|numeric|min:0',
                'qty_change' => 'nullable|numeric',
                'notes' => 'nullable|string|max:500',
            ]);

            $item = $this->itemInventoryService->adjustInventoryForUser($request->user(), $id, $validated);

            return response()->json([
                'success' => true,
                'message' => 'Inventory adjusted successfully',
                'data' => $item,
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function writeOff(Request $request, int $id)
    {
        try {
            $validated = $request->validate([
                'qty' => 'nullable|numeric|min:0.01',
                'main_qty' => 'nullable|numeric|min:0.01',
                'notes' => 'nullable|string|max:500',
                'batches' => 'nullable|array|min:1',
                'batches.*.item_batch_id' => 'required|integer',
                'batches.*.qty' => 'required|numeric|min:0.01',
            ]);

            $item = $this->itemInventoryService->writeOffForUser($request->user(), $id, $validated);

            return response()->json([
                'success' => true,
                'message' => 'Items written off successfully',
                'data' => $item,
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function batches(Request $request, int $id)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $this->itemInventoryService->getBatchesForUser($request->user(), $id),
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function inventoryBreakdown(Request $request, int $id)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $this->itemInventoryService->getInventoryBreakdownForUser($request->user(), $id),
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function storeBatch(Request $request, int $id)
    {
        try {
            $validated = $request->validate([
                'batch_number' => 'nullable|string|max:100',
                'location' => 'nullable|string|max:100',
                'qty' => 'required|numeric|min:0.01',
                'purchase_price' => 'nullable|numeric|min:0',
                'selling_price' => 'nullable|numeric|min:0',
                'expiry_date' => 'nullable|date',
                'notes' => 'nullable|string|max:500',
            ]);

            $result = $this->itemInventoryService->createBatchForUser($request->user(), $id, $validated);

            return response()->json([
                'success' => true,
                'message' => $result['message'] ?? 'Batch created successfully',
                'data' => $result,
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function updateBatch(Request $request, int $id, int $batchId)
    {
        try {
            $validated = $request->validate([
                'batch_number' => 'nullable|string|max:100',
                'qty' => 'nullable|numeric|min:0',
                'purchase_price' => 'nullable|numeric|min:0',
                'selling_price' => 'nullable|numeric|min:0',
                'expiry_date' => 'nullable|date',
                'notes' => 'nullable|string|max:500',
            ]);

            $result = $this->itemInventoryService->updateBatchForUser(
                $request->user(),
                $id,
                $batchId,
                $validated
            );

            return response()->json([
                'success' => true,
                'message' => 'Batch updated successfully',
                'data' => $result,
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function destroyBatch(Request $request, int $id, int $batchId)
    {
        try {
            $result = $this->itemInventoryService->deleteBatchForUser($request->user(), $id, $batchId);

            return response()->json([
                'success' => true,
                'message' => 'Batch deleted successfully',
                'data' => $result,
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function additionalCharges(Request $request, int $id)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $this->itemInventoryService->getAdditionalChargesForUser($request->user(), $id),
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function saveAdditionalCharges(Request $request, int $id)
    {
        try {
            $validated = $request->validate([
                'charges' => 'nullable|array',
                'charges.*.name' => 'required_with:charges|string|max:150',
                'charges.*.amount' => 'nullable|numeric|min:0',
                'charges.*.charge_type' => 'nullable|in:fixed,percent',
                'charges.*.is_active' => 'nullable|boolean',
            ]);

            $data = $this->itemInventoryService->saveAdditionalChargesForUser(
                $request->user(),
                $id,
                $validated['charges'] ?? []
            );

            return response()->json([
                'success' => true,
                'message' => 'Additional charges saved',
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function nextNumber(Request $request)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => ['item_number' => $this->itemService->getNextItemNumberForUser($request->user())],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function categories(Request $request)
    {
        try {
            $location = $request->query('location');
            return response()->json([
                'success' => true,
                'data' => $this->itemService->getCategoriesForUser(
                    $request->user(),
                    is_string($location) ? $location : null
                ),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function storeCategory(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'product_type' => 'nullable|string|max:100',
            ]);

            $category = $this->itemService->createCategoryForUser($request->user(), $validated);

            return response()->json([
                'success' => true,
                'message' => 'Category created successfully',
                'data' => $category,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function storeSubCategory(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'parent_category_id' => 'required|integer',
            ]);

            $sub = $this->itemService->createSubCategoryForUser($request->user(), $validated);

            return response()->json([
                'success' => true,
                'message' => 'Sub category created successfully',
                'data' => $sub,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function updateCategory(Request $request, int $id)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'product_type' => 'nullable|string|max:100',
            ]);

            $category = $this->itemService->updateCategoryForUser($request->user(), $id, $validated);

            return response()->json([
                'success' => true,
                'message' => 'Category updated successfully',
                'data' => $category,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function destroyCategory(Request $request, int $id)
    {
        try {
            $this->itemService->deleteCategoryForUser($request->user(), $id);

            return response()->json([
                'success' => true,
                'message' => 'Category deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function updateSubCategory(Request $request, int $id)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'parent_category_id' => 'required|integer',
            ]);

            $sub = $this->itemService->updateSubCategoryForUser($request->user(), $id, $validated);

            return response()->json([
                'success' => true,
                'message' => 'Sub category updated successfully',
                'data' => $sub,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function destroySubCategory(Request $request, int $id)
    {
        try {
            $this->itemService->deleteSubCategoryForUser($request->user(), $id);

            return response()->json([
                'success' => true,
                'message' => 'Sub category deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    private function validateItem(Request $request, bool $requireFields = true): array
    {
        $rules = [
            'auto_generate_item_number' => 'nullable|boolean',
            'item_number' => 'nullable|string|max:50',
            'description' => ($requireFields ? 'required' : 'nullable').'|string|max:255',
            'category' => 'nullable|string|max:100',
            'sub_category' => 'nullable|string|max:100',
            'item_category_id' => 'nullable|integer',
            'item_sub_category_id' => 'nullable|integer',
            'product_type' => 'nullable|string|max:100',
            'location' => 'nullable|string|max:100',
            'selling_price' => 'nullable|numeric|min:0',
            'wholesale_price' => 'nullable|numeric|min:0',
            'purchase_price' => 'nullable|numeric|min:0',
            'default_discount' => 'nullable|numeric|min:0',
            'default_discount_type' => 'nullable|in:percent,amount',
            'max_discount' => 'nullable|numeric|min:0',
            'has_multiple_options' => 'nullable|boolean',
            'item_details' => 'nullable|string',
            'track_with_inventory' => 'nullable|boolean',
            'qty' => 'nullable|numeric|min:0',
            'reorder_qty' => 'nullable|numeric|min:0',
            'uom' => 'nullable|string|max:20',
            'expiry_date' => 'nullable|date',
            'item_code' => 'nullable|string|max:100',
            'supplier_item_code' => 'nullable|string|max:100',
            'sku' => 'nullable|string|max:100',
            'is_favourite' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ];

        return $request->validate($rules);
    }
}
