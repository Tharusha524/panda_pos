<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\Branch;
use App\Models\Customer;
use App\Models\Expense;
use App\Models\Item;
use App\Models\PosPayment;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalePaymentAllocation;
use App\Models\Supplier;
use App\Models\User;
use Carbon\Carbon;
use Exception;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class ReportService
{
    private const PURCHASE_TYPE_ORDER = '1003';

    private const PURCHASE_TYPE_RETURN = '1002';

    public function __construct(
        private CompanySettingService $companySettingService,
        private LocationService $locationService,
    ) {
    }

    /**
     * @param  array<string, mixed>  $ctx
     */
    private function applyCustomerLocationFilter(Builder $query, array $ctx): Builder
    {
        if (!empty($ctx['branch_name'])) {
            $branch = $ctx['branch_name'];
            $query->where(function ($sub) use ($branch) {
                $sub->where('location', $branch)
                    ->orWhere('inventory_location', $branch);
            });
        }

        return $query;
    }

    /**
     * @param  array<string, mixed>  $ctx
     */
    private function applyActivityLogBranchFilter(Builder $query, array $ctx): Builder
    {
        if (empty($ctx['branch_name'])) {
            return $query;
        }

        $companyId = $ctx['company_id'];
        $branch = $ctx['branch_name'];

        $saleIds = Sale::where('company_id', $companyId)->where('location', $branch)->pluck('id');
        $purchaseIds = Purchase::where('company_id', $companyId)->where('location', $branch)->pluck('id');
        $expenseIds = Expense::where('company_id', $companyId)->where('location', $branch)->pluck('id');
        $paymentIds = PosPayment::where('company_id', $companyId)->where('location', $branch)->pluck('id');
        $itemIds = Item::where('company_id', $companyId)->where('location', $branch)->pluck('id');

        return $query->where(function ($outer) use ($saleIds, $purchaseIds, $expenseIds, $paymentIds, $itemIds) {
            $outer->where(function ($q) use ($saleIds) {
                $q->where('model_type', 'like', '%Sale%')->whereIn('model_id', $saleIds);
            })
                ->orWhere(function ($q) use ($purchaseIds) {
                    $q->where('model_type', 'like', '%Purchase%')->whereIn('model_id', $purchaseIds);
                })
                ->orWhere(function ($q) use ($expenseIds) {
                    $q->where('model_type', 'like', '%Expense%')->whereIn('model_id', $expenseIds);
                })
                ->orWhere(function ($q) use ($paymentIds) {
                    $q->where(function ($sub) use ($paymentIds) {
                        $sub->where('model_type', 'like', '%PosPayment%')
                            ->orWhere('model_type', 'like', '%Payment%');
                    })->whereIn('model_id', $paymentIds);
                })
                ->orWhere(function ($q) use ($itemIds) {
                    $q->where('model_type', 'like', '%Item%')->whereIn('model_id', $itemIds);
                });
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function generate(User $user, string $reportKey, array $filters): array
    {
        $key = strtolower(trim($reportKey));
        $ctx = $this->buildContext($user, $filters);

        return match ($key) {
            'sales-summary' => $this->salesSummary($ctx),
            'sales-details' => $this->salesDetails($ctx, OrderTransactionService::TRANSACTION_TYPE_SALE),
            'sales-return-summary' => $this->salesReturnSummary($ctx),
            'sales-return-details' => $this->salesDetails($ctx, OrderTransactionService::TRANSACTION_TYPE_RETURN),
            'customer-payment' => $this->customerPayments($ctx),
            'customer-settlement' => $this->customerSettlement($ctx),
            'sales-by-category' => $this->salesByCategory($ctx),
            'customer-net-sales' => $this->customerNetSales($ctx),
            'expense-summary' => $this->expenseSummary($ctx),
            'reorder-items' => $this->reorderItems($ctx),
            'expiry-items' => $this->expiryItems($ctx),
            'item-list' => $this->itemList($ctx),
            'inventory-in-out' => $this->inventoryInOut($ctx),
            'write-off-summary', 'write-off-details' => $this->unavailableReport($ctx, 'Write-off tracking is not configured yet.'),
            'inventory-summary' => $this->inventorySummary($ctx),
            'og-tog-details' => $this->unavailableReport($ctx, 'OG/TOG details are not configured yet.'),
            'inventory-adjustment' => $this->unavailableReport($ctx, 'Inventory adjustment log is not configured yet.'),
            'inventory-category' => $this->inventoryByCategory($ctx),
            'repair-item-summary' => $this->repairItemSummary($ctx),
            'non-moving-items' => $this->nonMovingItems($ctx),
            'deleted-inventory-summary' => $this->deletedInventorySummary($ctx),
            'customer-list' => $this->customerList($ctx),
            'customer-outstanding' => $this->customerOutstanding($ctx),
            'customer-cheque-details' => $this->customerChequeDetails($ctx),
            'customer-aging' => $this->customerAging($ctx),
            'customer-summary' => $this->customerSummary($ctx),
            'customer-activity' => $this->customerActivity($ctx),
            'supplier-detail' => $this->supplierDetail($ctx),
            'supplier-activity' => $this->supplierActivity($ctx),
            'supplier-purchase' => $this->supplierPurchase($ctx),
            'purchase-details' => $this->purchaseDetails($ctx, null),
            'purchase-return' => $this->purchaseDetails($ctx, self::PURCHASE_TYPE_RETURN),
            'purchase-order' => $this->purchaseDetails($ctx, self::PURCHASE_TYPE_ORDER),
            'supplier-payment' => $this->supplierPayments($ctx, false),
            'supplier-cheque-payment-details' => $this->supplierPayments($ctx, true),
            'cash-in-hand' => $this->cashInHand($ctx),
            'sold-items-profit' => $this->soldItemsProfit($ctx),
            'income-expenses' => $this->incomeExpenses($ctx),
            'inventory-costing' => $this->inventoryCosting($ctx),
            'end-of-day' => $this->endOfDay($ctx),
            'audit-report' => $this->auditReport($ctx),
            'transaction-summary' => $this->transactionSummary($ctx),
            default => throw new Exception('Unknown report type.'),
        };
    }

    /**
     * @return list<string>
     */
    public function listReportKeys(): array
    {
        return [
            'sales-summary', 'sales-details', 'sales-return-summary', 'sales-return-details',
            'customer-payment', 'customer-settlement', 'sales-by-category', 'customer-net-sales',
            'expense-summary',
            'reorder-items', 'expiry-items', 'item-list', 'inventory-in-out',
            'write-off-summary', 'write-off-details', 'inventory-summary', 'og-tog-details',
            'inventory-adjustment', 'inventory-category', 'repair-item-summary',
            'non-moving-items', 'deleted-inventory-summary',
            'customer-list', 'customer-outstanding', 'customer-cheque-details',
            'customer-aging', 'customer-summary', 'customer-activity',
            'supplier-detail', 'supplier-activity',
            'supplier-purchase', 'purchase-details', 'purchase-return', 'purchase-order',
            'supplier-payment', 'supplier-cheque-payment-details',
            'cash-in-hand', 'sold-items-profit', 'income-expenses', 'inventory-costing', 'end-of-day',
            'audit-report', 'transaction-summary',
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function buildContext(User $user, array $filters): array
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $dateFrom = $this->parseDate($filters['date_from'] ?? null, now()->startOfMonth());
        $dateTo = $this->parseDate($filters['date_to'] ?? null, now());
        if ($dateFrom->gt($dateTo)) {
            [$dateFrom, $dateTo] = [$dateTo, $dateFrom];
        }

        $branchId = null;
        $branchName = null;
        $locationParam = is_string($filters['location'] ?? null) ? trim($filters['location']) : '';

        if ($locationParam !== '' && strtolower($locationParam) !== 'all') {
            $branchName = $this->locationService->normalize($locationParam);
        } elseif (isset($filters['branch_id']) && $filters['branch_id'] !== '' && $filters['branch_id'] !== 'all') {
            $branchId = (int) $filters['branch_id'];
            $branch = Branch::where('company_id', $company->id)->where('id', $branchId)->first();
            if (!$branch) {
                throw new Exception('Branch not found.');
            }
            $branchName = $branch->name;
        }

        $itemId = null;
        if (isset($filters['item_id']) && $filters['item_id'] !== '' && $filters['item_id'] !== null) {
            $itemId = (int) $filters['item_id'];
        }

        return [
            'company_id' => $company->id,
            'date_from' => $dateFrom->toDateString(),
            'date_to' => $dateTo->toDateString(),
            'branch_id' => $branchId,
            'branch_name' => $branchName,
            'branch_label' => $branchName ?? 'All branches',
            'item_id' => $itemId,
            'generated_at' => now()->format('Y-m-d H:i:s'),
        ];
    }

    /**
     * Resolves the filtered item's id/display label for a report's `filters`
     * echo, only when the item actually exists in this company.
     *
     * @param  array<string, mixed>  $ctx
     * @return array{id: int, label: string}|null
     */
    private function resolveItemFilterLabel(array $ctx): ?array
    {
        if (empty($ctx['item_id'])) {
            return null;
        }
        $item = Item::where('company_id', $ctx['company_id'])->find($ctx['item_id']);
        if (!$item) {
            return null;
        }
        $label = $item->item_number
            ? "{$item->item_number} — {$item->description}"
            : (string) $item->description;

        return ['id' => $item->id, 'label' => $label];
    }

    private function parseDate(mixed $value, Carbon $default): Carbon
    {
        if (!$value) {
            return $default->copy()->startOfDay();
        }
        try {
            return Carbon::parse((string) $value)->startOfDay();
        } catch (\Throwable) {
            return $default->copy()->startOfDay();
        }
    }

    /**
     * @param  array<string, mixed>  $ctx
     */
    private function applyLocationFilter(Builder $query, array $ctx, string $column = 'location'): Builder
    {
        if (!empty($ctx['branch_name'])) {
            $query->where($column, $ctx['branch_name']);
        }

        return $query;
    }

    /**
     * @param  array<string, mixed>  $ctx
     */
    private function paymentsInPeriodQuery(array $ctx): Builder
    {
        $q = PosPayment::where('company_id', $ctx['company_id'])
            ->whereBetween('payment_date', [$ctx['date_from'], $ctx['date_to']]);

        return $this->applyLocationFilter($q, $ctx);
    }

    /**
     * Customer receipts: money received from sales / customers (income).
     *
     * @param  array<string, mixed>  $ctx
     */
    private function incomingPaymentsQuery(array $ctx): Builder
    {
        return $this->paymentsInPeriodQuery($ctx)
            ->where(function ($q) {
                $q->where(function ($income) {
                    $income->where('source_type', PaymentService::SOURCE_SALE)
                        ->where(function ($sub) {
                            $sub->whereRaw('LOWER(COALESCE(receipt_type, "")) != ?', ['return'])
                                ->orWhereNull('receipt_type');
                        });
                })->orWhere(function ($purchaseRefund) {
                    $purchaseRefund->where('source_type', PaymentService::SOURCE_PURCHASE)
                        ->whereRaw('LOWER(COALESCE(receipt_type, "")) = ?', ['return']);
                })->orWhere(function ($sub) {
                    $sub->whereNull('source_type')
                        ->whereIn('receipt_type', ['Sale', 'Advance', 'Credit Note']);
                });
            })
            ->whereNotIn('source_type', [
                PaymentService::SOURCE_EXPENSE,
                PaymentService::SOURCE_SALARY,
            ]);
    }

    /**
     * Money paid out: purchases, expenses, salaries (outcome).
     *
     * @param  array<string, mixed>  $ctx
     */
    private function outgoingPaymentsQuery(array $ctx): Builder
    {
        return $this->paymentsInPeriodQuery($ctx)->where(function ($q) {
            $q->where(function ($paidOut) {
                $paidOut->where('source_type', PaymentService::SOURCE_PURCHASE)
                    ->where(function ($sub) {
                        $sub->whereRaw('LOWER(COALESCE(receipt_type, "")) != ?', ['return'])
                            ->orWhereNull('receipt_type');
                    });
            })
                ->orWhereIn('source_type', [PaymentService::SOURCE_EXPENSE, PaymentService::SOURCE_SALARY])
                ->orWhereIn('receipt_type', ['Purchase', 'Salary', 'Expense'])
                ->orWhere(function ($sub) {
                    $sub->where('source_type', PaymentService::SOURCE_SALE)
                        ->whereRaw('LOWER(receipt_type) = ?', ['return']);
                });
        });
    }

    private function signedIncomingPaymentAmount(PosPayment $payment): float
    {
        return round(abs((float) $payment->paid_amount), 2);
    }

    /**
     * @param  array<string, mixed>  $ctx
     */
    private function sumIncomingPayments(array $ctx): float
    {
        return round(
            $this->incomingPaymentsQuery($ctx)
                ->get()
                ->sum(fn (PosPayment $p) => $this->signedIncomingPaymentAmount($p)),
            2
        );
    }

    /**
     * @param  array<string, mixed>  $ctx
     */
    private function sumOutgoingPayments(array $ctx): float
    {
        return round((float) $this->outgoingPaymentsQuery($ctx)->sum('paid_amount'), 2);
    }

    /**
     * @param  array<string, mixed>  $ctx
     */
    private function completedSalesQuery(array $ctx): Builder
    {
        $q = Sale::where('company_id', $ctx['company_id'])
            ->whereBetween('sale_date', [$ctx['date_from'], $ctx['date_to']])
            ->where(function ($sub) {
                $sub->whereNull('order_status')
                    ->orWhere('order_status', OrderTransactionService::ORDER_STATUS_COMPLETED);
            });

        return $this->applyLocationFilter($q, $ctx);
    }

    /**
     * @param  array<int, array{key: string, label: string}>  $columns
     * @param  array<int, array<string, mixed>>  $rows
     * @param  array<int, array{label: string, value: string|float|int}>  $summary
     * @param  array<string, mixed>  $ctx
     * @return array<string, mixed>
     */
    private function reportPayload(
        array $ctx,
        string $title,
        array $columns,
        array $rows,
        array $summary = [],
        ?string $note = null,
        /** Only passed by report functions that actually filter their query by
         * item (see resolveItemFilterLabel) — omitted everywhere else so the
         * mobile app doesn't echo an "Item: ..." line for a filter that had no
         * effect on the data. */
        ?int $itemId = null,
        ?string $itemLabel = null,
    ): array {
        return [
            'title' => $title,
            'generated_at' => $ctx['generated_at'],
            'filters' => [
                'date_from' => $ctx['date_from'],
                'date_to' => $ctx['date_to'],
                'branch_id' => $ctx['branch_id'],
                'branch_name' => $ctx['branch_label'] ?? 'All branches',
                'item_id' => $itemId,
                'item_name' => $itemLabel,
            ],
            'summary' => $summary,
            'columns' => $columns,
            'rows' => $rows,
            'note' => $note,
        ];
    }

    /**
     * @param  array<string, mixed>  $ctx
     * @return array<string, mixed>
     */
    private function unavailableReport(array $ctx, string $note): array
    {
        return $this->reportPayload($ctx, 'Report', [], [], [], $note);
    }

    /**
     * @param  array<string, mixed>  $ctx
     * @return array<string, mixed>
     */
    private function salesSummary(array $ctx): array
    {
        $saleType = OrderTransactionService::TRANSACTION_TYPE_SALE;
        $returnType = OrderTransactionService::TRANSACTION_TYPE_RETURN;

        $base = $this->completedSalesQuery($ctx);
        $salesAmount = round((float) (clone $base)->where('transaction_type', $saleType)->sum('net_amount'), 2);
        $salesCount = (clone $base)->where('transaction_type', $saleType)->count();
        $returnsAmount = round((float) (clone $base)->where('transaction_type', $returnType)->sum('net_amount'), 2);
        $returnsCount = (clone $base)->where('transaction_type', $returnType)->count();

        // An Exchange bill's return side never gets its own Sale row (it's a
        // return_direction slice of a '1004' bill) — add its return amount
        // into the same totals so Return figures aren't missing it.
        $exchangeReturnBase = (clone $base)
            ->where('transaction_type', OrderTransactionService::TRANSACTION_TYPE_EXCHANGE)
            ->where('return_sub_total', '>', 0);
        $returnsAmount = round(
            $returnsAmount + (float) (clone $exchangeReturnBase)->sum('return_sub_total'),
            2,
        );
        $returnsCount += (clone $exchangeReturnBase)->count();

        $saleModels = (clone $base)
            ->with(['items' => fn ($q) => $q->orderBy('id'), 'bank', 'customer', 'paymentSplits'])
            ->orderByDesc('sale_date')
            ->orderByDesc('id')
            ->get();

        $sales = [];
        foreach ($saleModels as $sale) {
            $sales[] = $this->formatSaleSummaryRow($sale);
            // Also emit a synthetic "Return" row for the return-direction
            // lines of an Exchange bill, so it shows up wherever the app
            // filters this list down to transaction_label === 'Return'
            // (e.g. the Return Report Excel export).
            if (
                OrderTransactionService::isExchange($sale->transaction_type)
                && (float) ($sale->return_sub_total ?? 0) > 0.004
            ) {
                $sales[] = $this->formatExchangeReturnRow($sale);
            }
        }

        return array_merge(
            $this->reportPayload(
                $ctx,
                'Sales Summary',
                [],
                [],
                [
                    ['label' => 'Total Sales', 'value' => $salesAmount],
                    ['label' => 'Sales Count', 'value' => $salesCount],
                    ['label' => 'Total Returns', 'value' => $returnsAmount],
                    ['label' => 'Return Count', 'value' => $returnsCount],
                    ['label' => 'Net Sales', 'value' => round($salesAmount - $returnsAmount, 2)],
                ],
            ),
            [
                'layout' => 'sales_summary',
                'sales' => $sales,
            ],
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function formatSaleSummaryRow(Sale $sale): array
    {
        $isReturn = OrderTransactionService::isSalesReturn($sale->transaction_type);
        $created = $sale->created_at?->format('H:i') ?? '00:00';
        $dateLabel = ($sale->sale_date?->format('d-m-Y') ?? '').' '.$created;

        $items = $sale->items->map(function (SaleItem $item) {
            $qty = (float) $item->qty;
            $unitPrice = round((float) $item->unit_price, 2);
            $lineTotal = round((float) $item->line_total, 2);
            $gross = round($qty * $unitPrice, 2);
            $discount = round(max(0, $gross - $lineTotal), 2);
            $netPrice = $qty > 0 ? round($lineTotal / $qty, 2) : $unitPrice;

            return [
                'item_number' => $item->item_number,
                'description' => $item->description,
                'qty' => round($qty, 2),
                'unit_price' => $unitPrice,
                'discount' => $discount,
                'net_price' => $netPrice,
                'amount' => $lineTotal,
            ];
        })->all();

        return [
            'id' => $sale->id,
            'date' => trim($dateLabel),
            'sales_id' => $sale->sales_id,
            'customer' => $sale->customer_name ?? 'Walk-in',
            'route' => $sale->customer?->route,
            'location' => $sale->location,
            'transaction_label' => $isReturn ? 'Return' : 'Sale',
            'sub_total' => round((float) $sale->sub_total, 2),
            'discount' => round((float) $sale->discount, 2),
            'net_amount' => round((float) $sale->net_amount, 2),
            'payment_method' => $sale->payment_method,
            'cheque_number' => $sale->cheque_number,
            // Prefer the freely-typed bank_name (how sales checkout actually
            // records it) — bank?->name only applies when a real registered
            // bank was picked, which most cheque sales never had.
            'bank_name' => $sale->bank_name ?: $sale->bank?->name,
            // Present only for a split-payment sale (payment_method
            // 'Split') — the Excel pivot spreads the row's total across one
            // column per method listed here instead of a single amount.
            'payment_splits' => $sale->paymentSplits->map(fn ($s) => [
                'payment_method' => $s->payment_method,
                'amount' => round((float) $s->amount, 2),
                'cheque_number' => $s->cheque_number,
                'bank_name' => $s->bank_name,
            ])->values()->all(),
            'items' => $items,
        ];
    }

    /**
     * Synthetic report row for the return-direction lines of an Exchange
     * bill ('1004') — same shape as formatSaleSummaryRow but scoped to just
     * the returned items and the return_sub_total amount, tagged
     * transaction_label 'Return' so it flows through the same Return-only
     * filters as a plain Return bill.
     *
     * @return array<string, mixed>
     */
    private function formatExchangeReturnRow(Sale $sale): array
    {
        $created = $sale->created_at?->format('H:i') ?? '00:00';
        $dateLabel = ($sale->sale_date?->format('d-m-Y') ?? '').' '.$created;

        $items = $sale->items
            ->filter(fn (SaleItem $item) => ($item->line_direction ?? 'sale') === 'return')
            ->map(function (SaleItem $item) {
                $qty = (float) $item->qty;
                $unitPrice = round((float) $item->unit_price, 2);
                $lineTotal = round((float) $item->line_total, 2);
                $netPrice = $qty > 0 ? round($lineTotal / $qty, 2) : $unitPrice;

                return [
                    'item_number' => $item->item_number,
                    'description' => $item->description,
                    'qty' => round($qty, 2),
                    'unit_price' => $unitPrice,
                    'discount' => 0,
                    'net_price' => $netPrice,
                    'amount' => $lineTotal,
                ];
            })->values()->all();

        return [
            'id' => $sale->id,
            'date' => trim($dateLabel),
            'sales_id' => $sale->sales_id,
            'customer' => $sale->customer_name ?? 'Walk-in',
            'route' => $sale->customer?->route,
            'location' => $sale->location,
            'transaction_label' => 'Return',
            'sub_total' => round((float) $sale->return_sub_total, 2),
            'discount' => 0.0,
            'net_amount' => round((float) $sale->return_sub_total, 2),
            'payment_method' => 'Exchange',
            'cheque_number' => null,
            'bank_name' => null,
            'payment_splits' => [],
            'items' => $items,
        ];
    }

    /**
     * @param  array<string, mixed>  $ctx
     * @return array<string, mixed>
     */
    private function salesReturnSummary(array $ctx): array
    {
        $returnType = OrderTransactionService::TRANSACTION_TYPE_RETURN;
        $base = $this->completedSalesQuery($ctx)->where('transaction_type', $returnType);
        $total = round((float) $base->sum('net_amount'), 2);
        $count = $base->count();

        $rows = (clone $base)
            ->select(DB::raw('DATE(sale_date) as period'), DB::raw('SUM(net_amount) as amount'), DB::raw('COUNT(*) as cnt'))
            ->groupBy(DB::raw('DATE(sale_date)'))
            ->orderBy('period')
            ->get()
            ->map(fn ($r) => [
                'period' => $r->period,
                'amount' => round((float) $r->amount, 2),
                'count' => (int) $r->cnt,
            ])
            ->all();

        // An Exchange bill's return side has no Return-type row of its own —
        // fold its return_sub_total into the same date buckets so it's not
        // missing from this summary.
        $exchangeBase = $this->completedSalesQuery($ctx)
            ->where('transaction_type', OrderTransactionService::TRANSACTION_TYPE_EXCHANGE)
            ->where('return_sub_total', '>', 0);
        $exchangeTotal = round((float) (clone $exchangeBase)->sum('return_sub_total'), 2);
        $exchangeCount = (clone $exchangeBase)->count();

        $exchangeRows = (clone $exchangeBase)
            ->select(DB::raw('DATE(sale_date) as period'), DB::raw('SUM(return_sub_total) as amount'), DB::raw('COUNT(*) as cnt'))
            ->groupBy(DB::raw('DATE(sale_date)'))
            ->orderBy('period')
            ->get()
            ->map(fn ($r) => [
                'period' => $r->period,
                'amount' => round((float) $r->amount, 2),
                'count' => (int) $r->cnt,
            ])
            ->all();

        $merged = [];
        foreach (array_merge($rows, $exchangeRows) as $row) {
            $period = $row['period'];
            if (!isset($merged[$period])) {
                $merged[$period] = ['period' => $period, 'amount' => 0.0, 'count' => 0];
            }
            $merged[$period]['amount'] = round($merged[$period]['amount'] + $row['amount'], 2);
            $merged[$period]['count'] += $row['count'];
        }
        ksort($merged);
        $rows = array_values($merged);

        return $this->reportPayload(
            $ctx,
            'Sales Return Summary',
            [
                ['key' => 'period', 'label' => 'Date'],
                ['key' => 'amount', 'label' => 'Return Amount'],
                ['key' => 'count', 'label' => 'Count'],
            ],
            $rows,
            [
                ['label' => 'Total Returns', 'value' => round($total + $exchangeTotal, 2)],
                ['label' => 'Return Transactions', 'value' => $count + $exchangeCount],
            ],
        );
    }

    /**
     * @param  array<string, mixed>  $ctx
     * @return array<string, mixed>
     */
    private function salesDetails(array $ctx, string $transactionType): array
    {
        $isReturn = $transactionType === OrderTransactionService::TRANSACTION_TYPE_RETURN;
        $sales = $this->completedSalesQuery($ctx)
            ->where('transaction_type', $transactionType)
            ->when(
                !empty($ctx['item_id']),
                fn (Builder $q) => $q->whereHas(
                    'items',
                    fn (Builder $si) => $si->where('item_id', $ctx['item_id']),
                ),
            )
            ->orderByDesc('sale_date')
            ->orderByDesc('id')
            ->get();

        $rows = $sales->map(fn (Sale $s) => [
            'date' => $s->sale_date?->format('Y-m-d'),
            'sales_id' => $s->sales_id,
            'customer' => $s->customer_name ?? 'Walk-in',
            'location' => $s->location,
            'payment_method' => $s->payment_method,
            'sub_total' => round((float) $s->sub_total, 2),
            'discount' => round((float) $s->discount, 2),
            'net_amount' => round((float) $s->net_amount, 2),
        ])->all();

        // Return report only — an Exchange bill's return side never gets its
        // own Return-type row (it's a return_direction slice of a '1004'
        // bill), so fold those in here too or they'd never show up at all.
        if ($isReturn) {
            $exchangeRows = $this->completedSalesQuery($ctx)
                ->where('transaction_type', OrderTransactionService::TRANSACTION_TYPE_EXCHANGE)
                ->where('return_sub_total', '>', 0)
                ->when(
                    !empty($ctx['item_id']),
                    fn (Builder $q) => $q->whereHas(
                        'items',
                        fn (Builder $si) => $si->where('item_id', $ctx['item_id'])
                            ->where('line_direction', 'return'),
                    ),
                )
                ->orderByDesc('sale_date')
                ->orderByDesc('id')
                ->get()
                ->map(fn (Sale $s) => [
                    'date' => $s->sale_date?->format('Y-m-d'),
                    'sales_id' => $s->sales_id,
                    'customer' => $s->customer_name ?? 'Walk-in',
                    'location' => $s->location,
                    'payment_method' => 'Exchange',
                    'sub_total' => round((float) $s->return_sub_total, 2),
                    'discount' => 0.0,
                    'net_amount' => round((float) $s->return_sub_total, 2),
                ])->all();

            $rows = array_merge($rows, $exchangeRows);
            usort($rows, fn ($a, $b) => strcmp($b['date'] ?? '', $a['date'] ?? ''));
        }

        $itemFilter = $this->resolveItemFilterLabel($ctx);

        // Return report only — trimmed to Date/Sales ID/Customer/Payment/Net
        // (no Branch, Discount, Sub Total). Sales Details keeps every column.
        $columns = $isReturn
            ? [
                ['key' => 'date', 'label' => 'Date'],
                ['key' => 'sales_id', 'label' => 'Sales ID'],
                ['key' => 'customer', 'label' => 'Customer'],
                ['key' => 'payment_method', 'label' => 'Payment'],
                ['key' => 'net_amount', 'label' => 'Net'],
            ]
            : [
                ['key' => 'date', 'label' => 'Date'],
                ['key' => 'sales_id', 'label' => 'Sales ID'],
                ['key' => 'customer', 'label' => 'Customer'],
                ['key' => 'location', 'label' => 'Branch'],
                ['key' => 'payment_method', 'label' => 'Payment'],
                ['key' => 'sub_total', 'label' => 'Sub Total'],
                ['key' => 'discount', 'label' => 'Discount'],
                ['key' => 'net_amount', 'label' => 'Net'],
            ];

        return $this->reportPayload(
            $ctx,
            $isReturn ? 'Sales Return Details' : 'Sales Details',
            $columns,
            $rows,
            [
                ['label' => 'Transactions', 'value' => count($rows)],
                ['label' => 'Total Amount', 'value' => round(array_sum(array_column($rows, 'net_amount')), 2)],
            ],
            null,
            $itemFilter['id'] ?? null,
            $itemFilter['label'] ?? null,
        );
    }

    /**
     * @param  array<string, mixed>  $ctx
     * @return array<string, mixed>
     */
    private function customerPayments(array $ctx): array
    {
        $payments = $this->incomingPaymentsQuery($ctx)
            ->orderByDesc('payment_date')
            ->get();

        $rows = $payments->map(fn (PosPayment $p) => [
            'date' => $p->payment_date?->format('Y-m-d'),
            'sales_no' => $p->sales_no,
            'receipt_type' => $p->receipt_type,
            'payment_method' => $p->payment_method,
            'direction' => 'Income',
            'amount_received' => $this->signedIncomingPaymentAmount($p),
            'location' => $p->location,
            'notes' => $p->notes,
        ])->all();

        $totalReceived = round(array_sum(array_column($rows, 'amount_received')), 2);

        return $this->reportPayload(
            $ctx,
            'Customer Payment',
            [
                ['key' => 'date', 'label' => 'Date'],
                ['key' => 'sales_no', 'label' => 'Reference'],
                ['key' => 'receipt_type', 'label' => 'Type'],
                ['key' => 'direction', 'label' => 'Direction'],
                ['key' => 'payment_method', 'label' => 'Method'],
                ['key' => 'amount_received', 'label' => 'Amount Received'],
                ['key' => 'location', 'label' => 'Branch'],
            ],
            $rows,
            [
                ['label' => 'Receipts', 'value' => count($rows)],
                ['label' => 'Total Received', 'value' => $totalReceived],
            ],
            'Customer payments are money received from sales (income). Supplier and expense payments appear under Purchase reports.',
        );
    }

    /**
     * Customer Settlement — every payment applied to a specific bill (see
     * sale_payment_allocations / the Receive Payment "which bill" picker),
     * full or partial, with the bill number it was applied to. Previously
     * gated on the customer's *overall* balance reaching zero, which hid a
     * payment that fully (or partially) settled one bill while another bill
     * was still open — bill-level settlement is the point of this report
     * now, not the customer's total. General payments not tied to any bill
     * have no bill number to show and are left out. Columns: Customer Name /
     * Bill No / Method / Amount Received.
     *
     * @param  array<string, mixed>  $ctx
     * @return array<string, mixed>
     */
    private function customerSettlement(array $ctx): array
    {
        $allocations = SalePaymentAllocation::query()
            ->join('pos_payments', 'sale_payment_allocations.pos_payment_id', '=', 'pos_payments.id')
            ->join('sales', 'sale_payment_allocations.sale_id', '=', 'sales.id')
            ->leftJoin('customers', 'sales.customer_id', '=', 'customers.id')
            ->where('sales.company_id', $ctx['company_id'])
            ->whereBetween('pos_payments.payment_date', [$ctx['date_from'], $ctx['date_to']])
            ->orderByDesc('pos_payments.payment_date')
            ->orderByDesc('sale_payment_allocations.id')
            ->get([
                'sale_payment_allocations.amount as allocated_amount',
                'sales.sales_id as bill_number',
                'sales.customer_name as customer_name',
                'pos_payments.payment_method as payment_method',
                'pos_payments.cheque_number as cheque_number',
                'pos_payments.bank_name as bank_name',
                'customers.route as route',
            ]);

        $rows = $allocations->map(fn ($a) => [
            'customer' => $a->customer_name ?: 'Customer',
            'bill_number' => $a->bill_number,
            'payment_method' => $a->payment_method,
            'amount_received' => round((float) $a->allocated_amount, 2),
            // Not in the on-screen columns below — used by the Excel export
            // only, which pivots by payment method (see reportTableExcel).
            'cheque_number' => $a->cheque_number,
            'bank_name' => $a->bank_name,
            'route' => $a->route,
        ])->all();

        $totalReceived = round(array_sum(array_column($rows, 'amount_received')), 2);

        return $this->reportPayload(
            $ctx,
            'Customer Settlement',
            [
                ['key' => 'customer', 'label' => 'Customer Name'],
                ['key' => 'bill_number', 'label' => 'Bill No'],
                ['key' => 'payment_method', 'label' => 'Method'],
                ['key' => 'amount_received', 'label' => 'Amount Received'],
            ],
            $rows,
            [
                ['label' => 'Receipts', 'value' => count($rows)],
                ['label' => 'Total Received', 'value' => $totalReceived],
            ],
            'Shows every payment applied to a specific bill, full or partial, with the bill it was applied to. General payments not tied to a bill are not shown here.',
        );
    }

    /**
     * @param  array<string, mixed>  $ctx
     * @return array<string, mixed>
     */
    private function salesByCategory(array $ctx): array
    {
        $saleIds = $this->completedSalesQuery($ctx)
            ->where('transaction_type', OrderTransactionService::TRANSACTION_TYPE_SALE)
            ->pluck('id');

        $itemQuery = SaleItem::query()
            ->join('items', 'sale_items.item_id', '=', 'items.id')
            ->leftJoin('item_categories', 'items.item_category_id', '=', 'item_categories.id')
            ->whereIn('sale_items.sale_id', $saleIds);

        if (!empty($ctx['branch_name'])) {
            $itemQuery->where('items.location', $ctx['branch_name']);
        }

        $categoryExpr = "COALESCE(item_categories.name, items.category, 'Uncategorized')";

        $rows = $itemQuery
            ->select(
                DB::raw("{$categoryExpr} as category"),
                DB::raw('SUM(sale_items.line_total) as total'),
                DB::raw('SUM(sale_items.qty) as qty'),
            )
            ->groupByRaw($categoryExpr)
            ->orderByDesc('total')
            ->get()
            ->map(fn ($r) => [
                'category' => $r->category,
                'qty' => round((float) $r->qty, 2),
                'total' => round((float) $r->total, 2),
            ])
            ->all();

        return $this->reportPayload(
            $ctx,
            'Sales by Category',
            [
                ['key' => 'category', 'label' => 'Category'],
                ['key' => 'qty', 'label' => 'Qty'],
                ['key' => 'total', 'label' => 'Sales'],
            ],
            $rows,
            [['label' => 'Total Sales', 'value' => round(array_sum(array_column($rows, 'total')), 2)]],
        );
    }

    /**
     * @param  array<string, mixed>  $ctx
     * @return array<string, mixed>
     */
    private function customerNetSales(array $ctx): array
    {
        $saleType = OrderTransactionService::TRANSACTION_TYPE_SALE;
        $returnType = OrderTransactionService::TRANSACTION_TYPE_RETURN;

        $rows = $this->completedSalesQuery($ctx)
            ->select(
                'customer_id',
                'customer_name',
                DB::raw("SUM(CASE WHEN transaction_type = '{$saleType}' THEN net_amount ELSE 0 END) as sales"),
                DB::raw("SUM(CASE WHEN transaction_type = '{$returnType}' THEN net_amount ELSE 0 END) as returns"),
            )
            ->groupBy('customer_id', 'customer_name')
            ->orderByDesc(DB::raw(
                "SUM(CASE WHEN transaction_type = '{$saleType}' THEN net_amount ELSE 0 END) - ".
                "SUM(CASE WHEN transaction_type = '{$returnType}' THEN net_amount ELSE 0 END)"
            ))
            ->get()
            ->map(fn ($r) => [
                'customer' => $r->customer_name ?: 'Walk-in',
                'sales' => round((float) $r->sales, 2),
                'returns' => round((float) $r->returns, 2),
                'net' => round((float) $r->sales - (float) $r->returns, 2),
            ])
            ->all();

        return $this->reportPayload(
            $ctx,
            'Customer Net Sales',
            [
                ['key' => 'customer', 'label' => 'Customer'],
                ['key' => 'sales', 'label' => 'Sales'],
                ['key' => 'returns', 'label' => 'Returns'],
                ['key' => 'net', 'label' => 'Net'],
            ],
            $rows,
            [['label' => 'Total Net', 'value' => round(array_sum(array_column($rows, 'net')), 2)]],
        );
    }

    /**
     * @param  array<string, mixed>  $ctx
     * @return array<string, mixed>
     */
    private function expenseSummary(array $ctx): array
    {
        $q = Expense::where('company_id', $ctx['company_id'])
            ->whereBetween('expense_date', [$ctx['date_from'], $ctx['date_to']]);
        $this->applyLocationFilter($q, $ctx);

        $byCategory = (clone $q)
            ->select('category', DB::raw('SUM(amount) as total'), DB::raw('COUNT(*) as cnt'))
            ->groupBy('category')
            ->orderByDesc('total')
            ->get();

        $rows = $byCategory->map(fn ($r) => [
            'category' => $r->category ?: 'Uncategorized',
            'count' => (int) $r->cnt,
            'amount' => round((float) $r->total, 2),
        ])->all();

        $total = round((float) $q->sum('amount'), 2);

        return $this->reportPayload(
            $ctx,
            'Expense Summary',
            [
                ['key' => 'category', 'label' => 'Category'],
                ['key' => 'count', 'label' => 'Count'],
                ['key' => 'amount', 'label' => 'Amount'],
            ],
            $rows,
            [
                ['label' => 'Total Expenses', 'value' => $total],
                ['label' => 'Transactions', 'value' => $q->count()],
            ],
        );
    }

    /**
     * @param  array<string, mixed>  $ctx
     * @return array<string, mixed>
     */
    private function reorderItems(array $ctx): array
    {
        $q = Item::where('company_id', $ctx['company_id'])
            ->where('is_active', true)
            ->where('track_with_inventory', true)
            ->whereColumn('qty', '<=', 'reorder_qty');
        $this->applyLocationFilter($q, $ctx);
        if (!empty($ctx['item_id'])) {
            $q->where('id', $ctx['item_id']);
        }

        $rows = $q->orderBy('qty')->get()->map(fn (Item $i) => [
            'item_number' => $i->item_number,
            'description' => $i->description,
            'location' => $i->location,
            'qty' => round((float) $i->qty, 2),
            'reorder_qty' => round((float) $i->reorder_qty, 2),
        ])->all();

        $itemFilter = $this->resolveItemFilterLabel($ctx);

        return $this->reportPayload(
            $ctx,
            'Reorder Items',
            [
                ['key' => 'item_number', 'label' => 'Item #'],
                ['key' => 'description', 'label' => 'Description'],
                ['key' => 'location', 'label' => 'Branch'],
                ['key' => 'qty', 'label' => 'Qty'],
                ['key' => 'reorder_qty', 'label' => 'Reorder Level'],
            ],
            $rows,
            [['label' => 'Items to Reorder', 'value' => count($rows)]],
            null,
            $itemFilter['id'] ?? null,
            $itemFilter['label'] ?? null,
        );
    }

    /**
     * @param  array<string, mixed>  $ctx
     * @return array<string, mixed>
     */
    private function expiryItems(array $ctx): array
    {
        $q = Item::where('company_id', $ctx['company_id'])
            ->where('is_active', true)
            ->whereNotNull('expiry_date')
            // Previously only checked "<= date_to", so the "from" side of the
            // date range picker had no effect at all — every item expiring
            // before the window opened still showed up. Filtering the full
            // range makes the from/to picker actually do what it implies.
            ->whereBetween('expiry_date', [$ctx['date_from'], $ctx['date_to']]);
        $this->applyLocationFilter($q, $ctx);
        if (!empty($ctx['item_id'])) {
            $q->where('id', $ctx['item_id']);
        }

        $rows = $q->orderBy('expiry_date')->get()->map(fn (Item $i) => [
            'item_number' => $i->item_number,
            'description' => $i->description,
            'location' => $i->location,
            'expiry_date' => $i->expiry_date?->format('Y-m-d'),
            'qty' => round((float) $i->qty, 2),
        ])->all();

        $itemFilter = $this->resolveItemFilterLabel($ctx);

        return $this->reportPayload(
            $ctx,
            'Expiry Items',
            [
                ['key' => 'item_number', 'label' => 'Item #'],
                ['key' => 'description', 'label' => 'Description'],
                ['key' => 'location', 'label' => 'Branch'],
                ['key' => 'expiry_date', 'label' => 'Expiry'],
                ['key' => 'qty', 'label' => 'Qty'],
            ],
            $rows,
            [['label' => 'Expiring / Expired Items', 'value' => count($rows)]],
            null,
            $itemFilter['id'] ?? null,
            $itemFilter['label'] ?? null,
        );
    }

    /**
     * @param  array<string, mixed>  $ctx
     * @return array<string, mixed>
     */
    private function itemList(array $ctx): array
    {
        $q = Item::where('company_id', $ctx['company_id']);
        $this->applyLocationFilter($q, $ctx);
        if (!empty($ctx['item_id'])) {
            $q->where('id', $ctx['item_id']);
        }

        $rows = $q->orderBy('item_number')->get()->map(fn (Item $i) => [
            'item_number' => $i->item_number,
            'description' => $i->description,
            'category' => $i->category,
            'location' => $i->location,
            'qty' => round((float) $i->qty, 2),
            'selling_price' => round((float) $i->selling_price, 2),
            'purchase_price' => round((float) $i->purchase_price, 2),
            'active' => $i->is_active ? 'Yes' : 'No',
        ])->all();

        $itemFilter = $this->resolveItemFilterLabel($ctx);

        return $this->reportPayload(
            $ctx,
            'Item List',
            [
                ['key' => 'item_number', 'label' => 'Item #'],
                ['key' => 'description', 'label' => 'Description'],
                ['key' => 'category', 'label' => 'Category'],
                ['key' => 'location', 'label' => 'Branch'],
                ['key' => 'qty', 'label' => 'Qty'],
                ['key' => 'selling_price', 'label' => 'Sell Price'],
                ['key' => 'purchase_price', 'label' => 'Cost'],
                ['key' => 'active', 'label' => 'Active'],
            ],
            $rows,
            [['label' => 'Total Items', 'value' => count($rows)]],
            null,
            $itemFilter['id'] ?? null,
            $itemFilter['label'] ?? null,
        );
    }

    /**
     * @param  array<string, mixed>  $ctx
     * @return array<string, mixed>
     */
    private function repairItemSummary(array $ctx): array
    {
        $q = Item::where('company_id', $ctx['company_id'])
            ->where('location', RepairService::REPAIR_LOCATION);
        $this->applyLocationFilter($q, $ctx, 'location');

        $rows = $q->orderBy('item_number')->get()->map(fn (Item $i) => [
            'item_number' => $i->item_number,
            'description' => $i->description,
            'category' => $i->category,
            'qty' => round((float) $i->qty, 2),
            'purchase_price' => round((float) $i->purchase_price, 2),
            'selling_price' => round((float) $i->selling_price, 2),
        ])->all();

        $totalValue = array_sum(array_map(
            fn ($r) => (float) $r['qty'] * (float) $r['purchase_price'],
            $rows
        ));

        return $this->reportPayload(
            $ctx,
            'Repair Item Summary',
            [
                ['key' => 'item_number', 'label' => 'Item Number'],
                ['key' => 'description', 'label' => 'Description'],
                ['key' => 'category', 'label' => 'Category'],
                ['key' => 'qty', 'label' => 'Qty'],
                ['key' => 'purchase_price', 'label' => 'Last Purchase Price'],
                ['key' => 'selling_price', 'label' => 'Selling Price'],
            ],
            $rows,
            [
                ['label' => 'Items at Repair', 'value' => count($rows)],
                ['label' => 'Total Qty', 'value' => round(array_sum(array_column($rows, 'qty')), 2)],
                ['label' => 'Total Value', 'value' => round($totalValue, 2)],
            ],
        );
    }

    /**
     * @param  array<string, mixed>  $ctx
     * @return array<string, mixed>
     */
    private function inventoryInOut(array $ctx): array
    {
        $saleIds = $this->completedSalesQuery($ctx)
            ->where('transaction_type', OrderTransactionService::TRANSACTION_TYPE_SALE)
            ->pluck('id');
        $returnIds = $this->completedSalesQuery($ctx)
            ->where('transaction_type', OrderTransactionService::TRANSACTION_TYPE_RETURN)
            ->pluck('id');

        $stockOut = SaleItem::whereIn('sale_id', $saleIds)
            ->select('item_number', 'description', DB::raw('SUM(qty) as qty'), DB::raw('SUM(line_total) as value'))
            ->groupBy('item_number', 'description')
            ->get()
            ->keyBy('item_number');

        $stockInReturns = SaleItem::whereIn('sale_id', $returnIds)
            ->select('item_number', DB::raw('SUM(qty) as qty'))
            ->groupBy('item_number')
            ->get()
            ->keyBy('item_number');

        $purchaseQ = Purchase::where('company_id', $ctx['company_id'])
            ->whereBetween('purchase_date', [$ctx['date_from'], $ctx['date_to']]);
        $this->applyLocationFilter($purchaseQ, $ctx);
        $purchaseIds = $purchaseQ->pluck('id');

        $stockInPurchases = DB::table('purchase_items')
            ->join('items', 'purchase_items.item_id', '=', 'items.id')
            ->whereIn('purchase_items.purchase_id', $purchaseIds)
            ->select('items.item_number', 'items.description', DB::raw('SUM(purchase_items.qty) as qty'))
            ->groupBy('items.item_number', 'items.description')
            ->get()
            ->keyBy('item_number');

        $numbers = collect($stockOut->keys())
            ->merge($stockInReturns->keys())
            ->merge($stockInPurchases->keys())
            ->unique();

        $rows = $numbers->map(function ($num) use ($stockOut, $stockInReturns, $stockInPurchases) {
            $out = $stockOut->get($num);
            $ret = $stockInReturns->get($num);
            $pur = $stockInPurchases->get($num);
            $outQty = round((float) ($out->qty ?? 0), 2);
            $inQty = round((float) ($ret->qty ?? 0) + (float) ($pur->qty ?? 0), 2);

            return [
                'item_number' => $num,
                'description' => $out->description ?? $pur->description ?? '',
                'stock_in' => $inQty,
                'stock_out' => $outQty,
                'net_movement' => round($inQty - $outQty, 2),
            ];
        })->values()->all();

        return $this->reportPayload(
            $ctx,
            'Inventory In / Out',
            [
                ['key' => 'item_number', 'label' => 'Item #'],
                ['key' => 'description', 'label' => 'Description'],
                ['key' => 'stock_in', 'label' => 'Stock In'],
                ['key' => 'stock_out', 'label' => 'Stock Out'],
                ['key' => 'net_movement', 'label' => 'Net'],
            ],
            $rows,
            [],
            'Stock in from purchases and sales returns; stock out from sales.',
        );
    }

    /**
     * @param  array<string, mixed>  $ctx
     * @return array<string, mixed>
     */
    private function inventorySummary(array $ctx): array
    {
        $q = Item::where('company_id', $ctx['company_id'])
            ->where('is_active', true)
            ->where('track_with_inventory', true);
        $this->applyLocationFilter($q, $ctx);

        $items = $q->get();
        $totalQty = round($items->sum(fn ($i) => (float) $i->qty), 2);
        $totalValue = round($items->sum(fn ($i) => (float) $i->qty * (float) $i->purchase_price), 2);

        $rows = $items->take(500)->map(fn (Item $i) => [
            'item_number' => $i->item_number,
            'description' => $i->description,
            'location' => $i->location,
            'qty' => round((float) $i->qty, 2),
            'value' => round((float) $i->qty * (float) $i->purchase_price, 2),
        ])->all();

        return $this->reportPayload(
            $ctx,
            'Inventory Summary',
            [
                ['key' => 'item_number', 'label' => 'Item #'],
                ['key' => 'description', 'label' => 'Description'],
                ['key' => 'location', 'label' => 'Branch'],
                ['key' => 'qty', 'label' => 'Qty'],
                ['key' => 'value', 'label' => 'Value'],
            ],
            $rows,
            [
                ['label' => 'Total Qty', 'value' => $totalQty],
                ['label' => 'Inventory Value (Cost)', 'value' => $totalValue],
            ],
        );
    }

    /**
     * @param  array<string, mixed>  $ctx
     * @return array<string, mixed>
     */
    private function inventoryByCategory(array $ctx): array
    {
        $q = Item::where('company_id', $ctx['company_id'])->where('is_active', true);
        $this->applyLocationFilter($q, $ctx);

        $categoryExpr = "COALESCE(category, 'Uncategorized')";

        $rows = $q
            ->select(
                DB::raw("{$categoryExpr} as category"),
                DB::raw('COUNT(*) as items'),
                DB::raw('SUM(qty) as qty'),
                DB::raw('SUM(qty * purchase_price) as value'),
            )
            ->groupByRaw($categoryExpr)
            ->orderBy('category')
            ->get()
            ->map(fn ($r) => [
                'category' => $r->category,
                'items' => (int) $r->items,
                'qty' => round((float) $r->qty, 2),
                'value' => round((float) $r->value, 2),
            ])
            ->all();

        return $this->reportPayload(
            $ctx,
            'Inventory by Category',
            [
                ['key' => 'category', 'label' => 'Category'],
                ['key' => 'items', 'label' => 'Items'],
                ['key' => 'qty', 'label' => 'Qty'],
                ['key' => 'value', 'label' => 'Value'],
            ],
            $rows,
            [['label' => 'Total Value', 'value' => round(array_sum(array_column($rows, 'value')), 2)]],
        );
    }

    /**
     * @param  array<string, mixed>  $ctx
     * @return array<string, mixed>
     */
    private function nonMovingItems(array $ctx): array
    {
        $soldItemIds = SaleItem::query()
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->where('sales.company_id', $ctx['company_id'])
            ->whereBetween('sales.sale_date', [$ctx['date_from'], $ctx['date_to']])
            ->whereNotNull('sale_items.item_id')
            ->when($ctx['branch_name'], fn ($q) => $q->where('sales.location', $ctx['branch_name']))
            ->distinct()
            ->pluck('sale_items.item_id');

        $q = Item::where('company_id', $ctx['company_id'])
            ->where('is_active', true)
            ->whereNotIn('id', $soldItemIds);
        $this->applyLocationFilter($q, $ctx);

        $rows = $q->orderBy('item_number')->get()->map(fn (Item $i) => [
            'item_number' => $i->item_number,
            'description' => $i->description,
            'location' => $i->location,
            'qty' => round((float) $i->qty, 2),
            'last_sold' => 'No sales in period',
        ])->all();

        return $this->reportPayload(
            $ctx,
            'Non Moving Items',
            [
                ['key' => 'item_number', 'label' => 'Item #'],
                ['key' => 'description', 'label' => 'Description'],
                ['key' => 'location', 'label' => 'Branch'],
                ['key' => 'qty', 'label' => 'Qty'],
                ['key' => 'last_sold', 'label' => 'Status'],
            ],
            $rows,
            [['label' => 'Non-moving Items', 'value' => count($rows)]],
        );
    }

    /**
     * @param  array<string, mixed>  $ctx
     * @return array<string, mixed>
     */
    private function deletedInventorySummary(array $ctx): array
    {
        $logQuery = ActivityLog::query()
            ->where('model_type', 'like', '%Item%')
            ->whereIn('action', ['delete', 'deleted', 'destroy'])
            ->whereBetween('created_at', [
                Carbon::parse($ctx['date_from'])->startOfDay(),
                Carbon::parse($ctx['date_to'])->endOfDay(),
            ]);
        $this->applyActivityLogBranchFilter($logQuery, $ctx);

        $rows = $logQuery
            ->orderByDesc('created_at')
            ->limit(500)
            ->get()
            ->map(fn (ActivityLog $log) => [
                'date' => $log->created_at?->format('Y-m-d H:i'),
                'action' => $log->action,
                'description' => $log->description,
                'model_id' => $log->model_id,
            ])
            ->all();

        return $this->reportPayload(
            $ctx,
            'Deleted Inventory Summary',
            [
                ['key' => 'date', 'label' => 'Date'],
                ['key' => 'action', 'label' => 'Action'],
                ['key' => 'description', 'label' => 'Description'],
                ['key' => 'model_id', 'label' => 'Item ID'],
            ],
            $rows,
            [['label' => 'Deleted Records', 'value' => count($rows)]],
            count($rows) === 0 ? 'No item deletions logged in this period.' : null,
        );
    }

    /**
     * @param  array<string, mixed>  $ctx
     * @return array<string, mixed>
     */
    private function customerList(array $ctx): array
    {
        $q = Customer::where('company_id', $ctx['company_id']);
        $this->applyCustomerLocationFilter($q, $ctx);

        $rows = $q->orderBy('customer_name')->get()->map(fn (Customer $c) => [
            'code' => $c->customer_code,
            'name' => $c->customer_name ?: trim(($c->first_name ?? '').' '.($c->business_name ?? '')),
            'phone' => $c->contact_no,
            'email' => $c->email,
            'balance' => round((float) $c->net_balance, 2),
            'location' => $c->location,
        ])->all();

        return $this->reportPayload(
            $ctx,
            'Customer List',
            [
                ['key' => 'code', 'label' => 'Code'],
                ['key' => 'name', 'label' => 'Name'],
                ['key' => 'phone', 'label' => 'Phone'],
                ['key' => 'email', 'label' => 'Email'],
                ['key' => 'balance', 'label' => 'Balance'],
                ['key' => 'location', 'label' => 'Branch'],
            ],
            $rows,
            [['label' => 'Customers', 'value' => count($rows)]],
        );
    }

    /**
     * @param  array<string, mixed>  $ctx
     * @return array<string, mixed>
     */
    private function customerOutstanding(array $ctx): array
    {
        // Scopes the customer list to who was given credit within the picked
        // date range — the amount shown is still their current outstanding
        // balance (not a historical balance as of that date), since a credit
        // sale's balance carries forward until it's settled.
        $creditCustomerIds = Sale::where('company_id', $ctx['company_id'])
            ->whereBetween('sale_date', [$ctx['date_from'], $ctx['date_to']])
            ->where(function ($sub) {
                $sub->whereNull('order_status')
                    ->orWhere('order_status', OrderTransactionService::ORDER_STATUS_COMPLETED);
            })
            ->where(function ($sub) {
                // Plain Credit sale, or a split-payment sale (payment_method
                // 'Split') with a Credit portion — a split sale's own
                // payment_method never reads 'credit', so it was invisible
                // here before even though it genuinely adds to what's owed.
                $sub->whereRaw('LOWER(TRIM(payment_method)) = ?', ['credit'])
                    ->orWhereHas(
                        'paymentSplits',
                        fn ($sq) => $sq->whereRaw('LOWER(TRIM(payment_method)) = ?', ['credit']),
                    );
            })
            ->whereNotNull('customer_id')
            ->pluck('customer_id')
            ->unique();

        $q = Customer::where('company_id', $ctx['company_id'])
            ->where('net_balance', '>', 0)
            ->whereIn('id', $creditCustomerIds);
        $this->applyCustomerLocationFilter($q, $ctx);

        $rows = $q->orderByDesc('net_balance')->get()->map(fn (Customer $c) => [
            'name' => $c->customer_name,
            'phone' => $c->contact_no,
            'outstanding' => round((float) $c->net_balance, 2),
        ])->all();

        return $this->reportPayload(
            $ctx,
            'Customer Outstanding',
            [
                ['key' => 'name', 'label' => 'Name'],
                ['key' => 'phone', 'label' => 'Phone'],
                ['key' => 'outstanding', 'label' => 'Outstanding'],
            ],
            $rows,
            [['label' => 'Total Outstanding', 'value' => round(array_sum(array_column($rows, 'outstanding')), 2)]],
        );
    }

    /**
     * @param  array<string, mixed>  $ctx
     * @return array<string, mixed>
     */
    private function customerChequeDetails(array $ctx): array
    {
        $sales = $this->completedSalesQuery($ctx)
            ->where(function ($q) {
                $q->where('payment_method', 'like', '%cheque%')
                    ->orWhere(function ($sub) {
                        $sub->whereNotNull('cheque_number')
                            ->where('cheque_number', '!=', '');
                    });
            });

        $rows = $sales->orderByDesc('sale_date')->get()->map(fn (Sale $s) => [
            'date' => $s->sale_date?->format('Y-m-d'),
            'sales_id' => $s->sales_id,
            'customer' => $s->customer_name,
            'cheque_number' => $s->cheque_number,
            'amount' => round((float) $s->net_amount, 2),
            'location' => $s->location,
        ])->all();

        return $this->reportPayload(
            $ctx,
            'Customer Cheque Details',
            [
                ['key' => 'date', 'label' => 'Date'],
                ['key' => 'sales_id', 'label' => 'Sales ID'],
                ['key' => 'customer', 'label' => 'Customer'],
                ['key' => 'cheque_number', 'label' => 'Cheque #'],
                ['key' => 'amount', 'label' => 'Amount'],
                ['key' => 'location', 'label' => 'Branch'],
            ],
            $rows,
            [['label' => 'Total', 'value' => round(array_sum(array_column($rows, 'amount')), 2)]],
        );
    }

    /**
     * @param  array<string, mixed>  $ctx
     * @return array<string, mixed>
     */
    private function customerAging(array $ctx): array
    {
        $q = Customer::where('company_id', $ctx['company_id'])
            ->where('net_balance', '>', 0);
        $this->applyCustomerLocationFilter($q, $ctx);

        $rows = $q->orderByDesc('net_balance')
            ->get()
            ->map(fn (Customer $c) => [
                'customer' => $c->customer_name,
                'balance' => round((float) $c->net_balance, 2),
                'bucket_0_30' => round((float) $c->net_balance, 2),
                'bucket_31_60' => 0,
                'bucket_61_90' => 0,
                'bucket_90_plus' => 0,
            ])
            ->all();

        return $this->reportPayload(
            $ctx,
            'Customer Aging',
            [
                ['key' => 'customer', 'label' => 'Customer'],
                ['key' => 'balance', 'label' => 'Total'],
                ['key' => 'bucket_0_30', 'label' => 'Current'],
                ['key' => 'bucket_31_60', 'label' => '31-60'],
                ['key' => 'bucket_61_90', 'label' => '61-90'],
                ['key' => 'bucket_90_plus', 'label' => '90+'],
            ],
            $rows,
            [['label' => 'Total Receivable', 'value' => round(array_sum(array_column($rows, 'balance')), 2)]],
            'Aging buckets use current balance until invoice-level due dates are tracked.',
        );
    }

    /**
     * @param  array<string, mixed>  $ctx
     * @return array<string, mixed>
     */
    private function customerSummary(array $ctx): array
    {
        $base = Customer::where('company_id', $ctx['company_id']);
        $this->applyCustomerLocationFilter($base, $ctx);

        $total = (clone $base)->count();
        $withBalance = (clone $base)->where('net_balance', '>', 0)->count();
        $totalBalance = round((float) (clone $base)->sum('net_balance'), 2);

        return $this->reportPayload(
            $ctx,
            'Customer Summary',
            [
                ['key' => 'metric', 'label' => 'Metric'],
                ['key' => 'value', 'label' => 'Value'],
            ],
            [
                ['metric' => 'Total Customers', 'value' => $total],
                ['metric' => 'Customers with Balance', 'value' => $withBalance],
                ['metric' => 'Total Net Balance', 'value' => $totalBalance],
            ],
            [
                ['label' => 'Total Customers', 'value' => $total],
                ['label' => 'With Outstanding', 'value' => $withBalance],
            ],
        );
    }

    /**
     * @param  array<string, mixed>  $ctx
     * @return array<string, mixed>
     */
    private function customerActivity(array $ctx): array
    {
        $data = $this->customerNetSales($ctx);
        $data['title'] = 'Customer Activity';

        return $data;
    }

    /**
     * @param  array<string, mixed>  $ctx
     * @return array<string, mixed>
     */
    private function supplierDetail(array $ctx): array
    {
        $q = Supplier::where('company_id', $ctx['company_id']);
        $this->applyLocationFilter($q, $ctx);

        $rows = $q->orderBy('supplier_code')->get()->map(fn (Supplier $s) => [
            'code' => $s->supplier_code,
            'name' => trim(($s->first_name ?? '')),
            'phone' => $s->phone,
            'email' => $s->email,
            'balance' => round((float) $s->net_balance, 2),
            'location' => $s->location,
        ])->all();

        return $this->reportPayload(
            $ctx,
            'Supplier Detail',
            [
                ['key' => 'code', 'label' => 'Code'],
                ['key' => 'name', 'label' => 'Name'],
                ['key' => 'phone', 'label' => 'Phone'],
                ['key' => 'email', 'label' => 'Email'],
                ['key' => 'balance', 'label' => 'Balance'],
                ['key' => 'location', 'label' => 'Branch'],
            ],
            $rows,
            [['label' => 'Suppliers', 'value' => count($rows)]],
        );
    }

    /**
     * @param  array<string, mixed>  $ctx
     * @return array<string, mixed>
     */
    private function supplierActivity(array $ctx): array
    {
        $q = Purchase::where('company_id', $ctx['company_id'])
            ->whereBetween('purchase_date', [$ctx['date_from'], $ctx['date_to']]);
        $this->applyLocationFilter($q, $ctx);

        $rows = $q
            ->select('supplier_id', 'supplier_name', DB::raw('COUNT(*) as orders'), DB::raw('SUM(amount) as total'))
            ->groupBy('supplier_id', 'supplier_name')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($r) => [
                'supplier' => $r->supplier_name ?: 'Unknown',
                'orders' => (int) $r->orders,
                'total' => round((float) $r->total, 2),
            ])
            ->all();

        return $this->reportPayload(
            $ctx,
            'Supplier Activity',
            [
                ['key' => 'supplier', 'label' => 'Supplier'],
                ['key' => 'orders', 'label' => 'Orders'],
                ['key' => 'total', 'label' => 'Amount'],
            ],
            $rows,
            [['label' => 'Purchase Total', 'value' => round(array_sum(array_column($rows, 'total')), 2)]],
        );
    }

    /**
     * @param  array<string, mixed>  $ctx
     * @return array<string, mixed>
     */
    private function supplierPurchase(array $ctx): array
    {
        $data = $this->supplierActivity($ctx);
        $data['title'] = 'Supplier Purchase';

        return $data;
    }

    /**
     * @param  array<string, mixed>  $ctx
     * @return array<string, mixed>
     */
    private function purchaseDetails(array $ctx, ?string $purchaseType): array
    {
        $q = Purchase::where('company_id', $ctx['company_id'])
            ->whereBetween('purchase_date', [$ctx['date_from'], $ctx['date_to']]);
        $this->applyLocationFilter($q, $ctx);
        if ($purchaseType) {
            $q->where('purchase_type', $purchaseType);
        }

        $title = match ($purchaseType) {
            self::PURCHASE_TYPE_RETURN => 'Purchase Return',
            self::PURCHASE_TYPE_ORDER => 'Purchase Order',
            default => 'Purchase Details',
        };

        $rows = $q->orderByDesc('purchase_date')->get()->map(fn (Purchase $p) => [
            'date' => $p->purchase_date?->format('Y-m-d'),
            'invoice_id' => $p->invoice_id,
            'supplier' => $p->supplier_name,
            'type' => $p->purchase_type,
            'location' => $p->location,
            'amount' => round((float) $p->amount, 2),
            'payment_method' => $p->payment_method,
        ])->all();

        return $this->reportPayload(
            $ctx,
            $title,
            [
                ['key' => 'date', 'label' => 'Date'],
                ['key' => 'invoice_id', 'label' => 'Invoice'],
                ['key' => 'supplier', 'label' => 'Supplier'],
                ['key' => 'type', 'label' => 'Type'],
                ['key' => 'location', 'label' => 'Branch'],
                ['key' => 'amount', 'label' => 'Amount'],
                ['key' => 'payment_method', 'label' => 'Payment'],
            ],
            $rows,
            [
                ['label' => 'Transactions', 'value' => count($rows)],
                ['label' => 'Total', 'value' => round(array_sum(array_column($rows, 'amount')), 2)],
            ],
        );
    }

    /**
     * @param  array<string, mixed>  $ctx
     * @return array<string, mixed>
     */
    private function supplierPayments(array $ctx, bool $chequeOnly): array
    {
        $q = $this->outgoingPaymentsQuery($ctx)
            ->where(function ($sub) {
                $sub->where('receipt_type', 'like', '%Purchase%')
                    ->orWhere('source_type', PaymentService::SOURCE_PURCHASE);
            });
        if ($chequeOnly) {
            $q->where('payment_method', 'like', '%cheque%');
        }

        $rows = $q->orderByDesc('payment_date')->get()->map(fn (PosPayment $p) => [
            'date' => $p->payment_date?->format('Y-m-d'),
            'reference' => $p->sales_no,
            'method' => $p->payment_method,
            'direction' => 'Paid Out',
            'amount' => round((float) $p->paid_amount, 2),
            'location' => $p->location,
        ])->all();

        return $this->reportPayload(
            $ctx,
            $chequeOnly ? 'Supplier Cheque Payment Details' : 'Supplier Payment',
            [
                ['key' => 'date', 'label' => 'Date'],
                ['key' => 'reference', 'label' => 'Reference'],
                ['key' => 'method', 'label' => 'Method'],
                ['key' => 'amount', 'label' => 'Amount'],
                ['key' => 'location', 'label' => 'Branch'],
            ],
            $rows,
            [['label' => 'Total Paid', 'value' => round(array_sum(array_column($rows, 'amount')), 2)]],
        );
    }

    /**
     * @param  array<string, mixed>  $ctx
     * @return array<string, mixed>
     */
    private function cashInHand(array $ctx): array
    {
        $cashSales = round((float) $this->completedSalesQuery($ctx)
            ->where('transaction_type', OrderTransactionService::TRANSACTION_TYPE_SALE)
            ->where('payment_method', 'like', '%cash%')
            ->sum('net_amount'), 2);
        $cashExpenses = round((float) Expense::where('company_id', $ctx['company_id'])
            ->whereBetween('expense_date', [$ctx['date_from'], $ctx['date_to']])
            ->when($ctx['branch_name'], fn ($q) => $q->where('location', $ctx['branch_name']))
            ->where('payment_method', 'like', '%cash%')
            ->sum('amount'), 2);
        $cashPaidOut = round((float) $this->outgoingPaymentsQuery($ctx)
            ->where('payment_method', 'like', '%cash%')
            ->sum('paid_amount'), 2);
        $cashPurchaseReturns = round((float) $this->incomingPaymentsQuery($ctx)
            ->where('source_type', PaymentService::SOURCE_PURCHASE)
            ->whereRaw('LOWER(COALESCE(receipt_type, "")) = ?', ['return'])
            ->where('payment_method', 'like', '%cash%')
            ->sum('paid_amount'), 2);

        $net = round($cashSales - $cashExpenses - $cashPaidOut + $cashPurchaseReturns, 2);

        return $this->reportPayload(
            $ctx,
            'Cash in Hand',
            [
                ['key' => 'item', 'label' => 'Item'],
                ['key' => 'amount', 'label' => 'Amount'],
            ],
            [
                ['item' => 'Cash Sales (Income)', 'amount' => $cashSales],
                ['item' => 'Cash Expenses', 'amount' => -$cashExpenses],
                ['item' => 'Cash Paid Out (Purchase/Supplier)', 'amount' => -$cashPaidOut],
                ['item' => 'Cash Purchase Returns (Refund In)', 'amount' => $cashPurchaseReturns],
                ['item' => 'Estimated Cash in Hand', 'amount' => $net],
            ],
            [['label' => 'Net Cash Position', 'value' => $net]],
            'Customer sale payments are included in Cash Sales (income), not subtracted as payouts.',
        );
    }

    /**
     * @param  array<string, mixed>  $ctx
     * @return array<string, mixed>
     */
    private function soldItemsProfit(array $ctx): array
    {
        $saleIds = $this->completedSalesQuery($ctx)
            ->where('transaction_type', OrderTransactionService::TRANSACTION_TYPE_SALE)
            ->pluck('id');

        $rows = SaleItem::whereIn('sale_id', $saleIds)
            ->select(
                'item_number',
                'description',
                DB::raw('SUM(qty) as qty'),
                DB::raw('SUM(line_total) as revenue'),
                DB::raw('SUM(qty * COALESCE(purchase_price, 0)) as cost'),
            )
            ->groupBy('item_number', 'description')
            ->orderByDesc('revenue')
            ->get()
            ->map(fn ($r) => [
                'item_number' => $r->item_number,
                'description' => $r->description,
                'qty' => round((float) $r->qty, 2),
                'revenue' => round((float) $r->revenue, 2),
                'cost' => round((float) $r->cost, 2),
                'profit' => round((float) $r->revenue - (float) $r->cost, 2),
            ])
            ->all();

        return $this->reportPayload(
            $ctx,
            'Sold Items Profit',
            [
                ['key' => 'item_number', 'label' => 'Item #'],
                ['key' => 'description', 'label' => 'Description'],
                ['key' => 'qty', 'label' => 'Qty'],
                ['key' => 'revenue', 'label' => 'Revenue'],
                ['key' => 'cost', 'label' => 'Cost'],
                ['key' => 'profit', 'label' => 'Profit'],
            ],
            $rows,
            [['label' => 'Total Profit', 'value' => round(array_sum(array_column($rows, 'profit')), 2)]],
        );
    }

    /**
     * @param  array<string, mixed>  $ctx
     * @return array<string, mixed>
     */
    private function incomeExpenses(array $ctx): array
    {
        $sales = round((float) $this->completedSalesQuery($ctx)
            ->where('transaction_type', OrderTransactionService::TRANSACTION_TYPE_SALE)
            ->sum('net_amount'), 2);
        $returns = round((float) $this->completedSalesQuery($ctx)
            ->where('transaction_type', OrderTransactionService::TRANSACTION_TYPE_RETURN)
            ->sum('net_amount'), 2);
        $customerPayments = $this->sumIncomingPayments($ctx);
        $expenses = round((float) Expense::where('company_id', $ctx['company_id'])
            ->whereBetween('expense_date', [$ctx['date_from'], $ctx['date_to']])
            ->when($ctx['branch_name'], fn ($q) => $q->where('location', $ctx['branch_name']))
            ->sum('amount'), 2);
        $paymentsPaidOut = $this->sumOutgoingPayments($ctx);
        $net = round($sales - $returns - $expenses - $paymentsPaidOut, 2);

        return $this->reportPayload(
            $ctx,
            'Income & Expenses',
            [
                ['key' => 'type', 'label' => 'Type'],
                ['key' => 'amount', 'label' => 'Amount'],
            ],
            [
                ['type' => 'Gross Sales (Income)', 'amount' => $sales],
                ['type' => 'Customer Payments Received', 'amount' => $customerPayments],
                ['type' => 'Sales Returns', 'amount' => -$returns],
                ['type' => 'Expenses', 'amount' => -$expenses],
                ['type' => 'Payments Paid Out (Supplier/Expense)', 'amount' => -$paymentsPaidOut],
                ['type' => 'Net Income', 'amount' => $net],
            ],
            [
                ['label' => 'Sales Income', 'value' => $sales],
                ['label' => 'Customer Payments', 'value' => $customerPayments],
                ['label' => 'Paid Out', 'value' => -$paymentsPaidOut],
                ['label' => 'Net Income', 'value' => $net],
            ],
            'Income: sales and customer receipts. Outcome: expenses and supplier/salary payments only.',
        );
    }

    /**
     * @param  array<string, mixed>  $ctx
     * @return array<string, mixed>
     */
    private function inventoryCosting(array $ctx): array
    {
        return $this->inventorySummary($ctx);
    }

    /**
     * @param  array<string, mixed>  $ctx
     * @return array<string, mixed>
     */
    private function endOfDay(array $ctx): array
    {
        $date = $ctx['date_to'];
        $dayCtx = array_merge($ctx, ['date_from' => $date, 'date_to' => $date]);
        $summary = $this->salesSummary($dayCtx);
        $expenses = $this->expenseSummary($dayCtx);

        return $this->reportPayload(
            $ctx,
            'End of Day Report',
            [
                ['key' => 'metric', 'label' => 'Metric'],
                ['key' => 'value', 'label' => 'Value'],
            ],
            array_merge(
                array_map(fn ($s) => ['metric' => $s['label'], 'value' => $s['value']], $summary['summary']),
                array_map(fn ($s) => ['metric' => 'Expense: '.$s['label'], 'value' => $s['value']], $expenses['summary']),
            ),
            $summary['summary'],
            'End of day uses the report end date as the business day.',
        );
    }

    /**
     * @param  array<string, mixed>  $ctx
     * @return array<string, mixed>
     */
    private function auditReport(array $ctx): array
    {
        $logQuery = ActivityLog::query()
            ->whereBetween('created_at', [
                Carbon::parse($ctx['date_from'])->startOfDay(),
                Carbon::parse($ctx['date_to'])->endOfDay(),
            ]);
        $this->applyActivityLogBranchFilter($logQuery, $ctx);

        $rows = $logQuery
            ->orderByDesc('created_at')
            ->limit(1000)
            ->get()
            ->map(fn (ActivityLog $log) => [
                'date' => $log->created_at?->format('Y-m-d H:i'),
                'user_id' => $log->user_id,
                'action' => $log->action,
                'model' => $log->model_type,
                'description' => $log->description,
            ])
            ->all();

        return $this->reportPayload(
            $ctx,
            'Audit Report',
            [
                ['key' => 'date', 'label' => 'Date'],
                ['key' => 'user_id', 'label' => 'User'],
                ['key' => 'action', 'label' => 'Action'],
                ['key' => 'model', 'label' => 'Model'],
                ['key' => 'description', 'label' => 'Description'],
            ],
            $rows,
            [['label' => 'Log Entries', 'value' => count($rows)]],
            !empty($ctx['branch_name']) ? 'Audit entries are limited to transactions at the selected branch.' : null,
        );
    }

    /**
     * @param  array<string, mixed>  $ctx
     * @return array<string, mixed>
     */
    private function transactionSummary(array $ctx): array
    {
        $salesCount = $this->completedSalesQuery($ctx)->count();
        $purchaseCount = Purchase::where('company_id', $ctx['company_id'])
            ->whereBetween('purchase_date', [$ctx['date_from'], $ctx['date_to']])
            ->when($ctx['branch_name'], fn ($q) => $q->where('location', $ctx['branch_name']))
            ->count();
        $paymentCount = PosPayment::where('company_id', $ctx['company_id'])
            ->whereBetween('payment_date', [$ctx['date_from'], $ctx['date_to']])
            ->when($ctx['branch_name'], fn ($q) => $q->where('location', $ctx['branch_name']))
            ->count();
        $expenseCount = Expense::where('company_id', $ctx['company_id'])
            ->whereBetween('expense_date', [$ctx['date_from'], $ctx['date_to']])
            ->when($ctx['branch_name'], fn ($q) => $q->where('location', $ctx['branch_name']))
            ->count();

        return $this->reportPayload(
            $ctx,
            'Transaction Summary',
            [
                ['key' => 'type', 'label' => 'Transaction Type'],
                ['key' => 'count', 'label' => 'Count'],
            ],
            [
                ['type' => 'Sales & Returns', 'count' => $salesCount],
                ['type' => 'Purchases', 'count' => $purchaseCount],
                ['type' => 'Payments', 'count' => $paymentCount],
                ['type' => 'Expenses', 'count' => $expenseCount],
            ],
            [['label' => 'Total Transactions', 'value' => $salesCount + $purchaseCount + $paymentCount + $expenseCount]],
        );
    }
}
