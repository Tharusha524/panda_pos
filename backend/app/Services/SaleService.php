<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Item;
use App\Models\Offer;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalePaymentSplit;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\DB;

class SaleService
{
    private const DEFAULT_TRANSACTION_TYPES = ['1001', '1002', '1003', '1004'];

    private const DEFAULT_SALES_TYPES = ['Retail', 'Wholesale', 'Credit Sale', 'Cash Sale'];

    public function __construct(
        private CompanySettingService $companySettingService,
        private PaymentService $paymentService,
        private LocationService $locationService,
        private OrderTransactionService $orderTransactionService,
        private HardwareSettingService $hardwareSettingService,
        private SaleReceiptService $saleReceiptService,
        private OfferDiscountService $offerDiscountService,
        private TaxSettingService $taxSettingService,
        private CustomerBalanceService $customerBalanceService,
    ) {
    }

    public function getPosContextForUser(User $user): array
    {
        $company = $this->companySettingService->getCompanyForUser($user);

        return [
            'order_settings' => $this->orderTransactionService->getPosSettings($user),
            'hardware_settings' => $this->hardwareSettingService->getForUser($user),
            'print_context' => $this->saleReceiptService->getPrintContextForUser($user),
            'next_sales_id' => $this->getNextSalesIdForUser($user),
            'filters' => $this->getFilterOptions($company->id),
            'applicable_offers' => $this->offerDiscountService->getApplicableOffersForUser($user),
            'tax_settings' => $this->taxSettingService->getPosTaxContextForUser($user),
        ];
    }

    public function getReceiptForUser(User $user, int $saleId, ?string $language = null): array
    {
        return $this->saleReceiptService->getReceiptForUser($user, $saleId, $language);
    }

    public function buildReceiptFromSale(User $user, array $sale, ?string $language = null): array
    {
        return $this->saleReceiptService->buildReceiptFromSale($user, $sale, $language);
    }

    public function getHoldOrdersForUser(User $user, ?string $location = null): array
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $query = Sale::where('company_id', $company->id)
            ->where('order_status', OrderTransactionService::ORDER_STATUS_HOLD);

        if ($location && $location !== 'all') {
            $query->where('location', $location);
        }

        $sales = $query
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (Sale $s) => $this->formatSale($s->load('items')));

        return [
            'hold_orders' => $sales,
            'order_settings' => $this->orderTransactionService->getPosSettings($user),
        ];
    }

    public function completeHoldForUser(User $user, int $id, array $data = []): array
    {
        $sale = $this->findForUser($user, $id);
        if ($sale->order_status !== OrderTransactionService::ORDER_STATUS_HOLD) {
            throw new Exception('This sale is not on hold.');
        }

        $data['order_status'] = OrderTransactionService::ORDER_STATUS_COMPLETED;
        if (!isset($data['items'])) {
            $sale->load('items');
            $data['items'] = $sale->items->map(fn (SaleItem $line) => [
                'item_id' => $line->item_id,
                'item_number' => $line->item_number,
                'description' => $line->description,
                'qty' => (float) $line->qty,
                'unit_price' => (float) $line->unit_price,
                'imei_serial' => $line->imei_serial,
                'batch_id' => $line->batch_id,
                'item_batch_id' => $line->item_batch_id,
                'secondary_uom' => $line->secondary_uom,
                'secondary_uom_qty' => $line->secondary_uom_qty !== null ? (float) $line->secondary_uom_qty : null,
                'additional_details' => $line->additional_details,
            ])->all();
        }

        return $this->updateForUser($user, $id, $data);
    }

    public function getAllForUser(
        User $user,
        ?string $transactionType = null,
        ?string $location = null,
        ?string $dateFrom = null,
        ?string $dateTo = null,
        ?string $orderStatus = null,
        ?int $customerId = null,
    ): array {
        $company = $this->companySettingService->getCompanyForUser($user);
        $companyId = $company->id;

        $this->backfillReturnedFromSaleLinks($companyId);

        $query = Sale::where('company_id', $companyId);

        if ($transactionType && $transactionType !== 'all') {
            $query->where('transaction_type', $transactionType);
        }

        if ($location && $location !== 'all') {
            $query->where('location', $location);
        }

        if ($orderStatus && $orderStatus !== 'all') {
            $query->where('order_status', $orderStatus);
        }

        if ($customerId) {
            $query->where('customer_id', $customerId);
        }

        if ($dateFrom) {
            $query->whereDate('sale_date', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate('sale_date', '<=', $dateTo);
        }

        $sales = $query
            ->with(['items', 'offer'])
            ->orderByDesc('sale_date')
            ->orderByDesc('id')
            ->limit($customerId ? 100 : 5000)
            ->get();

        $fullyReturnedSourceIds = $this->getFullyReturnedSourceSaleIdMap($companyId);

        $sales = $sales
            ->map(function (Sale $s) use ($companyId, $fullyReturnedSourceIds) {
                $formatted = $this->formatSale($s);

                return $this->attachSaleReturnStatus($formatted, $companyId, $fullyReturnedSourceIds);
            });

        $summaryQuery = Sale::where('company_id', $companyId);
        if ($transactionType && $transactionType !== 'all') {
            $summaryQuery->where('transaction_type', $transactionType);
        }
        if ($location && $location !== 'all') {
            $summaryQuery->where('location', $location);
        }
        if ($orderStatus && $orderStatus !== 'all') {
            $summaryQuery->where('order_status', $orderStatus);
        }
        if ($customerId) {
            $summaryQuery->where('customer_id', $customerId);
        }
        if ($dateFrom) {
            $summaryQuery->whereDate('sale_date', '>=', $dateFrom);
        }
        if ($dateTo) {
            $summaryQuery->whereDate('sale_date', '<=', $dateTo);
        }

        $completedAmountQuery = (clone $summaryQuery)
            ->where('order_status', OrderTransactionService::ORDER_STATUS_COMPLETED);
        $holdCountQuery = (clone $summaryQuery)
            ->where('order_status', OrderTransactionService::ORDER_STATUS_HOLD);

        $salesAmountQuery = (clone $completedAmountQuery)
            ->where('transaction_type', OrderTransactionService::TRANSACTION_TYPE_SALE);
        $returnsAmountQuery = (clone $completedAmountQuery)
            ->where('transaction_type', OrderTransactionService::TRANSACTION_TYPE_RETURN);

        $totalSalesAmount = round((float) $salesAmountQuery->sum('net_amount'), 2);
        $totalReturnsAmount = round((float) $returnsAmountQuery->sum('net_amount'), 2);

        return [
            'sales' => $sales,
            'returned_sale_ids' => array_map('intval', array_keys($fullyReturnedSourceIds)),
            'summary' => [
                'total_orders' => $sales->count(),
                'total_sales_amount' => $transactionType && $transactionType !== 'all'
                    ? round((float) $completedAmountQuery->sum('net_amount'), 2)
                    : $totalSalesAmount,
                'total_returns_amount' => $transactionType && $transactionType !== 'all'
                    ? (OrderTransactionService::isSalesReturn($transactionType) ? round((float) $completedAmountQuery->sum('net_amount'), 2) : 0.0)
                    : $totalReturnsAmount,
                'net_sales_amount' => $transactionType && $transactionType !== 'all'
                    ? round((float) $completedAmountQuery->sum('net_amount'), 2)
                    : round($totalSalesAmount - $totalReturnsAmount, 2),
                'hold_orders_count' => $holdCountQuery->count(),
            ],
            'filters' => $this->getFilterOptions($companyId),
            'order_settings' => $this->orderTransactionService->getPosSettings($user),
        ];
    }

    public function getForUser(User $user, int $id): array
    {
        $sale = $this->findForUser($user, $id);
        $sale->load('items');

        $formatted = $this->formatSale($sale);
        $fullyReturnedMap = $this->getFullyReturnedSourceSaleIdMap((int) $sale->company_id);
        $formatted = $this->attachSaleReturnStatus($formatted, (int) $sale->company_id, $fullyReturnedMap);
        $formatted['order_settings'] = $this->orderTransactionService->getPosSettings($user);

        if (!OrderTransactionService::isSalesReturn($sale->transaction_type)) {
            $formatted['remaining_return_items'] = $this->buildRemainingReturnItems($sale);
        }

        return $formatted;
    }

    public function createForUser(User $user, array $data): array
    {
        $company = $this->companySettingService->getCompanyForUser($user);

        return DB::transaction(function () use ($user, $company, $data) {
            $data['location'] = $this->locationService->assertValidForUser($user, $data['location'] ?? null);
            $payload = $this->buildAttributes($company->id, $data);
            $payload['company_id'] = $company->id;

            $rawLines = $this->parseRawLineItems($company->id, $data['items'] ?? []);
            if ($rawLines === []) {
                throw new Exception('Add at least one product to the sale.');
            }

            $applied = $this->orderTransactionService->applySaleRules($user, $payload, $rawLines, true);
            $lines = $applied['lines'];
            $allowNegative = (bool) ($applied['payload']['_allow_negative_inventory'] ?? false);
            $skipStockPayment = (bool) ($applied['payload']['_skip_stock_and_payment'] ?? false);
            $payload = $this->stripInternalSaleKeys($applied['payload']);
            $payload['company_id'] = $company->id;

            if (OrderTransactionService::isSalesReturn((string) ($payload['transaction_type'] ?? ''))) {
                $sourceId = (int) ($data['returned_from_sale_id'] ?? $payload['returned_from_sale_id'] ?? 0);
                if ($sourceId <= 0) {
                    $resolved = $this->resolveReturnedFromSaleIdFromNotes(
                        $company->id,
                        (string) ($payload['notes'] ?? $data['notes'] ?? '')
                    );
                    $sourceId = $resolved ?? 0;
                }
                if ($sourceId > 0) {
                    $payload['returned_from_sale_id'] = $sourceId;
                    $this->assertReturnWithinRemainingQty($company->id, $sourceId, $lines);
                }
            }

            if (OrderTransactionService::isExchange((string) ($payload['transaction_type'] ?? ''))) {
                $returnLines = array_values(array_filter($lines, fn ($l) => ($l['line_direction'] ?? 'sale') === 'return'));
                if ($returnLines !== []) {
                    // No original bill is required for an exchange — the cashier just
                    // picks the returned items directly (same trust-based trade-off
                    // "Return without bill" already has). If a source bill IS linked
                    // (e.g. a future client that still wants to pick one), the usual
                    // remaining-qty and credit-refund checks still apply to it.
                    $sourceId = (int) ($data['returned_from_sale_id'] ?? $payload['returned_from_sale_id'] ?? 0);
                    if ($sourceId > 0) {
                        $payload['returned_from_sale_id'] = $sourceId;
                        $this->assertReturnWithinRemainingQty($company->id, $sourceId, $returnLines);
                        $this->assertNoCashRefundForCreditSource(
                            $company->id,
                            $sourceId,
                            (float) ($payload['net_amount'] ?? 0),
                            (string) ($payload['payment_method'] ?? '')
                        );
                    }
                }
            }

            $salesId = $payload['sales_id'];
            if (Sale::where('company_id', $company->id)->where('sales_id', $salesId)->exists()) {
                throw new Exception('Sales ID already exists.');
            }

            $paymentSplits = $this->resolvePaymentSplits($data, (float) ($payload['net_amount'] ?? 0));
            if ($paymentSplits !== []) {
                $payload['payment_method'] = 'Split';
            }

            $sale = Sale::create($payload);
            $this->syncLineItems($sale, $lines);
            if ($paymentSplits !== []) {
                $this->syncPaymentSplits($sale, $paymentSplits);
            }

            if (
                (
                    OrderTransactionService::isSalesReturn((string) ($payload['transaction_type'] ?? ''))
                    || OrderTransactionService::isExchange((string) ($payload['transaction_type'] ?? ''))
                )
                && !empty($payload['returned_from_sale_id'])
                && (int) $sale->returned_from_sale_id !== (int) $payload['returned_from_sale_id']
            ) {
                $sale->forceFill(['returned_from_sale_id' => (int) $payload['returned_from_sale_id']])->save();
            }

            if (!$skipStockPayment) {
                $this->applyStockMovementForCompletedSale(
                    $company->id,
                    $lines,
                    $payload['location'],
                    (string) $payload['transaction_type'],
                    $allowNegative,
                );
                $freshSale = $sale->fresh()->load('paymentSplits');
                $this->paymentService->syncFromSale($freshSale);
                $this->customerBalanceService->applySaleEffect($freshSale);
            }

            return $this->formatSale($sale->fresh()->load(['items', 'paymentSplits']));
        });
    }

    public function updateForUser(User $user, int $id, array $data): array
    {
        $sale = $this->findForUser($user, $id);
        $sale->load('items');

        return DB::transaction(function () use ($user, $sale, $data) {
            if ($sale->order_status === OrderTransactionService::ORDER_STATUS_HOLD) {
                $this->orderTransactionService->assertHoldModificationAllowed(
                    $user,
                    $sale,
                    'update',
                    $data['hold_pin'] ?? null,
                );
            }

            $previousLocation = $sale->location;
            $previousLines = $this->inventoryLinesFromSale($sale);
            $hadStockMovement = $sale->order_status === OrderTransactionService::ORDER_STATUS_COMPLETED;
            $previousTransactionType = (string) $sale->transaction_type;
            $beforeBalanceSnapshot = $sale->replicate();
            // replicate() has no id, so its own paymentSplits() query would
            // always come back empty — attach the pre-update rows manually so
            // reverting this sale's old balance effect (below) sees them.
            if (strtolower(trim((string) $sale->payment_method)) === 'split') {
                $beforeBalanceSnapshot->setRelation('paymentSplits', $sale->paymentSplits()->get());
            }

            if (array_key_exists('location', $data)) {
                $data['location'] = $this->locationService->assertValidForUser($user, $data['location']);
            }
            $payload = $this->buildAttributes($sale->company_id, $data, $sale);
            $payload['company_id'] = $sale->company_id;

            $rawLines = null;
            if (array_key_exists('items', $data)) {
                $rawLines = $this->parseRawLineItems($sale->company_id, $data['items'] ?? []);
                if ($rawLines === []) {
                    throw new Exception('Add at least one product to the sale.');
                }
            }

            $lines = null;
            $allowNegative = false;
            $skipStockPayment = $sale->order_status !== OrderTransactionService::ORDER_STATUS_COMPLETED;

            if ($rawLines !== null) {
                $applied = $this->orderTransactionService->applySaleRules($user, $payload, $rawLines, false, $sale);
                $payload = $this->stripInternalSaleKeys($applied['payload']);
                $lines = $applied['lines'];
                $allowNegative = (bool) ($applied['payload']['_allow_negative_inventory'] ?? false);
                $skipStockPayment = (bool) ($applied['payload']['_skip_stock_and_payment'] ?? false);
            } elseif ($this->hasPricingOrChargeChanges($data)) {
                $sale->load('items');
                $existingLines = $this->parseRawLineItems($sale->company_id, $sale->items->map(fn (SaleItem $line) => [
                    'item_id' => $line->item_id,
                    'item_number' => $line->item_number,
                    'description' => $line->description,
                    'qty' => (float) $line->qty,
                    'unit_price' => (float) $line->unit_price,
                    'line_direction' => $line->line_direction ?? 'sale',
                ])->all());
                $applied = $this->orderTransactionService->applySaleRules($user, $payload, $existingLines, false, $sale);
                $payload = $this->stripInternalSaleKeys($applied['payload']);
                $skipStockPayment = (bool) ($applied['payload']['_skip_stock_and_payment'] ?? false);
            }

            if (isset($payload['sales_id'])) {
                $exists = Sale::where('company_id', $sale->company_id)
                    ->where('sales_id', $payload['sales_id'])
                    ->where('id', '!=', $sale->id)
                    ->exists();
                if ($exists) {
                    throw new Exception('Sales ID already exists.');
                }
            }

            $completingHold = ($sale->order_status === OrderTransactionService::ORDER_STATUS_HOLD)
                && (($payload['order_status'] ?? '') === OrderTransactionService::ORDER_STATUS_COMPLETED);

            // null = payment_splits wasn't part of this update at all, leave
            // whatever splits already exist untouched; [] means it was
            // explicitly cleared back to a single-method sale.
            $paymentSplits = array_key_exists('payment_splits', $data)
                ? $this->resolvePaymentSplits($data, (float) ($payload['net_amount'] ?? $sale->net_amount))
                : null;
            if ($paymentSplits !== null && $paymentSplits !== []) {
                $payload['payment_method'] = 'Split';
            }

            $sale->update($payload);
            $sale->refresh();
            if ($paymentSplits !== null) {
                $this->syncPaymentSplits($sale, $paymentSplits);
            }

            $newLocation = $sale->location;
            $willDeductStock = !$skipStockPayment && (
                $completingHold
                || $sale->order_status === OrderTransactionService::ORDER_STATUS_COMPLETED
            );

            $newTransactionType = (string) ($payload['transaction_type'] ?? $sale->transaction_type);

            if ($lines !== null) {
                if ($hadStockMovement) {
                    $this->revertStockMovementForCompletedSale(
                        $sale->company_id,
                        $previousLines,
                        $previousLocation,
                        $previousTransactionType,
                    );
                }
                $sale->items()->delete();
                $this->syncLineItems($sale, $lines);
                if ($willDeductStock) {
                    $this->applyStockMovementForCompletedSale(
                        $sale->company_id,
                        $lines,
                        $newLocation,
                        $newTransactionType,
                        $allowNegative,
                    );
                }
            } elseif (isset($payload['location']) && $payload['location'] !== $previousLocation && $hadStockMovement && $willDeductStock) {
                $this->revertStockMovementForCompletedSale(
                    $sale->company_id,
                    $previousLines,
                    $previousLocation,
                    $previousTransactionType,
                );
                $this->applyStockMovementForCompletedSale(
                    $sale->company_id,
                    $previousLines,
                    $newLocation,
                    $newTransactionType,
                    $allowNegative,
                );
            }

            if ($willDeductStock) {
                $freshSale = $sale->fresh()->load('paymentSplits');
                $this->paymentService->syncFromSale($freshSale);
                $this->customerBalanceService->syncSaleChange($freshSale, $beforeBalanceSnapshot);
            } elseif ($sale->order_status !== OrderTransactionService::ORDER_STATUS_COMPLETED) {
                $this->paymentService->deleteBySource($sale->company_id, PaymentService::SOURCE_SALE, $sale->id);
                $this->customerBalanceService->revertSaleEffect($beforeBalanceSnapshot);
            }

            return $this->formatSale($sale->fresh()->load(['items', 'paymentSplits']));
        });
    }

    public function deleteForUser(User $user, int $id, ?string $holdPin = null): void
    {
        $sale = $this->findForUser($user, $id);
        $sale->load('items');

        if ($sale->order_status === OrderTransactionService::ORDER_STATUS_HOLD) {
            $this->orderTransactionService->assertHoldModificationAllowed($user, $sale, 'delete', $holdPin);
        }

        $companyId = $sale->company_id;
        $saleId = $sale->id;

        DB::transaction(function () use ($sale, $companyId, $saleId) {
            if ($sale->order_status === OrderTransactionService::ORDER_STATUS_COMPLETED) {
                $this->revertStockMovementForCompletedSale(
                    $companyId,
                    $this->inventoryLinesFromSale($sale),
                    $sale->location,
                    (string) $sale->transaction_type,
                );
                $this->customerBalanceService->revertSaleEffect($sale);
            }
            $sale->delete();
            $this->paymentService->deleteBySource($companyId, PaymentService::SOURCE_SALE, $saleId);
        });
    }

    public function verifyRefundCardForUser(User $user, ?string $last4): void
    {
        $this->orderTransactionService->assertRefundCardVerification($user, $last4);
    }

    public function getNextSalesIdForUser(User $user): string
    {
        $company = $this->companySettingService->getCompanyForUser($user);

        $max = Sale::where('company_id', $company->id)
            ->where('sales_id', 'like', 'SAL-%')
            ->get()
            ->map(function (Sale $s) {
                if (preg_match('/SAL-(\d+)/', $s->sales_id, $m)) {
                    return (int) $m[1];
                }

                return 0;
            })
            ->max();

        $next = ((int) $max) + 1;

        return 'SAL-'.str_pad((string) max(1, $next), 4, '0', STR_PAD_LEFT);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function parseRawLineItems(int $companyId, mixed $items): array
    {
        if (!is_array($items)) {
            return [];
        }

        $lines = [];
        foreach ($items as $row) {
            if (!is_array($row)) {
                continue;
            }
            $description = trim((string) ($row['description'] ?? ''));
            $itemId = isset($row['item_id']) && $row['item_id'] !== '' ? (int) $row['item_id'] : null;
            $itemNumber = trim((string) ($row['item_number'] ?? ''));

            if ($itemId) {
                $item = Item::where('company_id', $companyId)->where('id', $itemId)->first();
                if ($item) {
                    $itemNumber = $item->item_number;
                    if ($description === '' || $description === $itemNumber) {
                        $description = $item->description;
                    }
                }
            }

            if ($description === '') {
                continue;
            }

            $lines[] = array_merge($row, [
                'item_id' => $itemId,
                'item_number' => $itemNumber ?: null,
                'description' => $description,
                'qty' => max(0.01, (float) ($row['qty'] ?? 1)),
                'unit_price' => max(0, (float) ($row['unit_price'] ?? 0)),
            ]);
        }

        return $lines;
    }

    private function syncLineItems(Sale $sale, array $lines): void
    {
        foreach ($lines as $line) {
            SaleItem::create([
                'sale_id' => $sale->id,
                'item_id' => $line['item_id'],
                'item_number' => $line['item_number'],
                'description' => $line['description'],
                'qty' => $line['qty'],
                'unit_price' => $line['unit_price'],
                'line_total' => $line['line_total'],
                'line_direction' => $line['line_direction'] ?? 'sale',
                'imei_serial' => $line['imei_serial'] ?? null,
                'batch_id' => $line['batch_id'] ?? null,
                'item_batch_id' => $line['item_batch_id'] ?? null,
                'secondary_uom' => $line['secondary_uom'] ?? null,
                'secondary_uom_qty' => $line['secondary_uom_qty'] ?? null,
                'additional_details' => $line['additional_details'] ?? null,
                'purchase_price' => $line['purchase_price'] ?? null,
            ]);
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function stripInternalSaleKeys(array $payload): array
    {
        unset($payload['_allow_negative_inventory'], $payload['_skip_stock_and_payment']);

        return $payload;
    }

    private function hasPricingOrChargeChanges(array $data): bool
    {
        return array_key_exists('discount', $data)
            || array_key_exists('service_charge', $data)
            || array_key_exists('payment_method', $data)
            || array_key_exists('pricing_mode', $data)
            || array_key_exists('order_status', $data);
    }

    /**
     * Validates and normalizes a split-payment request — e.g. part cash,
     * part cheque, part credit for one sale. Returns [] when payment_splits
     * wasn't a meaningful (non-empty) array, meaning this is an ordinary
     * single-method sale.
     *
     * @param  array<string, mixed>  $data
     * @return array<int, array{payment_method: string, amount: float, cheque_number: ?string, bank_name: ?string}>
     */
    private function resolvePaymentSplits(array $data, float $netAmount): array
    {
        $raw = $data['payment_splits'] ?? null;
        if (!is_array($raw) || $raw === []) {
            return [];
        }

        $splits = [];
        $total = 0.0;
        foreach ($raw as $row) {
            if (!is_array($row)) {
                continue;
            }
            $method = trim((string) ($row['payment_method'] ?? ''));
            $amount = round((float) ($row['amount'] ?? 0), 2);
            if ($method === '' || $amount <= 0) {
                continue;
            }
            if (strtolower($method) === 'split') {
                throw new Exception('"Split" can\'t be used as one of the split payment methods.');
            }
            $splits[] = [
                'payment_method' => $method,
                'amount' => $amount,
                'cheque_number' => isset($row['cheque_number']) ? (trim((string) $row['cheque_number']) ?: null) : null,
                'bank_name' => isset($row['bank_name']) ? (trim((string) $row['bank_name']) ?: null) : null,
            ];
            $total += $amount;
        }

        if ($splits === []) {
            return [];
        }
        if (count($splits) < 2) {
            throw new Exception('Add at least two payment methods to split this sale\'s payment, or remove the split entirely.');
        }
        $total = round($total, 2);
        if (abs($total - round($netAmount, 2)) > 0.01) {
            throw new Exception(
                'Split payment amounts (Rs '.number_format($total, 2).
                ') must add up to the sale total (Rs '.number_format($netAmount, 2).').'
            );
        }

        return $splits;
    }

    /**
     * @param  array<int, array{payment_method: string, amount: float, cheque_number: ?string, bank_name: ?string}>  $splits
     */
    private function syncPaymentSplits(Sale $sale, array $splits): void
    {
        $sale->paymentSplits()->delete();
        foreach ($splits as $split) {
            $sale->paymentSplits()->create($split);
        }
    }

    /**
     * @return array<int, array{item_id: ?int, qty: float}>
     */
    private function inventoryLinesFromSale(Sale $sale): array
    {
        $items = $sale->relationLoaded('items') ? $sale->items : $sale->items()->get();

        return $items->map(fn (SaleItem $line) => [
            'item_id' => $line->item_id,
            'qty' => (float) $line->qty,
            'item_batch_id' => $line->item_batch_id,
            'line_direction' => $line->line_direction ?? 'sale',
        ])->values()->all();
    }

    private function buildAttributes(int $companyId, array $data, ?Sale $existing = null): array
    {
        $customerName = trim((string) ($data['customer_name'] ?? ''));
        $customerId = $data['customer_id'] ?? null;

        if ($customerId) {
            $customer = Customer::where('company_id', $companyId)->where('id', $customerId)->first();
            if ($customer) {
                $customerName = $customer->customer_name
                    ?: $customer->business_name
                    ?: $customer->first_name
                    ?: $customerName;
            }
        }

        $subTotal = round((float) ($data['sub_total'] ?? 0), 2);
        $discount = round((float) ($data['discount'] ?? 0), 2);
        $vatAmount = round((float) ($data['vat_amount'] ?? $existing?->vat_amount ?? 0), 2);
        $netAmount = round(
            (float) ($data['net_amount'] ?? ($subTotal - $discount + $vatAmount)),
            2
        );

        $salesId = trim((string) ($data['sales_id'] ?? ''));
        if ($salesId === '' && !$existing) {
            throw new Exception('Sales ID is required');
        }

        $orderStatus = strtolower(trim((string) ($data['order_status'] ?? $existing?->order_status ?? OrderTransactionService::ORDER_STATUS_COMPLETED)));
        if (!in_array($orderStatus, [
            OrderTransactionService::ORDER_STATUS_COMPLETED,
            OrderTransactionService::ORDER_STATUS_HOLD,
            OrderTransactionService::ORDER_STATUS_QUOTATION,
        ], true)) {
            $orderStatus = OrderTransactionService::ORDER_STATUS_COMPLETED;
        }

        $pricingMode = strtolower(trim((string) ($data['pricing_mode'] ?? $existing?->pricing_mode ?? 'retail')));
        if (!in_array($pricingMode, ['retail', 'wholesale'], true)) {
            $pricingMode = 'retail';
        }

        $transactionType = trim((string) ($data['transaction_type'] ?? $existing?->transaction_type ?? '1001')) ?: '1001';
        $returnedFromSaleId = isset($data['returned_from_sale_id']) && $data['returned_from_sale_id'] !== ''
            ? (int) $data['returned_from_sale_id']
            : ($existing?->returned_from_sale_id ?? null);

        if (
            (OrderTransactionService::isSalesReturn($transactionType) || OrderTransactionService::isExchange($transactionType))
            && !$returnedFromSaleId
        ) {
            $returnedFromSaleId = $this->resolveReturnedFromSaleIdFromNotes(
                $companyId,
                (string) ($data['notes'] ?? $existing?->notes ?? '')
            );
        }

        // The sale checkout screen lets the cashier type any bank name
        // freely — bank_id only fits a real registered bank (numeric FK),
        // so a non-numeric bank_id is free text and belongs in bank_name
        // instead (mobile also sends bank_name directly going forward).
        // Falls back to $existing when the field isn't part of this update,
        // same as the other optional fields below.
        $rawBankId = array_key_exists('bank_id', $data) ? $data['bank_id'] : $existing?->bank_id;
        $bankId = is_numeric($rawBankId) ? (int) $rawBankId : null;
        $bankName = array_key_exists('bank_name', $data)
            ? trim((string) ($data['bank_name'] ?? ''))
            : trim((string) ($existing?->bank_name ?? ''));
        if ($bankName === '' && $rawBankId !== null && $rawBankId !== '' && !is_numeric($rawBankId)) {
            $bankName = trim((string) $rawBankId);
        }

        $payload = [
            'transaction_type' => $transactionType,
            'order_status' => $orderStatus,
            'sales_type' => trim((string) ($data['sales_type'] ?? 'Retail')) ?: 'Retail',
            'pricing_mode' => $pricingMode,
            'location' => trim((string) ($data['location'] ?? 'Main Location')) ?: 'Main Location',
            'sale_date' => $data['sale_date'] ?? now()->toDateString(),
            'customer_id' => $customerId ?: null,
            'customer_name' => $customerName ?: null,
            'returned_from_sale_id' => (OrderTransactionService::isSalesReturn($transactionType) || OrderTransactionService::isExchange($transactionType))
                ? $returnedFromSaleId
                : null,
            'sub_total' => $subTotal,
            'discount' => $discount,
            'vat_amount' => $vatAmount,
            'vat_rate_id' => isset($data['vat_rate_id']) && $data['vat_rate_id'] !== ''
                ? (int) $data['vat_rate_id']
                : ($existing?->vat_rate_id ?? null),
            'service_charge' => round((float) ($data['service_charge'] ?? $existing?->service_charge ?? 0), 2),
            'card_payment_charge' => round((float) ($data['card_payment_charge'] ?? $existing?->card_payment_charge ?? 0), 2),
            'net_amount' => $netAmount,
            'offer_applied' => (bool) ($data['offer_applied'] ?? $existing?->offer_applied ?? false),
            'offer_id' => isset($data['offer_id']) && $data['offer_id'] !== ''
                ? (int) $data['offer_id']
                : ($existing?->offer_id ?? null),
            'offer_promo_code' => isset($data['offer_promo_code'])
                ? (trim((string) $data['offer_promo_code']) ?: null)
                : ($existing?->offer_promo_code ?? null),
            'payment_method' => trim((string) ($data['payment_method'] ?? 'Cash')) ?: 'Cash',
            'refund_card_last4' => $data['refund_card_last4'] ?? $existing?->refund_card_last4,
            'amount_received' => isset($data['amount_received'])
                ? round((float) $data['amount_received'], 2)
                : null,
            'bank_id' => $bankId,
            'bank_name' => $bankName ?: null,
            'cheque_number' => $data['cheque_number'] ?? null,
            'notes' => $data['notes'] ?? null,
        ];

        if ($salesId !== '') {
            $payload['sales_id'] = $salesId;
        }

        if (!$existing) {
            $payload['company_id'] = $companyId;
        }

        return $payload;
    }

    private function getFilterOptions(int $companyId): array
    {
        $types = Sale::where('company_id', $companyId)
            ->distinct()
            ->pluck('transaction_type')
            ->filter()
            ->values()
            ->all();

        $transactionTypes = array_values(array_unique(array_merge(self::DEFAULT_TRANSACTION_TYPES, $types)));

        $salesTypes = Sale::where('company_id', $companyId)
            ->distinct()
            ->pluck('sales_type')
            ->filter()
            ->values()
            ->all();

        $salesTypes = array_values(array_unique(array_merge(self::DEFAULT_SALES_TYPES, $salesTypes)));

        $storedLocations = Sale::where('company_id', $companyId)
            ->distinct()
            ->pluck('location')
            ->filter()
            ->values()
            ->all();

        $locations = $this->locationService->getOptionsForCompany($companyId, $storedLocations);

        return [
            'transaction_types' => $transactionTypes,
            'sales_types' => $salesTypes,
            'locations' => $locations,
            'payment_methods' => PaymentService::defaultPaymentMethods(),
        ];
    }

    private function findForUser(User $user, int $id): Sale
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $sale = Sale::where('company_id', $company->id)->where('id', $id)->first();

        if (!$sale) {
            throw new Exception('Sale not found');
        }

        return $sale;
    }

    /**
     * @param  array<int, array{item_id: ?int, qty: float, unit_price?: float}>  $lines
     */
    private function applyStockMovementForCompletedSale(
        int $companyId,
        array $lines,
        string $location,
        string $transactionType,
        bool $allowNegativeInventory,
    ): void {
        if (OrderTransactionService::isExchange($transactionType)) {
            $saleLines = array_values(array_filter($lines, fn ($l) => ($l['line_direction'] ?? 'sale') !== 'return'));
            $returnLines = array_values(array_filter($lines, fn ($l) => ($l['line_direction'] ?? 'sale') === 'return'));
            if ($returnLines !== []) {
                $this->locationService->addStockForLines($companyId, $returnLines, $location);
            }
            if ($saleLines !== []) {
                $this->locationService->removeStockForLines($companyId, $saleLines, $location, $allowNegativeInventory);
            }

            return;
        }

        if (OrderTransactionService::isSalesReturn($transactionType)) {
            $this->locationService->addStockForLines($companyId, $lines, $location);

            return;
        }

        $this->locationService->removeStockForLines(
            $companyId,
            $lines,
            $location,
            $allowNegativeInventory,
        );
    }

    /**
     * @param  array<int, array{item_id: ?int, qty: float, unit_price?: float}>  $lines
     */
    private function revertStockMovementForCompletedSale(
        int $companyId,
        array $lines,
        string $location,
        string $transactionType,
    ): void {
        if (OrderTransactionService::isExchange($transactionType)) {
            $saleLines = array_values(array_filter($lines, fn ($l) => ($l['line_direction'] ?? 'sale') !== 'return'));
            $returnLines = array_values(array_filter($lines, fn ($l) => ($l['line_direction'] ?? 'sale') === 'return'));
            if ($returnLines !== []) {
                $this->locationService->removeStockForLines($companyId, $returnLines, $location, true);
            }
            if ($saleLines !== []) {
                $this->locationService->addStockForLines($companyId, $saleLines, $location);
            }

            return;
        }

        if (OrderTransactionService::isSalesReturn($transactionType)) {
            $this->locationService->removeStockForLines($companyId, $lines, $location, true);

            return;
        }

        $this->locationService->addStockForLines($companyId, $lines, $location);
    }

    private function formatSale(Sale $sale): array
    {
        $items = $sale->relationLoaded('items')
            ? $sale->items
            : $sale->items()->get();

        return [
            'id' => $sale->id,
            'transaction_type' => $sale->transaction_type,
            'order_status' => $sale->order_status ?? OrderTransactionService::ORDER_STATUS_COMPLETED,
            'sales_type' => $sale->sales_type,
            'pricing_mode' => $sale->pricing_mode ?? 'retail',
            'location' => $sale->location,
            'sale_date' => $sale->sale_date->format('Y-m-d'),
            'sale_datetime' => ($sale->created_at ?? $sale->sale_date)->format('d-m-Y H:i'),
            'sales_id' => $sale->sales_id,
            'customer_id' => $sale->customer_id,
            'customer_name' => $sale->customer_name,
            'customer_code' => $sale->customer?->customer_code,
            'customer_contact_no' => $sale->customer?->contact_no,
            'customer_route' => $sale->customer?->route,
            'returned_from_sale_id' => $sale->returned_from_sale_id,
            'has_return' => false,
            'sub_total' => (float) $sale->sub_total,
            'return_sub_total' => (float) ($sale->return_sub_total ?? 0),
            'discount' => (float) $sale->discount,
            'vat_amount' => (float) ($sale->vat_amount ?? 0),
            'vat_rate_id' => $sale->vat_rate_id,
            'service_charge' => (float) ($sale->service_charge ?? 0),
            'card_payment_charge' => (float) ($sale->card_payment_charge ?? 0),
            'net_amount' => (float) $sale->net_amount,
            'offer_applied' => (bool) ($sale->offer_applied ?? false),
            'offer_id' => $sale->offer_id,
            'offer_promo_code' => $sale->offer_promo_code,
            'offer_name' => $sale->relationLoaded('offer') && $sale->offer
                ? $sale->offer->name
                : ($sale->offer_id ? Offer::find($sale->offer_id)?->name : null),
            'payment_method' => $sale->payment_method,
            'amount_received' => $sale->amount_received !== null ? (float) $sale->amount_received : null,
            'bank_id' => $sale->bank_id,
            'bank_name' => $sale->bank_name,
            'cheque_number' => $sale->cheque_number,
            // Cheque return (bounced) on a sale-time payment — distinct from
            // has_return above, which is about a product being returned.
            'cheque_returned' => (bool) ($sale->cheque_returned ?? false),
            'refund_card_last4' => $sale->refund_card_last4,
            'notes' => $sale->notes,
            // Present only for a split-payment sale (payment_method
            // 'Split') — part cash, part cheque, part credit, etc.
            'payment_splits' => ($sale->relationLoaded('paymentSplits') ? $sale->paymentSplits : $sale->paymentSplits()->get())
                ->map(fn (SalePaymentSplit $s) => [
                    'payment_method' => $s->payment_method,
                    'amount' => (float) $s->amount,
                    'cheque_number' => $s->cheque_number,
                    'bank_name' => $s->bank_name,
                ])->values()->all(),
            'items' => $items->map(fn (SaleItem $line) => [
                'id' => $line->id,
                'item_id' => $line->item_id,
                'item_number' => $line->item_number,
                'description' => $line->description,
                'qty' => (float) $line->qty,
                'unit_price' => (float) $line->unit_price,
                'line_total' => (float) $line->line_total,
                'line_direction' => $line->line_direction ?? 'sale',
                'imei_serial' => $line->imei_serial,
                'batch_id' => $line->batch_id,
                'item_batch_id' => $line->item_batch_id,
                'secondary_uom' => $line->secondary_uom,
                'secondary_uom_qty' => $line->secondary_uom_qty !== null ? (float) $line->secondary_uom_qty : null,
                'additional_details' => $line->additional_details,
                'purchase_price' => $line->purchase_price !== null ? (float) $line->purchase_price : null,
            ])->values()->all(),
        ];
    }

    private function attachSaleReturnStatus(array $formatted, int $companyId, array $fullyReturnedMap): array
    {
        if (OrderTransactionService::isSalesReturn((string) ($formatted['transaction_type'] ?? ''))) {
            return $formatted;
        }

        $saleId = (int) ($formatted['id'] ?? 0);
        if ($saleId <= 0) {
            return $formatted;
        }

        if (isset($fullyReturnedMap[$saleId])) {
            $formatted['has_return'] = true;
            $formatted['has_partial_return'] = false;
            $formatted['return_status'] = 'full';
            $formatted['return_qty_summary'] = $this->buildReturnQtySummary($formatted, $companyId);

            return $formatted;
        }

        $returnedQtyMap = $this->getReturnedQtyMapForSource($companyId, $saleId);
        $hasPartial = $this->hasAnyReturnedQty($returnedQtyMap);

        $formatted['has_return'] = false;
        $formatted['has_partial_return'] = $hasPartial;
        $formatted['return_status'] = $hasPartial ? 'partial' : 'none';
        $formatted['return_qty_summary'] = $this->buildReturnQtySummary($formatted, $companyId);

        return $formatted;
    }

    /**
     * @return array{
     *   sold_qty: float,
     *   returned_qty: float,
     *   remaining_qty: float,
     *   lines: array<int, array{item_number: ?string, description: string, sold_qty: float, returned_qty: float, remaining_qty: float}>
     * }
     */
    private function buildReturnQtySummary(array $formatted, int $companyId): array
    {
        $saleId = (int) ($formatted['id'] ?? 0);
        $returnedQtyMap = $saleId > 0
            ? $this->getReturnedQtyMapForSource($companyId, $saleId)
            : [];

        $soldTotal = 0.0;
        $returnedTotal = 0.0;
        $remainingTotal = 0.0;
        $lines = [];

        foreach ($formatted['items'] ?? [] as $line) {
            $key = $this->saleReturnLineKey($line);
            $sold = round((float) ($line['qty'] ?? 0), 2);
            $returned = round((float) ($returnedQtyMap[$key] ?? 0), 2);
            $remaining = round(max(0, $sold - $returned), 2);

            $soldTotal += $sold;
            $returnedTotal += $returned;
            $remainingTotal += $remaining;

            if ($returned > 0.009 || $remaining > 0.009) {
                $lines[] = [
                    'item_number' => $line['item_number'] ?? null,
                    'description' => (string) ($line['description'] ?? ''),
                    'sold_qty' => $sold,
                    'returned_qty' => $returned,
                    'remaining_qty' => $remaining,
                ];
            }
        }

        return [
            'sold_qty' => round($soldTotal, 2),
            'returned_qty' => round($returnedTotal, 2),
            'remaining_qty' => round($remainingTotal, 2),
            'lines' => $lines,
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function buildRemainingReturnItems(Sale $source): array
    {
        $source->loadMissing('items');
        $returnedQtyMap = $this->getReturnedQtyMapForSource((int) $source->company_id, (int) $source->id);
        $remaining = [];

        foreach ($source->items as $line) {
            $key = $this->saleReturnLineKey($line);
            $sold = (float) $line->qty;
            $returned = (float) ($returnedQtyMap[$key] ?? 0);
            $qtyLeft = round(max(0, $sold - $returned), 2);
            if ($qtyLeft < 0.01) {
                continue;
            }

            $remaining[] = [
                'id' => $line->id,
                'item_id' => $line->item_id,
                'item_number' => $line->item_number,
                'description' => $line->description,
                'qty' => $qtyLeft,
                'sold_qty' => $sold,
                'returned_qty' => $returned,
                'unit_price' => (float) $line->unit_price,
                'line_total' => round($qtyLeft * (float) $line->unit_price, 2),
                'imei_serial' => $line->imei_serial,
                'batch_id' => $line->batch_id,
                'item_batch_id' => $line->item_batch_id,
                'secondary_uom' => $line->secondary_uom,
                'secondary_uom_qty' => $line->secondary_uom_qty !== null ? (float) $line->secondary_uom_qty : null,
                'additional_details' => $line->additional_details,
                'purchase_price' => $line->purchase_price !== null ? (float) $line->purchase_price : null,
            ];
        }

        return $remaining;
    }

    /**
     * @param  array<int, array<string, mixed>>  $lines
     */
    private function assertReturnWithinRemainingQty(int $companyId, int $sourceSaleId, array $lines): void
    {
        $source = Sale::where('company_id', $companyId)->where('id', $sourceSaleId)->first();
        if (!$source) {
            throw new Exception('Original sale invoice not found.');
        }

        if (
            OrderTransactionService::isSalesReturn($source->transaction_type)
            || OrderTransactionService::isExchange($source->transaction_type)
        ) {
            throw new Exception('Cannot return items from a return or exchange transaction.');
        }

        $source->load('items');
        $remainingByKey = [];
        foreach ($this->buildRemainingReturnItems($source) as $row) {
            $key = $this->saleReturnLineKey($row);
            $remainingByKey[$key] = (float) $row['qty'];
        }

        if ($remainingByKey === []) {
            throw new Exception('This invoice has already been fully returned.');
        }

        foreach ($lines as $line) {
            $key = $this->saleReturnLineKey($line);
            $qty = (float) ($line['qty'] ?? 0);
            if ($qty <= 0) {
                continue;
            }

            if (!array_key_exists($key, $remainingByKey)) {
                throw new Exception('One or more return items were not on the original sale invoice.');
            }

            if ($qty - $remainingByKey[$key] > 0.009) {
                $label = trim((string) ($line['item_number'] ?? $line['description'] ?? 'item'));
                throw new Exception(
                    "Return qty for {$label} exceeds remaining returnable qty ({$remainingByKey[$key]})."
                );
            }
        }
    }

    /**
     * Guards against a real cash loss: if the original bill was a Credit sale,
     * nothing was ever paid for it, so a net-negative exchange (refund due)
     * must settle via the customer's account — never hand out cash/card refund
     * for money that was never actually collected. Mirrors the mobile app's own
     * payment-method lock (usePosSale.ts's returnFromCreditSale), enforced here
     * as the authoritative backend check regardless of what any client sends.
     */
    private function assertNoCashRefundForCreditSource(
        int $companyId,
        int $sourceSaleId,
        float $netAmount,
        string $paymentMethod,
    ): void {
        if ($netAmount >= -0.005 || CustomerBalanceService::isCreditPayment($paymentMethod)) {
            return;
        }

        $source = Sale::where('company_id', $companyId)->where('id', $sourceSaleId)->first();
        if ($source && CustomerBalanceService::isCreditPayment($source->payment_method)) {
            throw new Exception(
                'This exchange results in a refund, but the original sale was on credit — '
                .'nothing was paid in cash for it. Choose "Refund to account" as the payment method.'
            );
        }
    }

    /**
     * @param  array<string, mixed>|SaleItem  $line
     */
    private function saleReturnLineKey(array|SaleItem $line): string
    {
        $itemId = is_array($line) ? ($line['item_id'] ?? null) : $line->item_id;
        $itemNumber = is_array($line) ? ($line['item_number'] ?? null) : $line->item_number;
        $itemBatchId = is_array($line) ? ($line['item_batch_id'] ?? null) : $line->item_batch_id;
        $batchId = is_array($line) ? ($line['batch_id'] ?? null) : $line->batch_id;

        $base = $this->returnLineKey($itemId, $itemNumber);
        if ($itemBatchId) {
            return $base.':ib:'.(int) $itemBatchId;
        }
        if ($batchId && trim((string) $batchId) !== '') {
            return $base.':b:'.strtoupper(trim((string) $batchId));
        }

        return $base;
    }

    private function returnLineKey(?int $itemId, ?string $itemNumber): string
    {
        if ($itemId) {
            return 'id:'.$itemId;
        }

        $number = strtoupper(trim((string) $itemNumber));

        return $number !== '' ? 'num:'.$number : 'desc:';
    }

    /**
     * @return array<string, float>
     */
    private function getReturnedQtyMapForSource(int $companyId, int $sourceSaleId): array
    {
        $map = [];

        foreach ($this->getReturnDocumentsForSource($companyId, $sourceSaleId) as $returnSale) {
            $returnSale->loadMissing('items');
            foreach ($returnSale->items as $line) {
                // A plain Return bill's rows are all returns; an Exchange bill mixes
                // sale-direction and return-direction rows in one document — only the
                // return-direction rows here were actually taken back from this source.
                if (($line->line_direction ?? 'return') === 'sale') {
                    continue;
                }
                $key = $this->saleReturnLineKey($line);
                $map[$key] = round(($map[$key] ?? 0) + (float) $line->qty, 2);
            }
        }

        return $map;
    }

    /**
     * @return \Illuminate\Support\Collection<int, Sale>
     */
    private function getReturnDocumentsForSource(int $companyId, int $sourceSaleId)
    {
        $source = Sale::where('company_id', $companyId)->where('id', $sourceSaleId)->first();
        if (!$source) {
            return collect();
        }

        return Sale::where('company_id', $companyId)
            ->whereIn('transaction_type', [
                OrderTransactionService::TRANSACTION_TYPE_RETURN,
                OrderTransactionService::TRANSACTION_TYPE_EXCHANGE,
            ])
            ->where(function ($query) use ($sourceSaleId, $source) {
                $query->where('returned_from_sale_id', $sourceSaleId)
                    ->orWhere('notes', 'like', 'Return for invoice '.$source->sales_id.'%');
            })
            ->get();
    }

    /**
     * @param  array<string, float>  $returnedQtyMap
     */
    private function hasAnyReturnedQty(array $returnedQtyMap): bool
    {
        foreach ($returnedQtyMap as $qty) {
            if ($qty > 0.009) {
                return true;
            }
        }

        return false;
    }

    /**
     * @return array<int, true>
     */
    private function getFullyReturnedSourceSaleIdMap(int $companyId): array
    {
        $map = [];

        Sale::where('company_id', $companyId)
            ->where('transaction_type', OrderTransactionService::TRANSACTION_TYPE_SALE)
            ->with('items')
            ->orderByDesc('id')
            ->chunk(200, function ($sales) use ($companyId, &$map) {
                foreach ($sales as $sale) {
                    if ($this->buildRemainingReturnItems($sale) === []) {
                        $returnedMap = $this->getReturnedQtyMapForSource($companyId, (int) $sale->id);
                        if ($this->hasAnyReturnedQty($returnedMap)) {
                            $map[(int) $sale->id] = true;
                        }
                    }
                }
            });

        return $map;
    }

    /** Link legacy return rows to their original sale via notes text. */
    private function backfillReturnedFromSaleLinks(int $companyId): void
    {
        Sale::where('company_id', $companyId)
            ->where(function ($query) {
                $query->whereNull('returned_from_sale_id')->orWhere('returned_from_sale_id', 0);
            })
            ->whereNotNull('notes')
            ->where('notes', 'like', 'Return for invoice %')
            ->get(['id', 'notes'])
            ->each(function (Sale $returnSale) use ($companyId) {
                $sourceId = $this->resolveReturnedFromSaleIdFromNotes($companyId, (string) $returnSale->notes);
                if ($sourceId) {
                    $returnSale->forceFill(['returned_from_sale_id' => $sourceId])->save();
                }
            });
    }

    private function resolveReturnedFromSaleIdFromNotes(int $companyId, string $notes): ?int
    {
        if (!preg_match('/Return for invoice\s+(\S+)/i', $notes, $matches)) {
            return null;
        }

        $sourceId = Sale::where('company_id', $companyId)
            ->where('sales_id', $matches[1])
            ->value('id');

        return $sourceId ? (int) $sourceId : null;
    }

}
