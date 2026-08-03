<?php

namespace App\Services;

use App\Models\Item;
use App\Models\Offer;
use App\Models\User;
use App\Support\StorageUrl;
use Carbon\Carbon;
use Exception;

class OfferDiscountService
{
    public function __construct(
        private CompanySettingService $companySettingService,
        private OfferService $offerService,
    ) {
    }

    public function getApplicableOffersForUser(User $user, ?string $saleDate = null): array
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $date = ($saleDate ? Carbon::parse($saleDate) : now())->copy();

        return Offer::where('company_id', $company->id)
            ->where('is_active', true)
            ->with(['items:id,item_number,description', 'itemBatches:id'])
            ->orderBy('name')
            ->get()
            ->filter(fn (Offer $offer) => $this->isOfferValidOnDate($offer, $date))
            ->map(fn (Offer $offer) => $this->formatApplicableOffer($offer))
            ->values()
            ->all();
    }

    public function resolveOfferForUser(User $user, int $offerId): Offer
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $offer = Offer::where('company_id', $company->id)
            ->where('id', $offerId)
            ->with(['items', 'itemBatches'])
            ->first();

        if (!$offer) {
            throw new Exception('Offer not found.');
        }

        if (!$offer->is_active) {
            throw new Exception('This offer is inactive.');
        }

        return $offer;
    }

    public function assertOfferValid(Offer $offer, ?string $saleDate = null): void
    {
        $date = ($saleDate ? Carbon::parse($saleDate) : now())->copy();

        if (!$this->isOfferValidOnDate($offer, $date)) {
            throw new Exception('This offer is not valid for the selected date.');
        }
    }

    /**
     * Apply offer rules to sale lines and return adjusted lines plus discount amount.
     *
     * @param  array<int, array<string, mixed>>  $lines
     * @return array{lines: array<int, array<string, mixed>>, offer_discount: float, offer_promo_code: ?string}
     */
    public function applyToLines(
        Offer $offer,
        array $lines,
        ?string $saleDate = null,
        ?string $promoCode = null,
    ): array {
        $this->assertOfferValid($offer, $saleDate);

        $offer->loadMissing(['items', 'itemBatches']);
        $identity = $this->buildOfferItemIdentity($offer);
        $offerBatchIds = $identity['batch_ids'];
        $rules = array_merge($this->offerService->defaultDiscountRules(), $offer->discount_rules ?? []);
        $normalizedPromo = $this->normalizePromoCode($promoCode);
        $companyId = (int) $offer->company_id;

        if (
            $offer->discount_type !== 'order'
            && $identity['ids'] === []
            && $identity['numbers'] === []
            && $offerBatchIds === []
        ) {
            throw new Exception('This product offer has no linked products.');
        }

        $totalOfferDiscount = 0.0;
        $adjustedLines = [];
        $selectionLines = [];

        foreach ($lines as $line) {
            $itemId = isset($line['item_id']) && $line['item_id'] !== '' ? (int) $line['item_id'] : null;
            $itemNumber = trim((string) ($line['item_number'] ?? ''));
            $lineBatchId = isset($line['item_batch_id']) && $line['item_batch_id'] !== '' && $line['item_batch_id'] !== null
                ? (int) $line['item_batch_id']
                : null;
            $qty = (float) ($line['qty'] ?? 1);
            $inOfferSelection = $this->lineInOfferSelection(
                $itemId,
                $itemNumber !== '' ? $itemNumber : null,
                $identity['ids'],
                $identity['numbers'],
                $companyId,
                $lineBatchId,
                $offerBatchIds,
            );
            $selectionLines[] = [
                'item_id' => $itemId,
                'item_number' => $itemNumber !== '' ? $itemNumber : null,
                'qty' => max(0, $qty),
                'in_offer_selection' => $inOfferSelection,
            ];
        }

        $selectionQtyTotal = round(array_sum(array_map(
            fn (array $s) => $s['in_offer_selection'] ? (float) $s['qty'] : 0.0,
            $selectionLines
        )), 6);

        foreach ($lines as $line) {
            $itemId = isset($line['item_id']) && $line['item_id'] !== '' ? (int) $line['item_id'] : null;
            $itemNumber = trim((string) ($line['item_number'] ?? ''));
            $lineBatchId = isset($line['item_batch_id']) && $line['item_batch_id'] !== '' && $line['item_batch_id'] !== null
                ? (int) $line['item_batch_id']
                : null;
            $qty = (float) ($line['qty'] ?? 1);
            $unitPrice = (float) ($line['unit_price'] ?? 0);
            $lineTotal = round($qty * $unitPrice, 2);
            $lineDiscount = 0.0;

            if ($offer->discount_type === 'order') {
                $adjustedLines[] = array_merge($line, [
                    'line_total' => $lineTotal,
                ]);
                continue;
            }

            if (!$itemId && $itemNumber === '') {
                $adjustedLines[] = array_merge($line, [
                    'line_total' => $lineTotal,
                ]);
                continue;
            }

            $inOfferSelection = $this->lineInOfferSelection(
                $itemId,
                $itemNumber !== '' ? $itemNumber : null,
                $identity['ids'],
                $identity['numbers'],
                $companyId,
                $lineBatchId,
                $offerBatchIds,
            );

            if ($inOfferSelection && !empty($rules['bargain_bin']['enabled'])) {
                $binPrice = max(0, (float) ($rules['bargain_bin']['price'] ?? 0));
                $newTotal = round($binPrice * $qty, 2);
                $lineDiscount = max(0, round($lineTotal - $newTotal, 2));
                $unitPrice = $qty > 0 ? round($newTotal / $qty, 2) : 0;
                $lineTotal = $newTotal;
            } else {
                $lineDiscount += $this->productLineDiscount(
                    $rules,
                    $itemId,
                    $itemNumber !== '' ? $itemNumber : null,
                    $inOfferSelection,
                    $qty,
                    $lineTotal,
                    $companyId,
                    $selectionQtyTotal,
                    $selectionLines,
                );

                if ($lineDiscount > 0) {
                    $newTotal = max(0, round($lineTotal - $lineDiscount, 2));
                    $unitPrice = $qty > 0 ? round($newTotal / $qty, 2) : 0;
                    $lineTotal = $newTotal;
                }
            }

            $totalOfferDiscount += $lineDiscount;

            $adjustedLines[] = array_merge($line, [
                'item_batch_id' => $lineBatchId,
                'unit_price' => $unitPrice,
                'line_total' => $lineTotal,
                'offer_discount' => round($lineDiscount, 2),
            ]);
        }

        if ($offer->discount_type === 'order') {
            $subTotal = round(array_sum(array_column($adjustedLines, 'line_total')), 2);
            $this->assertOrderOfferRequirements($rules, $normalizedPromo);
            $orderDiscount = $this->orderLevelDiscount($rules, $subTotal, $normalizedPromo);
            $totalOfferDiscount += $orderDiscount;
        }

        return [
            'lines' => $adjustedLines,
            'offer_discount' => round($totalOfferDiscount, 2),
            'offer_promo_code' => $normalizedPromo,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function formatApplicableOffer(Offer $offer): array
    {
        $rules = array_merge($this->offerService->defaultDiscountRules(), $offer->discount_rules ?? []);
        $promoRule = $rules['order_promo_code_percent'] ?? [];
        $minRule = $rules['order_min_total_percent'] ?? [];
        $productPercent = null;
        $discountSummary = null;

        if ($offer->discount_type === 'product') {
            if (!empty($rules['set_percent_selected']['enabled'])) {
                $productPercent = (float) ($rules['set_percent_selected']['percent_off'] ?? 0);
                $discountSummary = $productPercent.'% off selected items';
            } elseif (!empty($rules['bargain_bin']['enabled'])) {
                $discountSummary = 'Bargain bin Rs '.($rules['bargain_bin']['price'] ?? 0);
            } elseif (!empty($rules['buy_x_percent_off_all']['enabled'])) {
                $productPercent = (float) ($rules['buy_x_percent_off_all']['percent_off'] ?? 0);
                $discountSummary = 'Buy '.$rules['buy_x_percent_off_all']['buy_quantity'].' → '.$productPercent.'% off';
            }
        } elseif ($offer->discount_type === 'order') {
            if (!empty($minRule['enabled'])) {
                $discountSummary = 'Min Rs '.($minRule['min_order_amount'] ?? 0)
                    .' → '.($minRule['percent_off'] ?? 0).'% off order';
            } elseif (!empty($promoRule['enabled'])) {
                $discountSummary = ($promoRule['percent_off'] ?? 0).'% off with promo code';
            }
        }

        $pricingMode = strtolower(trim((string) ($offer->pricing_mode ?? 'both')));
        if (!in_array($pricingMode, ['retail', 'wholesale', 'both'], true)) {
            $pricingMode = 'both';
        }

        $batchCount = $offer->relationLoaded('itemBatches') ? $offer->itemBatches->count() : 0;
        $productCount = $offer->items->count();
        $restrictsBatches = $batchCount > 0;
        $coverageCount = $this->offerService->coverageCount($offer);

        return [
            'id' => $offer->id,
            'name' => $offer->name,
            'discount_type' => $offer->discount_type,
            'pricing_mode' => $pricingMode,
            'pricing_mode_label' => match ($pricingMode) {
                'retail' => 'Retail only',
                'wholesale' => 'Wholesale only',
                default => 'Retail & Wholesale',
            },
            'image_url' => StorageUrl::publicUrl($offer->image_path),
            'item_count' => $coverageCount,
            'product_count' => $productCount,
            'item_ids' => $offer->items->pluck('id')->values()->all(),
            'item_numbers' => $offer->items->pluck('item_number')->values()->all(),
            'item_batch_ids' => $offer->relationLoaded('itemBatches')
                ? $offer->itemBatches->pluck('id')->values()->all()
                : [],
            'batch_count' => $batchCount,
            'restricts_batches' => $restrictsBatches,
            'selection_count' => $coverageCount,
            'selection_unit' => $this->offerService->coverageUnit($offer),
            'product_percent_off' => $productPercent,
            'discount_summary' => $discountSummary,
            'requires_promo_code' => $offer->discount_type === 'order'
                && !empty($promoRule['enabled'])
                && empty($minRule['enabled']),
            'uses_min_order_total' => $offer->discount_type === 'order'
                && !empty($minRule['enabled']),
            'min_order_amount' => (float) ($minRule['min_order_amount'] ?? 0),
            'min_percent_off' => (float) ($minRule['percent_off'] ?? 0),
            'promo_percent_off' => (float) ($promoRule['percent_off'] ?? 0),
        ];
    }

    /**
     * @return array{ids: list<int>, numbers: list<string>, batch_ids: list<int>}
     */
    private function buildOfferItemIdentity(Offer $offer): array
    {
        return [
            'ids' => $offer->items->pluck('id')->map(fn ($id) => (int) $id)->values()->all(),
            'numbers' => $offer->items
                ->pluck('item_number')
                ->map(fn ($number) => trim((string) $number))
                ->filter()
                ->unique()
                ->values()
                ->all(),
            'batch_ids' => $offer->relationLoaded('itemBatches')
                ? $offer->itemBatches->pluck('id')->map(fn ($id) => (int) $id)->values()->all()
                : [],
        ];
    }

    /**
     * @param  list<int>  $offerItemIds
     * @param  list<string>  $offerItemNumbers
     * @param  list<int>  $offerBatchIds
     */
    private function lineInOfferSelection(
        ?int $itemId,
        ?string $itemNumber,
        array $offerItemIds,
        array $offerItemNumbers,
        int $companyId,
        ?int $lineBatchId = null,
        array $offerBatchIds = [],
    ): bool {
        // Batch-only offer: no item ids/numbers, only selected batch ids.
        if ($offerBatchIds !== [] && $offerItemIds === [] && $offerItemNumbers === []) {
            return $lineBatchId !== null && in_array($lineBatchId, $offerBatchIds, true);
        }

        if ($offerItemIds === [] && $offerItemNumbers === []) {
            return false;
        }

        $itemMatches = false;

        if ($itemId && in_array($itemId, $offerItemIds, true)) {
            $itemMatches = true;
        }

        $number = trim((string) ($itemNumber ?? ''));
        if (!$itemMatches && $number !== '') {
            $itemMatches = $this->itemNumberInOfferList($number, $offerItemNumbers);
        }

        if (!$itemMatches && $itemId) {
            $lineItem = Item::where('company_id', $companyId)->where('id', $itemId)->first();
            if ($lineItem && $this->itemNumberInOfferList($lineItem->item_number, $offerItemNumbers)) {
                $itemMatches = true;
            }
        }

        if (!$itemMatches) {
            return false;
        }

        if ($offerBatchIds !== []) {
            return $lineBatchId !== null && in_array($lineBatchId, $offerBatchIds, true);
        }

        return true;
    }

    /**
     * @param  list<string>  $offerItemNumbers
     */
    private function itemNumberInOfferList(?string $itemNumber, array $offerItemNumbers): bool
    {
        $number = trim((string) ($itemNumber ?? ''));
        if ($number === '') {
            return false;
        }

        foreach ($offerItemNumbers as $offerNumber) {
            if (strcasecmp($number, trim((string) $offerNumber)) === 0) {
                return true;
            }
        }

        return false;
    }

    private function productLineDiscount(
        array $rules,
        ?int $itemId,
        ?string $itemNumber,
        bool $inOfferSelection,
        float $qty,
        float $lineTotal,
        int $companyId,
        float $selectionQtyTotal,
        array $selectionLines,
    ): float {
        $discount = 0.0;

        if (!empty($rules['set_percent_selected']['enabled']) && $inOfferSelection) {
            $pct = max(0, min(100, (float) ($rules['set_percent_selected']['percent_off'] ?? 0)));
            $discount = max($discount, round($lineTotal * ($pct / 100), 2));
        }

        if (!empty($rules['buy_x_percent_off_all']['enabled']) && $this->lineMatchesRule($rules['buy_x_percent_off_all'], $itemId, $itemNumber, $inOfferSelection, $qty, $companyId, false, $selectionQtyTotal, $selectionLines)) {
            $pct = max(0, min(100, (float) ($rules['buy_x_percent_off_all']['percent_off'] ?? 0)));
            if ($pct > 0) {
                $discount = max($discount, round($lineTotal * ($pct / 100), 2));
            }
        }

        if (!empty($rules['buy_x_fixed_off']['enabled']) && $this->lineMatchesRule($rules['buy_x_fixed_off'], $itemId, $itemNumber, $inOfferSelection, $qty, $companyId, true, $selectionQtyTotal, $selectionLines)) {
            $discount = max($discount, max(0, (float) ($rules['buy_x_fixed_off']['amount_off'] ?? 0)));
        }

        if (!empty($rules['buy_x_amount_off_each']['enabled']) && $this->lineMatchesRule($rules['buy_x_amount_off_each'], $itemId, $itemNumber, $inOfferSelection, $qty, $companyId, false, $selectionQtyTotal, $selectionLines)) {
            $each = max(0, (float) ($rules['buy_x_amount_off_each']['amount_off_each'] ?? 0));
            $discount = max($discount, round($each * $qty, 2));
        }

        return min($discount, $lineTotal);
    }

    /**
     * @param  array<string, mixed>  $rule
     */
    private function lineMatchesRule(
        array $rule,
        ?int $itemId,
        ?string $itemNumber,
        bool $inOfferSelection,
        float $qty,
        int $companyId,
        bool $exactQty = false,
        float $selectionQtyTotal = 0.0,
        array $selectionLines = [],
    ): bool {
        $requiredQty = max(0, (float) ($rule['buy_quantity'] ?? 0));
        $ruleProductId = isset($rule['product_id']) && $rule['product_id'] !== null
            ? (int) $rule['product_id']
            : null;

        $matchesProduct = $inOfferSelection && (
            $ruleProductId === null
            || $this->ruleProductMatches($ruleProductId, $itemId, $itemNumber, $companyId)
        );

        if (!$matchesProduct) {
            return false;
        }

        $qualifyingQty = $selectionQtyTotal;
        if ($ruleProductId !== null && $selectionLines !== []) {
            $qualifyingQty = 0.0;
            foreach ($selectionLines as $line) {
                if (empty($line['in_offer_selection'])) {
                    continue;
                }
                if ($this->ruleProductMatches(
                    $ruleProductId,
                    isset($line['item_id']) ? (int) $line['item_id'] : null,
                    isset($line['item_number']) ? (string) $line['item_number'] : null,
                    $companyId
                )) {
                    $qualifyingQty += (float) ($line['qty'] ?? 0);
                }
            }
        }

        if ($exactQty) {
            return abs($qualifyingQty - $requiredQty) < 0.001 || ($requiredQty <= 0 && $qualifyingQty > 0);
        }

        if ($requiredQty <= 0) {
            return $qualifyingQty > 0;
        }

        return $qualifyingQty >= $requiredQty;
    }

    private function ruleProductMatches(
        int $ruleProductId,
        ?int $lineItemId,
        ?string $lineItemNumber,
        int $companyId,
    ): bool {
        if ($lineItemId && $lineItemId === $ruleProductId) {
            return true;
        }

        $ruleItem = Item::where('company_id', $companyId)->where('id', $ruleProductId)->first();
        if (!$ruleItem) {
            return false;
        }

        $lineNumber = trim((string) ($lineItemNumber ?? ''));
        if ($lineNumber !== '' && $lineNumber === $ruleItem->item_number) {
            return true;
        }

        if ($lineItemId) {
            $lineItem = Item::where('company_id', $companyId)->where('id', $lineItemId)->first();
            if ($lineItem && $lineItem->item_number === $ruleItem->item_number) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param  array<string, mixed>  $rules
     */
    private function orderLevelDiscount(array $rules, float $subTotal, ?string $promoCode): float
    {
        $candidates = [];

        if (!empty($rules['order_min_total_percent']['enabled'])) {
            $min = (float) ($rules['order_min_total_percent']['min_order_amount'] ?? 0);
            if ($subTotal >= $min) {
                $pct = max(0, min(100, (float) ($rules['order_min_total_percent']['percent_off'] ?? 0)));
                $candidates[] = round($subTotal * ($pct / 100), 2);
            }
        }

        if (!empty($rules['order_promo_code_percent']['enabled'])) {
            $expected = $this->normalizePromoCode((string) ($rules['order_promo_code_percent']['promo_code'] ?? ''));
            if ($expected !== '' && $promoCode !== null && strcasecmp($promoCode, $expected) === 0) {
                $pct = max(0, min(100, (float) ($rules['order_promo_code_percent']['percent_off'] ?? 0)));
                $candidates[] = round($subTotal * ($pct / 100), 2);
            }
        }

        if ($candidates === []) {
            return 0.0;
        }

        return min($subTotal, max($candidates));
    }

    /**
     * @param  array<string, mixed>  $rules
     */
    private function assertOrderOfferRequirements(array $rules, ?string $promoCode): void
    {
        $minEnabled = !empty($rules['order_min_total_percent']['enabled']);
        $promoEnabled = !empty($rules['order_promo_code_percent']['enabled']);

        if (!$minEnabled && !$promoEnabled) {
            throw new Exception('This order offer has no active discount rules.');
        }

        if ($promoEnabled && !$minEnabled) {
            $expected = $this->normalizePromoCode((string) ($rules['order_promo_code_percent']['promo_code'] ?? ''));
            if ($expected === '') {
                throw new Exception('Promo code is not configured on this offer.');
            }
            if ($promoCode === null || strcasecmp($promoCode, $expected) !== 0) {
                throw new Exception('A valid promo code is required for this offer.');
            }
        }
    }

    private function normalizePromoCode(?string $code): ?string
    {
        $trimmed = trim((string) $code);

        return $trimmed === '' ? null : strtoupper($trimmed);
    }

    private function isOfferValidOnDate(Offer $offer, Carbon $date): bool
    {
        $checkDate = $date->copy()->startOfDay();

        if ($offer->expiration_enabled && $offer->expiration_date) {
            if ($checkDate->gt($offer->expiration_date->copy()->endOfDay())) {
                return false;
            }
        }

        if ($offer->days_of_week_enabled) {
            $allowed = $offer->days_of_week ?? [];
            if ($allowed !== []) {
                $dayName = $checkDate->format('l');
                if (!in_array($dayName, $allowed, true)) {
                    return false;
                }
            }
        }

        return true;
    }
}
