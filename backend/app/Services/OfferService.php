<?php

namespace App\Services;

use App\Models\Item;
use App\Models\ItemBatch;
use App\Models\Offer;
use App\Models\User;
use App\Support\StorageUrl;
use Exception;
use Illuminate\Support\Facades\Storage;

class OfferService
{
    public function __construct(private CompanySettingService $companySettingService)
    {
    }

    public function getAllForUser(User $user, ?string $discountType = null, ?string $status = null): array
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $companyId = $company->id;

        $allOffers = Offer::where('company_id', $companyId)->get(['id', 'is_active', 'discount_type']);
        $summary = [
            'total_offers' => $allOffers->count(),
            'active_offers' => $allOffers->where('is_active', true)->count(),
            'product_offers' => $allOffers->where('discount_type', 'product')->count(),
            'order_offers' => $allOffers->where('discount_type', 'order')->count(),
        ];

        $query = Offer::where('company_id', $companyId);

        if ($discountType && $discountType !== 'all') {
            $query->where('discount_type', $discountType);
        }

        if ($status && $status !== 'all') {
            if ($status === 'Active') {
                $query->where('is_active', true);
            } elseif ($status === 'Inactive') {
                $query->where('is_active', false);
            }
        }

        $offers = $query
            ->with([
                'items:id,item_number,description',
                'itemBatches:id,batch_number,item_id',
                'itemBatches.item:id,item_number',
            ])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Offer $offer) => $this->formatOffer($offer));

        return [
            'offers' => $offers,
            'summary' => $summary,
            'filters' => [
                'discount_types' => ['product', 'order'],
                'statuses' => ['Active', 'Inactive'],
            ],
        ];
    }

    /** How many products or batches this offer covers (0 for order offers). */
    public function coverageCount(Offer $offer): int
    {
        if ($offer->discount_type === 'order') {
            return 0;
        }

        $batchCount = $offer->relationLoaded('itemBatches') ? $offer->itemBatches->count() : 0;
        if ($batchCount > 0) {
            return $batchCount;
        }

        return $offer->relationLoaded('items') ? $offer->items->count() : 0;
    }

    /** @return 'order'|'product'|'batch' */
    public function coverageUnit(Offer $offer): string
    {
        if ($offer->discount_type === 'order') {
            return 'order';
        }

        $batchCount = $offer->relationLoaded('itemBatches') ? $offer->itemBatches->count() : 0;

        return $batchCount > 0 ? 'batch' : 'product';
    }

    public function getForUser(User $user, int $id): array
    {
        $offer = $this->findForUser($user, $id);
        $offer->load([
            'items:id,item_number,description,category,sub_category,selling_price',
            'itemBatches' => fn ($q) => $q->with('item:id,item_number,description'),
        ]);

        return $this->formatOffer($offer);
    }

    public function createForUser(User $user, array $data): array
    {
        $company = $this->companySettingService->getCompanyForUser($user);

        if (trim((string) ($data['name'] ?? '')) === '') {
            throw new Exception('Offer name is required.');
        }

        $discountType = $data['discount_type'] ?? 'product';
        $discountRules = $this->normalizeDiscountRules($data['discount_rules'] ?? null, $discountType);
        $itemIds = $this->resolveProductOfferItemIds($discountType, $discountRules, $data['item_ids'] ?? null);
        $batchIds = $this->resolveProductOfferBatchIds($discountType, $data['item_batch_ids'] ?? null);
        $this->validateDiscountRulesForType($discountType, $discountRules, $itemIds);

        $offer = Offer::create([
            'company_id' => $company->id,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'days_of_week_enabled' => (bool) ($data['days_of_week_enabled'] ?? false),
            'days_of_week' => $data['days_of_week'] ?? [],
            'expiration_enabled' => (bool) ($data['expiration_enabled'] ?? false),
            'expiration_date' => $data['expiration_date'] ?? null,
            'discount_type' => $discountType,
            'pricing_mode' => $this->normalizePricingMode($data['pricing_mode'] ?? null),
            'discount_rules' => $discountRules,
            'is_active' => $data['is_active'] ?? true,
        ]);

        if ($discountType === 'order') {
            $offer->items()->detach();
            $offer->itemBatches()->detach();
        } else {
            $this->syncItems($company->id, $offer, $itemIds);
            $this->syncBatches($company->id, $offer, $batchIds);
        }

        return $this->formatOffer($offer->fresh()->load([
            'items:id,item_number,description,category,sub_category,selling_price',
            'itemBatches' => fn ($q) => $q->with('item:id,item_number,description'),
        ]));
    }

    public function updateForUser(User $user, int $id, array $data): array
    {
        $offer = $this->findForUser($user, $id);

        $payload = [];
        $fields = [
            'name', 'description', 'days_of_week_enabled', 'days_of_week',
            'expiration_enabled', 'expiration_date', 'discount_type', 'pricing_mode',
            'discount_rules', 'is_active',
        ];

        foreach ($fields as $field) {
            if (array_key_exists($field, $data)) {
                $payload[$field] = $data[$field];
            }
        }

        $discountType = $payload['discount_type'] ?? $offer->discount_type;

        if (array_key_exists('name', $payload)) {
            $name = trim((string) $payload['name']);
            if ($name === '') {
                throw new Exception('Offer name is required.');
            }
            $payload['name'] = $name;
        }

        if (array_key_exists('description', $payload)) {
            $description = trim((string) ($payload['description'] ?? ''));
            $payload['description'] = $description === '' ? null : $description;
        }

        if (array_key_exists('pricing_mode', $payload)) {
            $payload['pricing_mode'] = $this->normalizePricingMode($payload['pricing_mode']);
        }

        if (array_key_exists('discount_rules', $data)) {
            $payload['discount_rules'] = $this->normalizeDiscountRules($data['discount_rules'], $discountType);
        }
        $rulesToValidate = $payload['discount_rules'] ?? array_merge(
            $this->defaultDiscountRules(),
            $offer->discount_rules ?? []
        );
        $itemIds = array_key_exists('item_ids', $data)
            ? $this->resolveProductOfferItemIds($discountType, $rulesToValidate, $data['item_ids'])
            : ($discountType === 'product'
                ? $offer->items()->pluck('items.id')->all()
                : null);
        $batchIds = array_key_exists('item_batch_ids', $data)
            ? $this->resolveProductOfferBatchIds($discountType, $data['item_batch_ids'])
            : ($discountType === 'product'
                ? $offer->itemBatches()->pluck('item_batches.id')->all()
                : null);
        $this->validateDiscountRulesForType($discountType, $rulesToValidate, $itemIds);

        if ($payload !== []) {
            $offer->update($payload);
            $offer->refresh();
        }

        if ($discountType === 'order') {
            $offer->items()->detach();
            $offer->itemBatches()->detach();
        } else {
            if (array_key_exists('item_ids', $data)) {
                $company = $this->companySettingService->getCompanyForUser($user);
                $this->syncItems($company->id, $offer, $itemIds ?? []);
            }
            if (array_key_exists('item_batch_ids', $data)) {
                $company = $this->companySettingService->getCompanyForUser($user);
                $this->syncBatches($company->id, $offer, $batchIds ?? []);
            }
        }

        return $this->formatOffer($offer->fresh()->load([
            'items:id,item_number,description,category,sub_category,selling_price',
            'itemBatches' => fn ($q) => $q->with('item:id,item_number,description'),
        ]));
    }

    public function deleteForUser(User $user, int $id): void
    {
        $this->findForUser($user, $id)->delete();
    }

    public function defaultDiscountRules(): array
    {
        return [
            'buy_x_percent_off_all' => [
                'enabled' => true,
                'buy_quantity' => 0,
                'product_id' => null,
                'product_name' => '',
                'percent_off' => 0,
            ],
            'set_percent_selected' => [
                'enabled' => false,
                'percent_off' => 0,
                'product_name' => '',
            ],
            'bargain_bin' => [
                'enabled' => false,
                'price' => 0,
            ],
            'buy_x_fixed_off' => [
                'enabled' => false,
                'buy_quantity' => 0,
                'product_id' => null,
                'product_name' => '',
                'amount_off' => 0,
            ],
            'buy_x_amount_off_each' => [
                'enabled' => false,
                'buy_quantity' => 0,
                'product_id' => null,
                'product_name' => '',
                'amount_off_each' => 0,
            ],
            'order_min_total_percent' => [
                'enabled' => true,
                'min_order_amount' => 0,
                'percent_off' => 0,
            ],
            'order_promo_code_percent' => [
                'enabled' => false,
                'percent_off' => 0,
                'promo_code' => '',
            ],
        ];
    }

    private function findForUser(User $user, int $id): Offer
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $offer = Offer::where('company_id', $company->id)->where('id', $id)->first();

        if (!$offer) {
            throw new Exception('Offer not found.');
        }

        return $offer;
    }

    /**
     * @param  array<int, int|string>|null  $itemIds
     */
    private function syncItems(int $companyId, Offer $offer, mixed $itemIds): void
    {
        if (!is_array($itemIds)) {
            $offer->items()->detach();

            return;
        }

        $ids = $this->expandItemIdsByItemNumber($companyId, $itemIds);
        if ($ids === []) {
            $offer->items()->detach();

            return;
        }

        $valid = Item::where('company_id', $companyId)->whereIn('id', $ids)->pluck('id')->all();
        if (count($valid) !== count($ids)) {
            throw new Exception('One or more selected items are invalid.');
        }

        $offer->items()->sync($valid);
    }

    /**
     * @param  array<int, int|string>|null  $batchIds
     */
    private function syncBatches(int $companyId, Offer $offer, mixed $batchIds): void
    {
        if (!is_array($batchIds)) {
            $offer->itemBatches()->detach();

            return;
        }

        $ids = array_values(array_unique(array_filter(array_map('intval', $batchIds))));
        if ($ids === []) {
            $offer->itemBatches()->detach();

            return;
        }

        $valid = ItemBatch::where('company_id', $companyId)
            ->whereIn('id', $ids)
            ->pluck('id')
            ->all();

        if (count($valid) !== count($ids)) {
            throw new Exception('One or more selected batches are invalid.');
        }

        $offer->itemBatches()->sync($valid);
    }

    /**
     * @return list<int>|null
     */
    private function resolveProductOfferBatchIds(string $discountType, mixed $rawBatchIds): ?array
    {
        if ($discountType !== 'product') {
            return null;
        }

        if (!is_array($rawBatchIds)) {
            return [];
        }

        return array_values(array_unique(array_filter(array_map('intval', $rawBatchIds))));
    }

    /**
     * @return list<int>|null
     */
    private function resolveProductOfferItemIds(string $discountType, array $rules, mixed $rawItemIds): ?array
    {
        if ($discountType !== 'product') {
            return null;
        }

        $itemIds = is_array($rawItemIds) ? $rawItemIds : [];
        if ($itemIds === []) {
            $itemIds = $this->collectRuleProductIds($rules);
        }

        return array_values(array_unique(array_filter(array_map('intval', $itemIds))));
    }

    /**
     * @param  array<int, int|string>  $itemIds
     * @return list<int>
     */
    private function expandItemIdsByItemNumber(int $companyId, array $itemIds): array
    {
        $ids = array_values(array_unique(array_filter(array_map('intval', $itemIds))));
        if ($ids === []) {
            return [];
        }

        $numbers = Item::where('company_id', $companyId)
            ->whereIn('id', $ids)
            ->pluck('item_number')
            ->map(fn ($number) => trim((string) $number))
            ->filter()
            ->unique()
            ->values()
            ->all();

        if ($numbers === []) {
            return $ids;
        }

        $expanded = Item::where('company_id', $companyId)
            ->whereIn('item_number', $numbers)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();

        return array_values(array_unique(array_merge($ids, $expanded)));
    }

    private function normalizeDiscountRules(?array $rules, ?string $discountType = null): array
    {
        $merged = array_merge($this->defaultDiscountRules(), $rules ?? []);

        if ($discountType === 'product') {
            $merged['order_min_total_percent']['enabled'] = false;
            $merged['order_promo_code_percent']['enabled'] = false;
        } elseif ($discountType === 'order') {
            foreach ([
                'buy_x_percent_off_all',
                'set_percent_selected',
                'bargain_bin',
                'buy_x_fixed_off',
                'buy_x_amount_off_each',
            ] as $productKey) {
                $merged[$productKey]['enabled'] = false;
            }
        }

        foreach (['buy_x_percent_off_all', 'buy_x_fixed_off', 'buy_x_amount_off_each'] as $key) {
            if (isset($merged[$key]['product_id'])) {
                $merged[$key]['product_id'] = $merged[$key]['product_id'] !== null && $merged[$key]['product_id'] !== ''
                    ? (int) $merged[$key]['product_id']
                    : null;
            }
            if (array_key_exists('product_name', $merged[$key] ?? [])) {
                $merged[$key]['product_name'] = (string) ($merged[$key]['product_name'] ?? '');
            }
        }

        if (isset($merged['set_percent_selected']['product_name'])) {
            $merged['set_percent_selected']['product_name'] = (string) ($merged['set_percent_selected']['product_name'] ?? '');
        }

        if (isset($merged['order_promo_code_percent']['promo_code'])) {
            $code = trim((string) $merged['order_promo_code_percent']['promo_code']);
            $merged['order_promo_code_percent']['promo_code'] = $code === '' ? '' : strtoupper($code);
        }

        return $merged;
    }

    private function validateDiscountRulesForType(string $discountType, array $rules, ?array $itemIds = null): void
    {
        if ($discountType === 'order') {
            $minEnabled = !empty($rules['order_min_total_percent']['enabled']);
            $promoEnabled = !empty($rules['order_promo_code_percent']['enabled']);

            if (!$minEnabled && !$promoEnabled) {
                throw new Exception('Enable at least one order discount rule (minimum order total or promo code).');
            }

            if ($promoEnabled && trim((string) ($rules['order_promo_code_percent']['promo_code'] ?? '')) === '') {
                throw new Exception('Promo code is required when promo code discount is enabled.');
            }

            return;
        }

        $productRuleKeys = [
            'buy_x_percent_off_all',
            'set_percent_selected',
            'bargain_bin',
            'buy_x_fixed_off',
            'buy_x_amount_off_each',
        ];

        $anyEnabled = false;
        foreach ($productRuleKeys as $key) {
            if (!empty($rules[$key]['enabled'])) {
                $anyEnabled = true;
                break;
            }
        }

        if (!$anyEnabled) {
            throw new Exception('Enable at least one product discount rule.');
        }

        if ($itemIds !== null && $itemIds === []) {
            throw new Exception('Select at least one product for this offer.');
        }
    }

    /**
     * @param  array<string, mixed>  $rules
     * @return list<int>
     */
    private function collectRuleProductIds(array $rules): array
    {
        $ids = [];
        foreach (['buy_x_percent_off_all', 'buy_x_fixed_off', 'buy_x_amount_off_each'] as $key) {
            if (empty($rules[$key]['enabled'])) {
                continue;
            }
            $productId = $rules[$key]['product_id'] ?? null;
            if ($productId !== null && $productId !== '') {
                $ids[] = (int) $productId;
            }
        }

        return array_values(array_unique($ids));
    }

    private function summarizeOfferItems(Offer $offer): string
    {
        if ($offer->discount_type === 'order') {
            $rules = array_merge($this->defaultDiscountRules(), $offer->discount_rules ?? []);
            $parts = [];
            if (!empty($rules['order_min_total_percent']['enabled'])) {
                $parts[] = 'Min Rs '.($rules['order_min_total_percent']['min_order_amount'] ?? 0)
                    .' → '.($rules['order_min_total_percent']['percent_off'] ?? 0).'%';
            }
            if (!empty($rules['order_promo_code_percent']['enabled'])) {
                $parts[] = 'Promo '.($rules['order_promo_code_percent']['promo_code'] ?? '')
                    .' → '.($rules['order_promo_code_percent']['percent_off'] ?? 0).'%';
            }

            return $parts !== [] ? implode('; ', $parts) : 'Order total discount';
        }

        if ($offer->relationLoaded('itemBatches') && $offer->itemBatches->isNotEmpty()) {
            $batches = $offer->itemBatches;
            $count = $batches->count();
            $labels = $batches->take(3)->map(function (ItemBatch $batch) {
                $item = $batch->relationLoaded('item') ? $batch->item : null;
                $itemNumber = trim((string) ($item?->item_number ?? ''));

                return ($itemNumber !== '' ? $itemNumber.' / ' : '').$batch->batch_number;
            })->all();
            $suffix = $count > 3 ? ' +'.($count - 3).' more' : '';

            return $count.' batch'.($count === 1 ? '' : 'es').': '.implode(', ', $labels).$suffix;
        }

        if ($offer->relationLoaded('items') && $offer->items->isNotEmpty()) {
            $names = $offer->items->take(3)->map(fn (Item $item) => $item->description ?: $item->item_number)->all();
            $suffix = $offer->items->count() > 3 ? ' +'.($offer->items->count() - 3).' more' : '';

            return $offer->items->count().' product'.($offer->items->count() === 1 ? '' : 'es')
                .': '.implode(', ', $names).$suffix;
        }

        return ucfirst((string) $offer->discount_type).' offer';
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function formatSelectedItems(Offer $offer): array
    {
        if (!$offer->relationLoaded('items')) {
            return [];
        }

        return $offer->items->map(fn (Item $item) => [
            'id' => $item->id,
            'item_number' => $item->item_number,
            'description' => $item->description,
            'category' => $item->category,
            'sub_category' => $item->sub_category,
            'selling_price' => (float) ($item->selling_price ?? 0),
        ])->values()->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function formatSelectedBatches(Offer $offer): array
    {
        if (!$offer->relationLoaded('itemBatches')) {
            return [];
        }

        return $offer->itemBatches->map(function (ItemBatch $batch) {
            $item = $batch->relationLoaded('item') ? $batch->item : null;

            return [
                'id' => $batch->id,
                'batch_number' => $batch->batch_number,
                'location' => $batch->location,
                'qty' => (float) $batch->qty,
                'purchase_price' => (float) ($batch->purchase_price ?? 0),
                'selling_price' => $batch->selling_price !== null ? (float) $batch->selling_price : null,
                'expiry_date' => $batch->expiry_date?->format('Y-m-d'),
                'item_id' => $batch->item_id,
                'item_number' => $item?->item_number,
                'description' => $item?->description,
            ];
        })->values()->all();
    }

    private function normalizePricingMode(?string $mode): string
    {
        $normalized = strtolower(trim((string) ($mode ?? 'both')));

        return in_array($normalized, ['retail', 'wholesale', 'both'], true) ? $normalized : 'both';
    }

    private function pricingModeLabel(string $mode): string
    {
        return match ($mode) {
            'retail' => 'Retail only',
            'wholesale' => 'Wholesale only',
            default => 'Retail & Wholesale',
        };
    }

    private function formatOffer(Offer $offer): array
    {
        return [
            'id' => $offer->id,
            'name' => $offer->name,
            'description' => $offer->description,
            'image_path' => $offer->image_path,
            'image_url' => StorageUrl::publicUrl($offer->image_path),
            'created_at' => $offer->created_at?->format('Y-m-d H:i:s'),
            'created_at_display' => $offer->created_at?->format('d-m-Y'),
            'offer_items' => $this->summarizeOfferItems($offer),
            'status' => $offer->is_active ? 'Active' : 'Inactive',
            'discount_type_label' => $offer->discount_type === 'order' ? 'Order' : 'Product',
            'days_of_week_enabled' => (bool) $offer->days_of_week_enabled,
            'days_of_week' => $offer->days_of_week ?? [],
            'expiration_enabled' => (bool) $offer->expiration_enabled,
            'expiration_date' => $offer->expiration_date?->format('Y-m-d'),
            'discount_type' => $offer->discount_type,
            'pricing_mode' => $this->normalizePricingMode($offer->pricing_mode),
            'pricing_mode_label' => $this->pricingModeLabel($this->normalizePricingMode($offer->pricing_mode)),
            'discount_rules' => array_merge(
                $this->defaultDiscountRules(),
                $offer->discount_rules ?? []
            ),
            'is_active' => (bool) $offer->is_active,
            'item_ids' => $offer->relationLoaded('items')
                ? $offer->items->pluck('id')->values()->all()
                : [],
            'item_batch_ids' => $offer->relationLoaded('itemBatches')
                ? $offer->itemBatches->pluck('id')->values()->all()
                : [],
            'selected_items' => $this->formatSelectedItems($offer),
            'selected_batches' => $this->formatSelectedBatches($offer),
            'selection_count' => $this->coverageCount($offer),
            'selection_unit' => $this->coverageUnit($offer),
            'product_count' => $offer->relationLoaded('items') ? $offer->items->count() : 0,
            'batch_count' => $offer->relationLoaded('itemBatches') ? $offer->itemBatches->count() : 0,
        ];
    }
}
