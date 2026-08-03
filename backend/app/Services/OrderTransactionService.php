<?php

namespace App\Services;

use App\Models\Item;
use App\Models\Offer;
use App\Models\Sale;
use App\Models\User;
use Carbon\Carbon;
use Exception;

class OrderTransactionService
{
    public const ORDER_STATUS_COMPLETED = 'completed';

    public const ORDER_STATUS_HOLD = 'hold';

    public const ORDER_STATUS_QUOTATION = 'quotation';

    public const TRANSACTION_TYPE_SALE = '1001';

    public const TRANSACTION_TYPE_RETURN = '1002';

    public const TRANSACTION_TYPE_QUOTATION = '1003';

    private const CARD_PAYMENT_KEYWORDS = ['card', 'debit', 'credit'];

    public static function isSalesReturn(?string $transactionType): bool
    {
        return trim((string) $transactionType) === self::TRANSACTION_TYPE_RETURN;
    }

    public function __construct(
        private OrderSettingService $orderSettingService,
        private OfferDiscountService $offerDiscountService,
    ) {
    }

    public function getSettings(User $user): array
    {
        return $this->orderSettingService->getForUser($user);
    }

    /**
     * Order settings for POS / sales screens (PIN is not exposed).
     */
    public function getPosSettings(User $user): array
    {
        $settings = $this->getSettings($user);
        unset($settings['hold_order_pin']);
        $settings['requires_hold_pin'] = true;

        return $settings;
    }

    public function verifyHoldPin(User $user, ?string $pin): void
    {
        $settings = $this->getSettings($user);
        $expected = (string) ($settings['hold_order_pin'] ?? '');
        if ($expected === '' || trim((string) $pin) !== $expected) {
            throw new Exception('Invalid hold order PIN.');
        }
    }

    /**
     * Apply order settings to sale payload and line items before save.
     *
     * @param  array<int, array<string, mixed>>  $lines
     * @return array{payload: array<string, mixed>, lines: array<int, array<string, mixed>>}
     */
    public function applySaleRules(User $user, array $payload, array $lines, bool $isCreate, ?Sale $existing = null): array
    {
        $settings = $this->getSettings($user);
        $orderStatus = strtolower(trim((string) ($payload['order_status'] ?? $existing?->order_status ?? self::ORDER_STATUS_COMPLETED)));
        if (!in_array($orderStatus, [self::ORDER_STATUS_COMPLETED, self::ORDER_STATUS_HOLD, self::ORDER_STATUS_QUOTATION], true)) {
            $orderStatus = self::ORDER_STATUS_COMPLETED;
        }

        $transactionType = trim((string) ($payload['transaction_type'] ?? $existing?->transaction_type ?? self::TRANSACTION_TYPE_SALE))
            ?: self::TRANSACTION_TYPE_SALE;

        if (self::isSalesReturn($transactionType)) {
            $this->assertRefundCardVerification($user, $payload['refund_card_last4'] ?? $existing?->refund_card_last4 ?? null);
        }

        $isQuotation = $orderStatus === self::ORDER_STATUS_QUOTATION
            || $transactionType === self::TRANSACTION_TYPE_QUOTATION;

        $saleDate = $payload['sale_date'] ?? $existing?->sale_date?->format('Y-m-d') ?? now()->toDateString();
        if (!$settings['allow_past_date_in_sales_order']) {
            $saleDay = Carbon::parse($saleDate)->startOfDay();
            if ($saleDay->lt(now()->startOfDay())) {
                throw new Exception('Past-date sales are disabled in order settings.');
            }
        }

        $discount = round((float) ($payload['discount'] ?? $existing?->discount ?? 0), 2);
        if ($discount > 0 && !$settings['allow_order_discount']) {
            throw new Exception('Order discount is disabled in order settings.');
        }

        $serviceCharge = round((float) ($payload['service_charge'] ?? $existing?->service_charge ?? 0), 2);
        if ($serviceCharge > 0 && !$settings['allow_service_charge']) {
            throw new Exception('Service charge is disabled in order settings.');
        }

        $pricingMode = strtolower(trim((string) ($payload['pricing_mode'] ?? $existing?->pricing_mode ?? 'retail')));
        if (!in_array($pricingMode, ['retail', 'wholesale'], true)) {
            $pricingMode = 'retail';
        }
        if ($pricingMode === 'wholesale' && !$settings['allow_switching_wholesale_retail_prices']) {
            throw new Exception('Wholesale pricing is disabled in order settings.');
        }

        if ($isCreate && empty(trim((string) ($payload['payment_method'] ?? '')))) {
            $payload['payment_method'] = $this->mapDefaultPaymentMethod($settings['default_payment_method']);
        }

        $companyId = (int) ($payload['company_id'] ?? $existing?->company_id ?? 0);
        $lines = $this->normalizeLinesWithSettings($companyId, $lines, $settings, $pricingMode);

        $offerId = isset($payload['offer_id']) && $payload['offer_id'] !== ''
            ? (int) $payload['offer_id']
            : ($existing?->offer_id ?? null);

        $offerRequested = $offerId || !empty($payload['offer_applied']);
        if ($offerRequested && !$settings['allow_offer']) {
            throw new Exception('Offers are disabled in order settings.');
        }

        $offerDiscount = 0.0;
        $offerDiscountType = null;
        $saleDate = $payload['sale_date'] ?? $existing?->sale_date?->format('Y-m-d') ?? now()->toDateString();
        $promoCode = $payload['offer_promo_code'] ?? $payload['promo_code'] ?? $existing?->offer_promo_code ?? null;
        $promoCode = is_string($promoCode) ? $promoCode : null;
        if ($offerId) {
            $offer = $this->offerDiscountService->resolveOfferForUser($user, $offerId);
            $offerDiscountType = $offer->discount_type;
            $offerPricingMode = strtolower(trim((string) ($offer->pricing_mode ?? 'both')));
            if (
                in_array($offerPricingMode, ['retail', 'wholesale'], true)
                && $offerPricingMode !== $pricingMode
            ) {
                throw new Exception(
                    'This offer is only valid for '.($offerPricingMode === 'wholesale' ? 'wholesale' : 'retail').' sales.'
                );
            }
            $appliedOffer = $this->offerDiscountService->applyToLines($offer, $lines, $saleDate, $promoCode);
            $lines = $appliedOffer['lines'];
            $offerDiscount = (float) $appliedOffer['offer_discount'];
            $payload['offer_id'] = $offerId;
            $payload['offer_applied'] = true;
            if (!empty($appliedOffer['offer_promo_code'])) {
                $payload['offer_promo_code'] = $appliedOffer['offer_promo_code'];
            }

            // Stacked offer support: when one offer type is selected, auto-apply the best
            // opposite type (product <-> order) if it gives additional savings.
            $stackType = $offer->discount_type === 'product' ? 'order' : 'product';
            $bestStacked = null;
            $bestStackedDiscount = 0.0;
            $bestStackedLines = null;

            $companyId = (int) $offer->company_id;
            $candidateOffers = Offer::where('company_id', $companyId)
                ->where('is_active', true)
                ->where('discount_type', $stackType)
                ->where('id', '!=', $offer->id)
                ->with(['items', 'itemBatches'])
                ->get();

            foreach ($candidateOffers as $candidate) {
                $candidatePricingMode = strtolower(trim((string) ($candidate->pricing_mode ?? 'both')));
                if (
                    in_array($candidatePricingMode, ['retail', 'wholesale'], true)
                    && $candidatePricingMode !== $pricingMode
                ) {
                    continue;
                }

                try {
                    $stacked = $this->offerDiscountService->applyToLines(
                        $candidate,
                        $lines,
                        $saleDate,
                        $promoCode
                    );
                    $discountAmount = (float) ($stacked['offer_discount'] ?? 0);
                    if ($discountAmount > $bestStackedDiscount) {
                        $bestStackedDiscount = $discountAmount;
                        $bestStacked = $candidate;
                        $bestStackedLines = $stacked['lines'] ?? null;
                    }
                } catch (\Throwable) {
                    // Ignore non-qualifying stack candidates and continue.
                }
            }

            if ($bestStacked && $bestStackedDiscount > 0) {
                $offerDiscount += $bestStackedDiscount;
                if ($bestStacked->discount_type === 'product' && is_array($bestStackedLines)) {
                    $lines = $bestStackedLines;
                }
            }
        }

        $manualDiscount = $discount;
        $subTotal = round(array_sum(array_column($lines, 'line_total')), 2);
        $discount = round($manualDiscount + $offerDiscount, 2);
        $netBeforeCard = $offerDiscountType === 'product'
            ? round($subTotal - $manualDiscount + $serviceCharge, 2)
            : round($subTotal - $discount + $serviceCharge, 2);

        $paymentMethod = trim((string) ($payload['payment_method'] ?? $existing?->payment_method ?? 'Cash'));

        if (
            strtolower($paymentMethod) === 'credit'
            && $orderStatus === self::ORDER_STATUS_COMPLETED
            && empty($payload['customer_id'])
            && !$existing?->customer_id
        ) {
            throw new Exception('Select a customer for credit sales so the balance can be tracked.');
        }

        $cardCharge = 0.0;
        if ($this->isCardPayment($paymentMethod)) {
            $percent = (float) $settings['credit_debit_card_payment_charges_percent'];
            $cardCharge = round($netBeforeCard * ($percent / 100), 2);
        }

        $payload['order_status'] = $orderStatus;
        $payload['transaction_type'] = $transactionType;
        $payload['pricing_mode'] = $pricingMode;
        $payload['service_charge'] = $serviceCharge;
        $payload['card_payment_charge'] = $cardCharge;
        $payload['sub_total'] = $subTotal;
        $payload['discount'] = $discount;
        $payload['net_amount'] = round($netBeforeCard + $cardCharge, 2);
        if (!$offerId) {
            $payload['offer_applied'] = (bool) ($payload['offer_applied'] ?? false);
            $payload['offer_id'] = null;
        }

        $allowNegative = $isQuotation
            ? (bool) $settings['allow_quotation_negative_inventory']
            : (bool) $settings['allow_sales_negative_inventory'];

        $payload['_allow_negative_inventory'] = $allowNegative;
        $payload['_skip_stock_and_payment'] = in_array($orderStatus, [self::ORDER_STATUS_HOLD, self::ORDER_STATUS_QUOTATION], true);

        return ['payload' => $payload, 'lines' => $lines];
    }

    public function assertHoldModificationAllowed(User $user, Sale $sale, string $action, ?string $pin): void
    {
        if ($sale->order_status !== self::ORDER_STATUS_HOLD) {
            return;
        }

        $settings = $this->getSettings($user);
        if ($action === 'delete' && !$settings['allow_deletion_of_hold_orders']) {
            throw new Exception('Deletion of hold orders is disabled in order settings.');
        }
        if ($action === 'update' && !$settings['allow_editing_of_hold_orders']) {
            throw new Exception('Editing of hold orders is disabled in order settings.');
        }

        $this->verifyHoldPin($user, $pin);
    }

    public function assertRefundCardVerification(User $user, ?string $last4): void
    {
        // Refund card verification is optional — returns may be processed without card last 4.
    }

    /**
     * Parse POS search short-key input (e.g. "ITEM001*2" for item_code_qty style).
     *
     * @return array{term: string, qty: ?float}
     */
    public function parseSearchShortKey(string $input, string $style): array
    {
        $input = trim($input);
        if ($input === '') {
            return ['term' => '', 'qty' => null];
        }

        $separators = ['*', 'x', 'X', ' '];
        foreach ($separators as $sep) {
            if (str_contains($input, $sep)) {
                $parts = explode($sep, $input, 2);
                $term = trim($parts[0]);
                $qty = isset($parts[1]) && is_numeric(trim($parts[1])) ? (float) trim($parts[1]) : null;

                return ['term' => $term, 'qty' => $qty];
            }
        }

        return ['term' => $input, 'qty' => null];
    }

    /**
     * @param  array<int, array<string, mixed>>  $lines
     * @return array<int, array<string, mixed>>
     */
    private function normalizeLinesWithSettings(
        int $companyId,
        array $lines,
        array $settings,
        string $pricingMode,
    ): array {
        $normalized = [];

        foreach ($lines as $row) {
            if (!is_array($row)) {
                continue;
            }
            $description = trim((string) ($row['description'] ?? ''));
            if ($description === '') {
                continue;
            }

            $itemId = isset($row['item_id']) && $row['item_id'] !== '' ? (int) $row['item_id'] : null;
            $item = $itemId && $companyId > 0
                ? Item::where('company_id', $companyId)->where('id', $itemId)->first()
                : null;

            if ($item && !$settings['allow_ingredients_items_in_sales'] && $this->isIngredientItem($item)) {
                throw new Exception("Ingredient item {$item->item_number} cannot be sold (order settings).");
            }

            $qty = max(0.01, (float) ($row['qty'] ?? 1));
            $unitPrice = max(0, (float) ($row['unit_price'] ?? 0));

            if ($item && !$settings['allow_edit_selling_price']) {
                $expected = $pricingMode === 'wholesale'
                    ? (float) ($item->wholesale_price ?? $item->selling_price ?? 0)
                    : (float) ($item->selling_price ?? 0);
                if (abs($unitPrice - $expected) > 0.02) {
                    throw new Exception("Selling price cannot be edited for {$item->item_number}.");
                }
                $unitPrice = $expected;
            }

            $line = [
                'item_id' => $itemId,
                'item_number' => trim((string) ($row['item_number'] ?? $item?->item_number ?? '')) ?: null,
                'description' => $description,
                'qty' => $qty,
                'unit_price' => $unitPrice,
                'line_total' => round($qty * $unitPrice, 2),
                'purchase_price' => $settings['allow_purchase_price_show_in_order_screen']
                    ? ($item ? (float) ($item->purchase_price ?? 0) : null)
                    : null,
            ];

            if ($settings['allow_imei_serial_number']) {
                $line['imei_serial'] = trim((string) ($row['imei_serial'] ?? '')) ?: null;
            }
            if ($settings['allow_batch_id_popup']) {
                $line['batch_id'] = trim((string) ($row['batch_id'] ?? '')) ?: null;
            }
            if (isset($row['item_batch_id']) && $row['item_batch_id'] !== '' && $row['item_batch_id'] !== null) {
                $line['item_batch_id'] = (int) $row['item_batch_id'];
            }
            if ($settings['allow_multiple_uom_for_sales_order']) {
                $line['secondary_uom'] = trim((string) ($row['secondary_uom'] ?? '')) ?: null;
                $line['secondary_uom_qty'] = isset($row['secondary_uom_qty'])
                    ? round((float) $row['secondary_uom_qty'], 2)
                    : null;
            }
            if ($settings['allow_additional_item_details_on_sales']) {
                $line['additional_details'] = trim((string) ($row['additional_details'] ?? '')) ?: null;
            }

            $inventoryLocation = trim((string) ($row['inventory_location'] ?? ''));
            if ($inventoryLocation === '' && $item) {
                $inventoryLocation = trim((string) ($item->location ?? ''));
            }
            if ($inventoryLocation !== '') {
                $line['inventory_location'] = $inventoryLocation;
            }

            $normalized[] = $line;
        }

        return $normalized;
    }

    private function isIngredientItem(Item $item): bool
    {
        $type = strtolower(trim((string) ($item->product_type ?? '')));

        return str_contains($type, 'ingredient') || str_contains($type, 'manufacturing');
    }

    private function isCardPayment(string $method): bool
    {
        $lower = strtolower(trim($method));

        // Plain "Credit" is a debt sale (pay later), not a card payment.
        if ($lower === 'credit') {
            return false;
        }

        foreach (self::CARD_PAYMENT_KEYWORDS as $keyword) {
            if (str_contains($lower, $keyword)) {
                return true;
            }
        }

        return false;
    }

    private function mapDefaultPaymentMethod(string $method): string
    {
        return match (strtolower($method)) {
            'card' => 'Card',
            'bank_transfer' => 'Bank Transfer',
            'cheque' => 'Cheque',
            'credit' => 'Credit',
            default => 'Cash',
        };
    }

    /**
     * Strip shipping custom fields when setting is off.
     */
    public function filterShipmentData(User $user, array $data): array
    {
        $settings = $this->getSettings($user);
        if ($settings['allow_custom_fields_in_shipping_screen']) {
            return $data;
        }

        unset(
            $data['freight_cost'],
            $data['invoice_cost'],
            $data['bsl_number'],
            $data['us_lot_number'],
        );

        return $data;
    }
}
