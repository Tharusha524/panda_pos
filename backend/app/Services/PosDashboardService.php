<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Expense;
use App\Models\Item;
use App\Models\PosPayment;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\Shipment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class PosDashboardService
{
    public function __construct(private CompanySettingService $companySettingService)
    {
    }

    private function completedSalesQuery(int $companyId)
    {
        return Sale::where('company_id', $companyId)
            ->where(function ($q) {
                $q->whereNull('order_status')
                    ->orWhere('order_status', OrderTransactionService::ORDER_STATUS_COMPLETED);
            });
    }

    private function retailSalesQuery(int $companyId)
    {
        return $this->completedSalesQuery($companyId)
            ->where('transaction_type', OrderTransactionService::TRANSACTION_TYPE_SALE);
    }

    private function returnSalesQuery(int $companyId)
    {
        return $this->completedSalesQuery($companyId)
            ->where('transaction_type', OrderTransactionService::TRANSACTION_TYPE_RETURN);
    }

    public function getOverviewForUser(User $user): array
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $companyId = $company->id;
        $today = now()->toDateString();
        $monthStart = now()->startOfMonth()->toDateString();

        $todayRetailQuery = $this->retailSalesQuery($companyId)->whereDate('sale_date', $today);
        $todayReturnsQuery = $this->returnSalesQuery($companyId)->whereDate('sale_date', $today);
        $monthRetailQuery = $this->retailSalesQuery($companyId)->whereDate('sale_date', '>=', $monthStart);

        $todaySalesAmount = round((float) $todayRetailQuery->sum('net_amount'), 2);
        $todayReturnsAmount = round((float) $todayReturnsQuery->sum('net_amount'), 2);
        $todayNetSalesAmount = round($todaySalesAmount - $todayReturnsAmount, 2);
        $todaySalesCount = $todayRetailQuery->count();
        $todayReturnsCount = $todayReturnsQuery->count();
        $monthSalesAmount = round((float) $monthRetailQuery->sum('net_amount'), 2);

        $todayPurchasesQuery = Purchase::where('company_id', $companyId)->whereDate('purchase_date', $today);
        $todayPurchasesAmount = round((float) $todayPurchasesQuery->sum('amount'), 2);
        $todayPurchasesCount = $todayPurchasesQuery->count();

        $todayExpensesAmount = round((float) Expense::where('company_id', $companyId)
            ->whereDate('expense_date', $today)
            ->sum('amount'), 2);

        $todayPaymentsAmount = round((float) PosPayment::where('company_id', $companyId)
            ->whereDate('payment_date', $today)
            ->sum('paid_amount'), 2);

        $holdOrdersCount = Sale::where('company_id', $companyId)
            ->where('order_status', 'hold')
            ->count();

        $activeItems = Item::where('company_id', $companyId)->where('is_active', true)->count();
        $lowStockCount = Item::where('company_id', $companyId)
            ->where('is_active', true)
            ->where('track_with_inventory', true)
            ->whereColumn('qty', '<=', 'reorder_qty')
            ->count();

        $customersCount = Customer::where('company_id', $companyId)->count();
        $debtorQuery = Customer::where('company_id', $companyId)->where('net_balance', '>', 0);
        $debtorCount = $debtorQuery->count();
        $totalReceivables = round((float) $debtorQuery->sum('net_balance'), 2);
        $shipmentsToday = Shipment::where('company_id', $companyId)->whereDate('shipment_date', $today)->count();

        return [
            'generated_at' => now()->format('Y-m-d H:i:s'),
            'metrics' => [
                'today_sales_amount' => $todaySalesAmount,
                'today_sales_count' => $todaySalesCount,
                'today_returns_amount' => $todayReturnsAmount,
                'today_returns_count' => $todayReturnsCount,
                'today_net_sales_amount' => $todayNetSalesAmount,
                'month_sales_amount' => $monthSalesAmount,
                'today_purchases_amount' => $todayPurchasesAmount,
                'today_purchases_count' => $todayPurchasesCount,
                'today_expenses_amount' => $todayExpensesAmount,
                'today_payments_amount' => $todayPaymentsAmount,
                'hold_orders_count' => $holdOrdersCount,
                'active_items' => $activeItems,
                'low_stock_count' => $lowStockCount,
                'customers_count' => $customersCount,
                'debtor_count' => $debtorCount,
                'total_receivables' => $totalReceivables,
                'shipments_today' => $shipmentsToday,
            ],
            'sales_chart' => $this->salesChartLast7Days($companyId),
            'recent_transactions' => $this->recentTransactions($companyId),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function salesChartLast7Days(int $companyId): array
    {
        $start = now()->subDays(6)->startOfDay();
        $saleType = OrderTransactionService::TRANSACTION_TYPE_SALE;
        $rows = Sale::where('company_id', $companyId)
            ->whereDate('sale_date', '>=', $start->toDateString())
            ->where(function ($q) {
                $q->whereNull('order_status')
                    ->orWhere('order_status', OrderTransactionService::ORDER_STATUS_COMPLETED);
            })
            ->select(
                DB::raw('DATE(sale_date) as day'),
                DB::raw("SUM(CASE WHEN transaction_type = '{$saleType}' THEN net_amount ELSE 0 END) as total"),
                DB::raw("SUM(CASE WHEN transaction_type = '{$saleType}' THEN 1 ELSE 0 END) as orders"),
            )
            ->groupBy(DB::raw('DATE(sale_date)'))
            ->orderBy('day')
            ->get()
            ->keyBy(fn ($r) => $r->day);

        $chart = [];
        for ($i = 0; $i < 7; $i++) {
            $day = $start->copy()->addDays($i);
            $key = $day->format('Y-m-d');
            $row = $rows->get($key);
            $chart[] = [
                'date' => $key,
                'label' => $day->format('D'),
                'sales_amount' => round((float) ($row->total ?? 0), 2),
                'orders' => (int) ($row->orders ?? 0),
            ];
        }

        return $chart;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function recentTransactions(int $companyId): array
    {
        $transactions = [];

        $sales = Sale::where('company_id', $companyId)
            ->orderByDesc('created_at')
            ->limit(8)
            ->get([
                'id',
                'sales_id',
                'customer_name',
                'net_amount',
                'sale_date',
                'order_status',
                'payment_method',
                'transaction_type',
                'created_at',
            ]);

        foreach ($sales as $sale) {
            $isReturn = OrderTransactionService::isSalesReturn($sale->transaction_type);
            $transactions[] = [
                'type' => $isReturn ? 'return' : 'sale',
                'id' => $sale->id,
                'reference' => $sale->sales_id,
                'party' => $sale->customer_name,
                'amount' => (float) $sale->net_amount,
                'date' => $sale->sale_date?->format('Y-m-d'),
                'status' => $sale->order_status ?? 'completed',
                'payment_method' => $sale->payment_method,
                'created_at' => $sale->created_at?->format('Y-m-d H:i:s'),
            ];
        }

        $purchases = Purchase::where('company_id', $companyId)
            ->orderByDesc('created_at')
            ->limit(6)
            ->get(['id', 'invoice_id', 'supplier_name', 'amount', 'purchase_date', 'created_at']);

        foreach ($purchases as $purchase) {
            $transactions[] = [
                'type' => 'purchase',
                'id' => $purchase->id,
                'reference' => $purchase->invoice_id,
                'party' => $purchase->supplier_name,
                'amount' => (float) $purchase->amount,
                'date' => $purchase->purchase_date?->format('Y-m-d'),
                'status' => 'completed',
                'payment_method' => null,
                'created_at' => $purchase->created_at?->format('Y-m-d H:i:s'),
            ];
        }

        $payments = PosPayment::where('company_id', $companyId)
            ->orderByDesc('created_at')
            ->limit(6)
            ->get(['id', 'sales_no', 'receipt_type', 'paid_amount', 'payment_date', 'payment_method', 'created_at']);

        foreach ($payments as $payment) {
            $transactions[] = [
                'type' => 'payment',
                'id' => $payment->id,
                'reference' => $payment->sales_no,
                'party' => $payment->receipt_type,
                'amount' => (float) $payment->paid_amount,
                'date' => $payment->payment_date?->format('Y-m-d'),
                'status' => 'completed',
                'payment_method' => $payment->payment_method,
                'created_at' => $payment->created_at?->format('Y-m-d H:i:s'),
            ];
        }

        $expenses = Expense::where('company_id', $companyId)
            ->orderByDesc('created_at')
            ->limit(6)
            ->get(['id', 'reference_no', 'category', 'description', 'amount', 'expense_date', 'created_at']);

        foreach ($expenses as $expense) {
            $transactions[] = [
                'type' => 'expense',
                'id' => $expense->id,
                'reference' => $expense->reference_no,
                'party' => $expense->category ?: $expense->description,
                'amount' => (float) $expense->amount,
                'date' => $expense->expense_date?->format('Y-m-d'),
                'status' => $expense->status ?? 'completed',
                'payment_method' => null,
                'created_at' => $expense->created_at?->format('Y-m-d H:i:s'),
            ];
        }

        usort($transactions, fn ($a, $b) => strcmp($b['created_at'] ?? '', $a['created_at'] ?? ''));

        return array_slice($transactions, 0, 20);
    }

    /**
     * Tabular data for mobile "Today's activity" screen.
     *
     * @return array<string, mixed>
     */
    public function getTodayTablesForUser(User $user): array
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $companyId = $company->id;
        $today = now()->toDateString();

        $sales = Sale::where('company_id', $companyId)
            ->whereDate('sale_date', $today)
            ->where(function ($q) {
                $q->whereNull('order_status')
                    ->orWhereIn('order_status', ['completed', 'hold']);
            })
            ->orderByDesc('created_at')
            ->get([
                'id',
                'sales_id',
                'customer_name',
                'location',
                'net_amount',
                'payment_method',
                'order_status',
                'transaction_type',
                'sale_date',
                'created_at',
            ]);

        $todaySales = $sales->map(fn (Sale $sale) => [
            'id' => $sale->id,
            'sales_id' => $sale->sales_id,
            'customer_name' => $sale->customer_name,
            'location' => $sale->location,
            'amount' => round((float) $sale->net_amount, 2),
            'payment_method' => $sale->payment_method,
            'status' => $sale->order_status ?? 'completed',
            'transaction_type' => $sale->transaction_type,
            'sale_date' => $sale->sale_date?->format('Y-m-d'),
            'time' => $sale->created_at?->format('H:i'),
        ])->values()->all();

        $purchases = Purchase::where('company_id', $companyId)
            ->whereDate('purchase_date', $today)
            ->orderByDesc('created_at')
            ->get([
                'id',
                'invoice_id',
                'supplier_name',
                'location',
                'amount',
                'payment_method',
                'purchase_date',
                'created_at',
            ]);

        $todayPurchases = $purchases->map(fn (Purchase $purchase) => [
            'id' => $purchase->id,
            'invoice_id' => $purchase->invoice_id,
            'supplier_name' => $purchase->supplier_name,
            'location' => $purchase->location,
            'amount' => round((float) $purchase->amount, 2),
            'payment_method' => $purchase->payment_method,
            'purchase_date' => $purchase->purchase_date?->format('Y-m-d'),
            'time' => $purchase->created_at?->format('H:i'),
        ])->values()->all();

        $reorderRows = Item::where('company_id', $companyId)
            ->where('is_active', true)
            ->where('track_with_inventory', true)
            ->where('reorder_qty', '>', 0)
            ->whereColumn('qty', '<=', 'reorder_qty')
            ->orderBy('qty')
            ->orderBy('description')
            ->limit(200)
            ->get([
                'id',
                'item_number',
                'description',
                'qty',
                'reorder_qty',
                'location',
                'uom',
            ]);

        $reorderItems = $reorderRows->map(fn (Item $item) => [
            'id' => $item->id,
            'item_number' => $item->item_number,
            'description' => $item->description,
            'qty' => (float) ($item->qty ?? 0),
            'reorder_qty' => (float) ($item->reorder_qty ?? 0),
            'location' => $item->location,
            'uom' => $item->uom,
        ])->values()->all();

        $retailRows = array_values(array_filter(
            $todaySales,
            fn (array $row) => !OrderTransactionService::isSalesReturn($row['transaction_type'] ?? null),
        ));
        $returnRows = array_values(array_filter(
            $todaySales,
            fn (array $row) => OrderTransactionService::isSalesReturn($row['transaction_type'] ?? null),
        ));
        $todayRetailAmount = round(array_sum(array_column($retailRows, 'amount')), 2);
        $todayReturnsAmount = round(array_sum(array_column($returnRows, 'amount')), 2);

        return [
            'date' => $today,
            'generated_at' => now()->format('Y-m-d H:i:s'),
            'summary' => [
                'today_sales_count' => count($retailRows),
                'today_sales_amount' => $todayRetailAmount,
                'today_returns_count' => count($returnRows),
                'today_returns_amount' => $todayReturnsAmount,
                'today_net_sales_amount' => round($todayRetailAmount - $todayReturnsAmount, 2),
                'today_purchases_count' => count($todayPurchases),
                'today_purchases_amount' => round(array_sum(array_column($todayPurchases, 'amount')), 2),
                'reorder_items_count' => count($reorderItems),
            ],
            'today_sales' => $todaySales,
            'today_purchases' => $todayPurchases,
            'reorder_items' => $reorderItems,
        ];
    }
}
