<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Item;
use App\Models\ItemBatch;
use App\Models\ItemCategory;
use App\Models\ItemSubCategory;
use App\Models\User;
use Carbon\Carbon;
use App\Support\StorageUrl;
use Exception;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class ItemService
{
    public function __construct(
        private AlertSettingService $alertSettingService,
        private CompanySettingService $companySettingService,
        private InventorySettingService $inventorySettingService,
        private ItemSettingService $itemSettingService,
        private LocationService $locationService,
        private OrderTransactionService $orderTransactionService,
        private ItemExpirySyncService $itemExpirySyncService,
    ) {
    }

    public function getInventoryListForUser(
        User $user,
        ?string $productType = null,
        ?string $location = null,
        bool $forPosSale = false,
    ): array {
        $settings = $this->inventorySettingService->getForUser($user);

        $orderSettings = $forPosSale ? $this->orderTransactionService->getPosSettings($user) : null;

        $alertSettings = $this->alertSettingService->getForUser($user);
        $items = $this->getAllForUser(
            $user,
            $productType,
            $location,
            $settings,
            $forPosSale,
            $orderSettings,
            $alertSettings['expiry_alert_period_days'],
        );

        return [
            'items' => $items,
            'summary' => $this->buildInventorySummary($items),
            'filters' => $this->getFilterOptionsForUser($user, $settings),
            'inventory_settings' => $settings,
            'item_settings' => $this->itemSettingService->getForUser($user),
            'alert_settings' => $alertSettings,
            'order_settings' => $orderSettings,
        ];
    }

    private function buildInventorySummary($items): array
    {
        $collection = collect($items);
        $lowStock = $collection->filter(function ($item) {
            $qty = (float) ($item['qty'] ?? 0);
            $reorder = (float) ($item['reorder_qty'] ?? 0);

            return $reorder > 0 && $qty <= $reorder;
        });

        $expired = $collection->filter(
            fn ($item) => (bool) ($item['has_expired_stock'] ?? false)
                || ($item['expiry_status'] ?? '') === 'expired'
        );
        $expiringSoon = $collection->where('expiry_status', 'expiring_soon');

        $oversold = $collection->filter(fn ($item) => (float) ($item['qty'] ?? 0) < 0);

        return [
            'total_items' => $collection->count(),
            'total_inventory_value' => round((float) $collection->sum(fn ($i) => (float) ($i['inventory_value'] ?? 0)), 2),
            'low_stock_count' => $lowStock->count(),
            'oversold_count' => $oversold->count(),
            'active_items' => $collection->where('is_active', true)->count(),
            'expired_count' => $expired->count(),
            'expiring_soon_count' => $expiringSoon->count(),
        ];
    }

    /**
     * POS quick search using order setting short-key style (e.g. ITEM001*2).
     */
    public function searchForPosSale(User $user, string $search, ?string $location = null): array
    {
        $settings = $this->orderTransactionService->getSettings($user);
        $parsed = $this->orderTransactionService->parseSearchShortKey(
            $search,
            $settings['search_box_short_key_style'],
        );
        $term = $parsed['term'];
        if ($term === '') {
            return [
                'items' => [],
                'parsed_qty' => $parsed['qty'],
                'search_style' => $settings['search_box_short_key_style'],
            ];
        }

        $invSettings = $this->inventorySettingService->getForUser($user);
        $company = $this->companySettingService->getCompanyForUser($user);
        $costingMethod = $invSettings['costing_method'] ?? 'FIFO';

        $query = Item::where('company_id', $company->id)
            ->where('is_active', true)
            ->where('track_with_inventory', true);

        if ($location && $location !== 'all') {
            $query->where('location', $location);
        }

        if (!$settings['allow_ingredients_items_in_sales']) {
            $query->where(function ($q) {
                $q->whereNull('product_type')
                    ->orWhere('product_type', 'not like', '%ingredient%')
                    ->orWhere('product_type', 'not like', '%Ingredient%')
                    ->orWhere('product_type', 'not like', '%manufacturing%');
            });
        }

        $style = $settings['search_box_short_key_style'];
        $like = '%'.$term.'%';
        if ($style === 'item_name_qty') {
            $query->where('description', 'like', $like);
        } elseif ($style === 'barcode_qty') {
            $query->where(function ($q) use ($like, $term) {
                $q->where('sku', 'like', $like)
                    ->orWhere('item_code', 'like', $like)
                    ->orWhere('item_number', 'like', $like);
            });
        } else {
            $query->where(function ($q) use ($like, $term) {
                $q->where('item_number', 'like', $like)
                    ->orWhere('item_code', 'like', $like)
                    ->orWhere('sku', 'like', $like);
            });
        }

        $items = $query->orderBy('item_number')->limit(25)->get()
            ->map(fn (Item $item) => $this->formatItem($item, $costingMethod));

        $hideQty = (bool) $settings['hide_quantity_from_plu_on_sales_screen'];

        return [
            'items' => $items->map(function (array $row) use ($hideQty) {
                if ($hideQty) {
                    unset($row['qty']);
                }

                return $row;
            })->values()->all(),
            'parsed_qty' => $parsed['qty'],
            'search_style' => $style,
            'order_settings' => $this->orderTransactionService->getPosSettings($user),
        ];
    }

    public function updatePurchasePriceForUser(User $user, int $id, float $purchasePrice): array
    {
        $item = $this->findForUser($user, $id);
        $item->purchase_price = $purchasePrice;
        $item->save();

        $settings = $this->inventorySettingService->getForUser($user);

        return $this->formatItem($item->fresh(), $settings['costing_method'] ?? 'FIFO');
    }

    public function uploadImageForUser(User $user, int $id, UploadedFile $file): array
    {
        $itemSettings = $this->itemSettingService->getForUser($user);
        if (!$itemSettings['allow_upload_item_image']) {
            throw new Exception('Item image upload is disabled in Item Settings.');
        }

        $item = $this->findForUser($user, $id);

        if ($item->image_path) {
            Storage::disk('public')->delete($item->image_path);
        }

        $path = $file->store('items/'.$item->company_id, 'public');
        $item->image_path = $path;
        $item->save();

        $invSettings = $this->inventorySettingService->getForUser($user);

        return $this->formatItem($item->fresh(), $invSettings['costing_method'] ?? 'FIFO');
    }

    public function getAllForUser(
        User $user,
        ?string $productType = null,
        ?string $location = null,
        ?array $settings = null,
        bool $forPosSale = false,
        ?array $orderSettings = null,
        ?int $expiryAlertDays = null,
    ) {
        $settings ??= $this->inventorySettingService->getForUser($user);
        $company = $this->companySettingService->getCompanyForUser($user);

        $query = Item::where('company_id', $company->id);

        if ($forPosSale) {
            $query->where('is_active', true)->where('track_with_inventory', true);
            $orderSettings ??= $this->orderTransactionService->getSettings($user);
            if (!$orderSettings['allow_ingredients_items_in_sales']) {
                $query->where(function ($q) {
                    $q->whereNull('product_type')
                        ->orWhere('product_type', 'not like', '%ingredient%')
                        ->orWhere('product_type', 'not like', '%Ingredient%')
                        ->orWhere('product_type', 'not like', '%manufacturing%');
                });
            }
        }

        if ($productType && $productType !== 'all') {
            $query->where('product_type', $productType);
        }

        if ($location && $location !== 'all') {
            $query->where('location', $location);
        }

        $costingMethod = $settings['costing_method'] ?? 'FIFO';
        $expiryAlertDays ??= $this->alertSettingService->getForUser($user)['expiry_alert_period_days'];

        return $query
            ->with(['batches' => fn ($q) => $q->where('qty', '>', 0)])
            ->orderBy('item_number')
            ->get()
            ->map(fn (Item $item) => $this->formatItem($item, $costingMethod, $expiryAlertDays));
    }

    public function getFilterOptionsForUser(User $user, ?array $settings = null): array
    {
        $settings ??= $this->inventorySettingService->getForUser($user);
        $company = $this->companySettingService->getCompanyForUser($user);
        $companyId = $company->id;

        $productTypes = Item::where('company_id', $companyId)
            ->whereNotNull('product_type')
            ->distinct()
            ->pluck('product_type')
            ->filter()
            ->values()
            ->all();

        $itemLocations = Item::where('company_id', $companyId)
            ->distinct()
            ->pluck('location')
            ->filter()
            ->values()
            ->all();

        $locations = $this->locationService->getOptionsForCompany(
            $companyId,
            $itemLocations,
            (bool) ($settings['manage_multiple_locations'] ?? true)
        );

        return [
            'product_types' => $productTypes,
            'locations' => $locations,
        ];
    }

    public function getForUser(User $user, int $id): array
    {
        $settings = $this->inventorySettingService->getForUser($user);
        $alertDays = $this->alertSettingService->getForUser($user)['expiry_alert_period_days'];
        $item = $this->findForUser($user, $id);
        $item->load(['batches' => fn ($q) => $q->where('qty', '>', 0)]);

        return $this->formatItem(
            $item,
            $settings['costing_method'] ?? 'FIFO',
            $alertDays,
        );
    }

    /** Sync item master expiry to nearest in-stock batch (FEFO); rolls forward when a batch is depleted. */
    public function syncItemExpiryFromBatches(Item $item): void
    {
        $this->itemExpirySyncService->syncFromBatches($item);
    }

    public function getNextItemNumberForUser(User $user): string
    {
        $company = $this->companySettingService->getCompanyForUser($user);

        $max = Item::where('company_id', $company->id)
            ->whereRaw("item_number REGEXP '^[0-9]+$'")
            ->selectRaw('MAX(CAST(item_number AS UNSIGNED)) as max_num')
            ->value('max_num');

        $next = ((int) $max) + 1;

        return (string) max(1, $next);
    }

    public function createForUser(User $user, array $data): array
    {
        $company = $this->companySettingService->getCompanyForUser($user);

        $autoGenerate = (bool) ($data['auto_generate_item_number'] ?? true);
        $itemNumber = trim((string) ($data['item_number'] ?? ''));

        if ($itemNumber === '' && $autoGenerate) {
            $itemNumber = $this->getNextItemNumberForUser($user);
        }

        if ($itemNumber === '') {
            throw new Exception('Item number is required');
        }

        $location = $this->locationService->assertValidForUser(
            $user,
            $data['location'] ?? LocationService::MAIN_LOCATION
        );

        if (Item::where('company_id', $company->id)
            ->where('item_number', $itemNumber)
            ->where('location', $location)
            ->exists()) {
            throw new Exception('Item number already exists at this branch/location.');
        }

        $description = trim((string) ($data['description'] ?? ''));
        if ($description === '') {
            throw new Exception('Description is required');
        }

        $categoryNames = $this->resolveCategoryNames($company->id, $data);

        $data['location'] = $location;

        $item = Item::create(array_merge(
            $this->buildItemAttributes($data, $categoryNames),
            [
                'company_id' => $company->id,
                'item_number' => $itemNumber,
                'description' => $description,
            ]
        ));

        return $this->formatItem($item);
    }

    public function updateForUser(User $user, int $id, array $data): array
    {
        $item = $this->findForUser($user, $id);
        $companyId = $item->company_id;

        if (array_key_exists('item_number', $data)) {
            $itemNumber = trim((string) $data['item_number']);
            if ($itemNumber === '' && !empty($data['auto_generate_item_number'])) {
                $itemNumber = $this->getNextItemNumberForUser($user);
            }
            if ($itemNumber === '') {
                throw new Exception('Item number is required');
            }
            $loc = $item->location;
            $exists = Item::where('company_id', $companyId)
                ->where('item_number', $itemNumber)
                ->where('location', $loc)
                ->where('id', '!=', $id)
                ->exists();
            if ($exists) {
                throw new Exception('Item number already exists at this branch/location.');
            }
            $item->item_number = $itemNumber;
        }

        if (array_key_exists('description', $data)) {
            $description = trim((string) $data['description']);
            if ($description === '') {
                throw new Exception('Description is required');
            }
            $item->description = $description;
        }

        $categoryNames = $this->resolveCategoryNames($companyId, $data);
        $attrs = $this->buildItemAttributes($data, $categoryNames);
        foreach ($attrs as $key => $value) {
            if (array_key_exists($key, $data)
                || array_key_exists('item_category_id', $data)
                || array_key_exists('item_sub_category_id', $data)
                || array_key_exists('category', $data)
                || array_key_exists('sub_category', $data)) {
                if (in_array($key, ['category', 'sub_category', 'item_category_id', 'item_sub_category_id'], true)
                    && !($this->attributeProvidedInData($key, $data))) {
                    continue;
                }
                $item->{$key} = $value;
            }
        }

        $item->save();

        return $this->formatItem($item->fresh());
    }

    public function deleteForUser(User $user, int $id): void
    {
        $this->findForUser($user, $id)->delete();
    }

    public function getCategoriesForUser(User $user, ?string $location = null)
    {
        $company = $this->companySettingService->getCompanyForUser($user);

        $categories = ItemCategory::where('company_id', $company->id)
            ->with('subCategories')
            ->orderBy('name')
            ->get()
            ->map(fn (ItemCategory $cat) => [
                'id' => $cat->id,
                'name' => $cat->name,
                'product_type' => $cat->product_type,
                'sub_categories' => $cat->subCategories->map(fn ($sub) => [
                    'id' => $sub->id,
                    'name' => $sub->name,
                ])->values()->all(),
            ]);

        if (!$location || $location === 'all') {
            return $categories;
        }

        $itemsAtLocation = Item::where('company_id', $company->id)
            ->where('location', $location)
            ->get(['item_category_id', 'category', 'item_sub_category_id', 'sub_category']);

        if ($itemsAtLocation->isEmpty()) {
            return collect([]);
        }

        $categoryIds = $itemsAtLocation
            ->pluck('item_category_id')
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();
        $categoryNames = $itemsAtLocation
            ->pluck('category')
            ->filter()
            ->map(fn ($name) => mb_strtolower(trim((string) $name)))
            ->unique()
            ->values();

        $subIds = $itemsAtLocation
            ->pluck('item_sub_category_id')
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();
        $subNames = $itemsAtLocation
            ->pluck('sub_category')
            ->filter()
            ->map(fn ($name) => mb_strtolower(trim((string) $name)))
            ->unique()
            ->values();

        return $categories
            ->filter(function (array $cat) use ($categoryIds, $categoryNames) {
                if (in_array((int) $cat['id'], $categoryIds->all(), true)) {
                    return true;
                }

                return in_array(
                    mb_strtolower(trim((string) $cat['name'])),
                    $categoryNames->all(),
                    true
                );
            })
            ->map(function (array $cat) use ($subIds, $subNames) {
                $cat['sub_categories'] = collect($cat['sub_categories'])
                    ->filter(function (array $sub) use ($subIds, $subNames) {
                        if (in_array((int) $sub['id'], $subIds->all(), true)) {
                            return true;
                        }

                        return in_array(
                            mb_strtolower(trim((string) $sub['name'])),
                            $subNames->all(),
                            true
                        );
                    })
                    ->values()
                    ->all();

                return $cat;
            })
            ->values();
    }

    public function createCategoryForUser(User $user, array $data): array
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $name = trim((string) ($data['name'] ?? ''));
        if ($name === '') {
            throw new Exception('Category name is required');
        }

        if (ItemCategory::where('company_id', $company->id)->where('name', $name)->exists()) {
            throw new Exception('Category already exists.');
        }

        $category = ItemCategory::create([
            'company_id' => $company->id,
            'name' => $name,
            'product_type' => $data['product_type'] ?? null,
        ]);

        return [
            'id' => $category->id,
            'name' => $category->name,
            'product_type' => $category->product_type,
            'sub_categories' => [],
        ];
    }

    public function createSubCategoryForUser(User $user, array $data): array
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $parentId = (int) ($data['parent_category_id'] ?? $data['item_category_id'] ?? 0);
        $name = trim((string) ($data['name'] ?? ''));

        if ($parentId <= 0) {
            throw new Exception('Parent category is required');
        }

        if ($name === '') {
            throw new Exception('Sub category name is required');
        }

        $category = ItemCategory::where('company_id', $company->id)
            ->where('id', $parentId)
            ->first();

        if (!$category) {
            throw new Exception('Category not found');
        }

        if (ItemSubCategory::where('item_category_id', $parentId)->where('name', $name)->exists()) {
            throw new Exception('Sub category already exists for this category.');
        }

        $sub = ItemSubCategory::create([
            'company_id' => $company->id,
            'item_category_id' => $parentId,
            'name' => $name,
        ]);

        return [
            'id' => $sub->id,
            'name' => $sub->name,
            'item_category_id' => $parentId,
            'parent_category_name' => $category->name,
        ];
    }

    public function updateCategoryForUser(User $user, int $id, array $data): array
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $category = ItemCategory::where('company_id', $company->id)->where('id', $id)->first();

        if (!$category) {
            throw new Exception('Category not found');
        }

        $name = trim((string) ($data['name'] ?? $category->name));
        if ($name === '') {
            throw new Exception('Category name is required');
        }

        $exists = ItemCategory::where('company_id', $company->id)
            ->where('name', $name)
            ->where('id', '!=', $id)
            ->exists();

        if ($exists) {
            throw new Exception('Category already exists.');
        }

        $category->name = $name;
        if (array_key_exists('product_type', $data)) {
            $category->product_type = $data['product_type'];
        }
        $category->save();
        $category->load('subCategories');

        Item::where('company_id', $company->id)
            ->where('item_category_id', $id)
            ->update(['category' => $name]);

        return [
            'id' => $category->id,
            'name' => $category->name,
            'product_type' => $category->product_type,
            'sub_categories' => $category->subCategories->map(fn ($sub) => [
                'id' => $sub->id,
                'name' => $sub->name,
            ])->values()->all(),
        ];
    }

    public function deleteCategoryForUser(User $user, int $id): void
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $category = ItemCategory::where('company_id', $company->id)->where('id', $id)->first();

        if (!$category) {
            throw new Exception('Category not found');
        }

        if (Item::where('company_id', $company->id)->where('item_category_id', $id)->exists()) {
            throw new Exception('Cannot delete category: it is used by one or more items.');
        }

        $category->delete();
    }

    public function updateSubCategoryForUser(User $user, int $id, array $data): array
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $sub = ItemSubCategory::where('company_id', $company->id)->where('id', $id)->first();

        if (!$sub) {
            throw new Exception('Sub category not found');
        }

        $name = trim((string) ($data['name'] ?? $sub->name));
        if ($name === '') {
            throw new Exception('Sub category name is required');
        }

        $parentId = (int) ($data['parent_category_id'] ?? $data['item_category_id'] ?? $sub->item_category_id);

        $category = ItemCategory::where('company_id', $company->id)->where('id', $parentId)->first();
        if (!$category) {
            throw new Exception('Category not found');
        }

        $exists = ItemSubCategory::where('item_category_id', $parentId)
            ->where('name', $name)
            ->where('id', '!=', $id)
            ->exists();

        if ($exists) {
            throw new Exception('Sub category already exists for this category.');
        }

        $sub->name = $name;
        $sub->item_category_id = $parentId;
        $sub->save();

        Item::where('company_id', $company->id)
            ->where('item_sub_category_id', $id)
            ->update([
                'sub_category' => $name,
                'item_category_id' => $parentId,
                'category' => $category->name,
            ]);

        return [
            'id' => $sub->id,
            'name' => $sub->name,
            'item_category_id' => $parentId,
            'parent_category_name' => $category->name,
        ];
    }

    public function deleteSubCategoryForUser(User $user, int $id): void
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $sub = ItemSubCategory::where('company_id', $company->id)->where('id', $id)->first();

        if (!$sub) {
            throw new Exception('Sub category not found');
        }

        if (Item::where('company_id', $company->id)->where('item_sub_category_id', $id)->exists()) {
            throw new Exception('Cannot delete sub category: it is used by one or more items.');
        }

        $sub->delete();
    }

    private function attributeProvidedInData(string $key, array $data): bool
    {
        $map = [
            'item_category_id' => ['item_category_id', 'category_id'],
            'item_sub_category_id' => ['item_sub_category_id', 'sub_category_id'],
            'category' => ['category'],
            'sub_category' => ['sub_category'],
        ];

        foreach ($map[$key] ?? [$key] as $field) {
            if (array_key_exists($field, $data)) {
                return true;
            }
        }

        return array_key_exists($key, $data);
    }

    private function resolveCategoryNames(int $companyId, array $data): array
    {
        $category = $data['category'] ?? null;
        $subCategory = $data['sub_category'] ?? null;

        if (!empty($data['item_category_id'])) {
            $cat = ItemCategory::where('company_id', $companyId)
                ->where('id', $data['item_category_id'])
                ->first();
            if ($cat) {
                $category = $cat->name;
            }
        }

        if (!empty($data['item_sub_category_id'])) {
            $sub = ItemSubCategory::where('company_id', $companyId)
                ->where('id', $data['item_sub_category_id'])
                ->first();
            if ($sub) {
                $subCategory = $sub->name;
            }
        }

        return [
            'category' => $category,
            'sub_category' => $subCategory,
            'item_category_id' => $data['item_category_id'] ?? null,
            'item_sub_category_id' => $data['item_sub_category_id'] ?? null,
        ];
    }

    private function buildItemAttributes(array $data, array $categoryNames): array
    {
        $discountType = $data['default_discount_type'] ?? 'percent';

        return [
            'auto_generate_item_number' => (bool) ($data['auto_generate_item_number'] ?? true),
            'category' => $categoryNames['category'] ?? null,
            'sub_category' => $categoryNames['sub_category'] ?? null,
            'item_category_id' => $categoryNames['item_category_id'] ?? null,
            'item_sub_category_id' => $categoryNames['item_sub_category_id'] ?? null,
            'product_type' => $data['product_type'] ?? null,
            'location' => $data['location'] ?? 'Main Location',
            'selling_price' => (float) ($data['selling_price'] ?? 0),
            'wholesale_price' => (float) ($data['wholesale_price'] ?? 0),
            'purchase_price' => (float) ($data['purchase_price'] ?? 0),
            'default_discount' => (float) ($data['default_discount'] ?? 0),
            'default_discount_type' => in_array($discountType, ['percent', 'amount'], true)
                ? $discountType
                : 'percent',
            'max_discount' => (float) ($data['max_discount'] ?? 0),
            'has_multiple_options' => (bool) ($data['has_multiple_options'] ?? false),
            'item_details' => $data['item_details'] ?? null,
            'track_with_inventory' => (bool) ($data['track_with_inventory'] ?? true),
            'qty' => (float) ($data['qty'] ?? 0),
            'reorder_qty' => (float) ($data['reorder_qty'] ?? 0),
            'uom' => $data['uom'] ?? 'pcs',
            'expiry_date' => !empty($data['expiry_date']) ? $data['expiry_date'] : null,
            'item_code' => $data['item_code'] ?? null,
            'supplier_item_code' => $data['supplier_item_code'] ?? null,
            'sku' => $data['sku'] ?? null,
            'is_favourite' => (bool) ($data['is_favourite'] ?? false),
            'is_active' => (bool) ($data['is_active'] ?? true),
        ];
    }

    private function findForUser(User $user, int $id): Item
    {
        $company = $this->companySettingService->getCompanyForUser($user);

        $item = Item::where('company_id', $company->id)->where('id', $id)->first();

        if (!$item) {
            throw new Exception('Item not found');
        }

        return $item;
    }

    private function resolveUnitCost(Item $item, string $costingMethod): float
    {
        $purchase = (float) ($item->purchase_price ?? 0);
        $selling = (float) $item->selling_price;
        $method = strtoupper($costingMethod);

        if ($method === 'LIFO') {
            return $purchase > 0 ? $purchase : $selling;
        }

        return $purchase;
    }

    private function formatItem(Item $item, string $costingMethod = 'FIFO', ?int $expiryAlertDays = null): array
    {
        $selling = (float) $item->selling_price;
        $purchase = (float) ($item->purchase_price ?? 0);
        $unitCost = $this->resolveUnitCost($item, $costingMethod);
        $qty = (float) ($item->qty ?? 0);
        $profit = $selling - $purchase;
        $margin = $selling > 0 ? round(($profit / $selling) * 100, 2) : 0;
        $markup = $purchase > 0 ? round(($profit / $purchase) * 100, 2) : 0;
        $expiryMeta = $this->resolveExpiryFields($item, $expiryAlertDays ?? 7);
        $stockMeta = $this->resolveStockFields($item);

        return [
            'id' => $item->id,
            'item_number' => $item->item_number,
            'auto_generate_item_number' => (bool) ($item->auto_generate_item_number ?? true),
            'description' => $item->description,
            'image_path' => $item->image_path,
            'image_url' => StorageUrl::publicUrl($item->image_path),
            'category' => $item->category,
            'sub_category' => $item->sub_category,
            'item_category_id' => $item->item_category_id,
            'item_sub_category_id' => $item->item_sub_category_id,
            'vat_rate_id' => $item->vat_rate_id,
            'product_type' => $item->product_type,
            'location' => $item->location,
            'selling_price' => $selling,
            'wholesale_price' => (float) ($item->wholesale_price ?? 0),
            'purchase_price' => $purchase,
            'default_discount' => (float) ($item->default_discount ?? 0),
            'default_discount_type' => $item->default_discount_type ?? 'percent',
            'max_discount' => (float) ($item->max_discount ?? 0),
            'has_multiple_options' => (bool) ($item->has_multiple_options ?? false),
            'item_details' => $item->item_details,
            'track_with_inventory' => (bool) ($item->track_with_inventory ?? true),
            'qty' => (float) ($item->qty ?? 0),
            'sellable_qty' => $stockMeta['sellable_qty'],
            'expired_stock_qty' => $stockMeta['expired_stock_qty'],
            'unbatched_qty' => $stockMeta['unbatched_qty'],
            'reorder_qty' => (float) ($item->reorder_qty ?? 0),
            'uom' => $item->uom ?? 'pcs',
            'expiry_date' => $item->expiry_date?->format('Y-m-d'),
            'nearest_expiry_date' => $expiryMeta['nearest_expiry_date'],
            'main_expiry_date' => $expiryMeta['main_expiry_date'],
            'nearest_batch_expiry_date' => $expiryMeta['nearest_batch_expiry_date'],
            'nearest_batch_expiry_qty' => $expiryMeta['nearest_batch_expiry_qty'],
            'expiry_status' => $expiryMeta['expiry_status'],
            'expiry_days_remaining' => $expiryMeta['expiry_days_remaining'],
            'has_expired_stock' => $expiryMeta['has_expired_stock'],
            'item_code' => $item->item_code,
            'supplier_item_code' => $item->supplier_item_code,
            'sku' => $item->sku,
            'is_favourite' => (bool) ($item->is_favourite ?? false),
            'is_active' => (bool) $item->is_active,
            'status' => $item->is_active ? 'Active' : 'Inactive',
            'margin_percent' => $margin,
            'markup_percent' => $markup,
            'profit' => round($profit, 2),
            'bid' => $unitCost,
            'last_purchase_price' => $purchase,
            'costing_method' => strtoupper($costingMethod),
            'unit_cost' => round($unitCost, 2),
            'oversold_qty' => $qty < 0 ? round(abs($qty), 2) : 0.0,
            'inventory_value' => round(max(0, $qty) * $unitCost, 2),
            'has_batches' => $item->relationLoaded('batches')
                ? $item->batches->isNotEmpty()
                : $item->batches()->where('qty', '>', 0)->exists(),
            'batch_count' => $item->relationLoaded('batches')
                ? $item->batches->count()
                : 0,
        ];
    }

    /**
     * @return array{sellable_qty: float, expired_stock_qty: float, unbatched_qty: float}
     */
    private function resolveStockFields(Item $item): array
    {
        $qty = (float) ($item->qty ?? 0);
        $today = now()->startOfDay();
        $expiredStockQty = 0.0;

        $batches = $item->relationLoaded('batches')
            ? $item->batches
            : $item->batches()->where('qty', '>', 0)->get();

        $batchTotal = 0.0;
        foreach ($batches as $batch) {
            $batchQty = (float) $batch->qty;
            if ($batchQty <= 0) {
                continue;
            }

            $batchTotal += $batchQty;

            if (!$batch->expiry_date) {
                continue;
            }

            if ($batch->expiry_date->copy()->startOfDay()->lt($today)) {
                $expiredStockQty += $batchQty;
            }
        }

        $unbatchedQty = round(max(0, $qty - $batchTotal), 2);
        if ($unbatchedQty > 0.001 && $item->expiry_date) {
            if ($item->expiry_date->copy()->startOfDay()->lt($today)) {
                $expiredStockQty += $unbatchedQty;
            }
        } elseif ($batches->isEmpty() && $item->expiry_date && $qty > 0) {
            if ($item->expiry_date->copy()->startOfDay()->lt($today)) {
                $expiredStockQty = max(0, $qty);
            }
        }

        $expiredStockQty = round($expiredStockQty, 2);

        return [
            'sellable_qty' => round(max(0, $qty - $expiredStockQty), 2),
            'expired_stock_qty' => $expiredStockQty,
            'unbatched_qty' => $unbatchedQty,
        ];
    }

    /**
     * @return array{
     *   nearest_expiry_date: ?string,
     *   main_expiry_date: ?string,
     *   nearest_batch_expiry_date: ?string,
     *   nearest_batch_expiry_qty: float,
     *   expiry_status: string,
     *   expiry_days_remaining: ?int,
     *   has_expired_stock: bool
     * }
     */
    private function resolveExpiryFields(Item $item, int $alertDays): array
    {
        $today = now()->startOfDay();
        $allDated = [];
        $sellableDated = [];
        $batchAllDated = [];
        $batchSellableDated = [];
        $hasExpiredStock = false;

        $batches = $item->relationLoaded('batches')
            ? $item->batches
            : $item->batches()->where('qty', '>', 0)->whereNotNull('expiry_date')->get();

        $batchTotal = 0.0;
        foreach ($batches as $batch) {
            $batchQty = (float) $batch->qty;
            if ($batchQty <= 0) {
                continue;
            }

            $batchTotal += $batchQty;

            if (!$batch->expiry_date) {
                continue;
            }

            $date = $batch->expiry_date->copy()->startOfDay();
            $allDated[] = $date;
            $batchAllDated[] = $date;
            if ($date->gte($today)) {
                $sellableDated[] = $date;
                $batchSellableDated[] = $date;
            } else {
                $hasExpiredStock = true;
            }
        }

        $unbatchedQty = round(max(0, (float) ($item->qty ?? 0) - $batchTotal), 2);
        $mainExpiryDate = ($unbatchedQty > 0.001 && $item->expiry_date)
            ? $item->expiry_date->format('Y-m-d')
            : null;

        /** @var Carbon|null $batchNearestForDisplay */
        $batchNearestForDisplay = $batchSellableDated !== []
            ? collect($batchSellableDated)->sort()->first()
            : ($batchAllDated !== [] ? collect($batchAllDated)->sort()->first() : null);
        $nearestBatchExpiryDate = $batchNearestForDisplay?->format('Y-m-d');
        $nearestBatchExpiryQty = $this->sumBatchQtyAtExpiry($item, $batches, $batchNearestForDisplay);

        /** Main unbatched stock expiry — show on item until that date passes. */
        $mainExpiryForDisplay = null;
        if ($unbatchedQty > 0.001 && $item->expiry_date) {
            $date = $item->expiry_date->copy()->startOfDay();
            $allDated[] = $date;
            if ($date->gte($today)) {
                $sellableDated[] = $date;
                $mainExpiryForDisplay = $date;
            } else {
                $hasExpiredStock = true;
            }
        } elseif ($allDated === [] && $item->expiry_date) {
            $date = $item->expiry_date->copy()->startOfDay();
            $allDated[] = $date;
            if ($date->gte($today)) {
                $sellableDated[] = $date;
            } else {
                $hasExpiredStock = true;
            }
        }

        /** @var Carbon|null $nearest */
        $nearest = $mainExpiryForDisplay ?? (
            $sellableDated !== []
                ? collect($sellableDated)->sort()->first()
                : ($allDated !== [] ? collect($allDated)->sort()->first() : null)
        );

        if ($nearest === null) {
            return [
                'nearest_expiry_date' => null,
                'main_expiry_date' => $mainExpiryDate,
                'nearest_batch_expiry_date' => $nearestBatchExpiryDate,
                'nearest_batch_expiry_qty' => $nearestBatchExpiryQty,
                'expiry_status' => 'none',
                'expiry_days_remaining' => null,
                'has_expired_stock' => false,
            ];
        }

        $daysRemaining = (int) $today->diffInDays($nearest, false);

        if ($nearest->lt($today)) {
            $status = 'expired';
        } elseif ($daysRemaining <= $alertDays) {
            $status = 'expiring_soon';
        } else {
            $status = 'ok';
        }

        return [
            'nearest_expiry_date' => $nearest->format('Y-m-d'),
            'main_expiry_date' => $mainExpiryDate,
            'nearest_batch_expiry_date' => $nearestBatchExpiryDate,
            'nearest_batch_expiry_qty' => $nearestBatchExpiryQty,
            'expiry_status' => $status,
            'expiry_days_remaining' => $daysRemaining,
            'has_expired_stock' => $hasExpiredStock,
        ];
    }

    /**
     * @param  \Illuminate\Support\Collection<int, ItemBatch>|array<int, ItemBatch>  $batches
     */
    private function sumBatchQtyAtExpiry(Item $item, $batches, ?Carbon $targetExpiry): float
    {
        if ($targetExpiry === null) {
            return 0.0;
        }

        $targetDate = $targetExpiry->format('Y-m-d');
        $loadedBatches = $batches instanceof \Illuminate\Support\Collection
            ? $batches
            : collect($batches);

        if ($loadedBatches->isEmpty()) {
            $loadedBatches = $item->batches()->where('qty', '>', 0)->get();
        }

        $total = 0.0;
        foreach ($loadedBatches as $batch) {
            if ((float) $batch->qty <= 0 || !$batch->expiry_date) {
                continue;
            }

            if ($batch->expiry_date->format('Y-m-d') === $targetDate) {
                $total += (float) $batch->qty;
            }
        }

        return round($total, 2);
    }
}
