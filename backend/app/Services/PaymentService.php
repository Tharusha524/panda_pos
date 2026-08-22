<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Customer;
use App\Models\Employee;
use App\Models\Expense;
use App\Models\PosPayment;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Services\OrderTransactionService;
use App\Models\User;
use Exception;

class PaymentService
{
    public const SOURCE_PURCHASE = 'purchase';

    public const SOURCE_SALARY = 'salary';

    public const SOURCE_EXPENSE = 'expense';

    public const SOURCE_SALE = 'sale';

    public const SOURCE_CUSTOMER_PAYMENT = 'customer_payment';

    private const DEFAULT_PAYMENT_TYPES = ['1008', '1009', '1010'];

    private const DEFAULT_PAYMENT_METHODS = [
        'Cash',
        'Card',
        'Cheque',
        'Credit',
        'Bank Transfer',
        'Online',
    ];

    private const DEFAULT_RECEIPT_TYPES = ['Sale', 'Return', 'Credit Note', 'Advance', 'Purchase', 'Salary', 'Expense', 'Customer Payment'];

    public static function defaultPaymentMethods(): array
    {
        return self::DEFAULT_PAYMENT_METHODS;
    }

    public function __construct(private CompanySettingService $companySettingService)
    {
    }

    public function getAllForUser(
        User $user,
        ?string $paymentMethod = null,
        ?string $paymentType = null,
        ?string $location = null,
        ?string $dateFrom = null,
        ?string $dateTo = null,
    ): array {
        $company = $this->companySettingService->getCompanyForUser($user);
        $companyId = $company->id;

        $query = PosPayment::where('company_id', $companyId);

        if ($paymentMethod && $paymentMethod !== 'all' && $paymentMethod !== '.*') {
            $query->where('payment_method', $paymentMethod);
        }

        if ($paymentType && $paymentType !== 'all') {
            $query->where('payment_type', $paymentType);
        }

        if ($location && $location !== 'all') {
            $query->where('location', $location);
        }

        if ($dateFrom) {
            $query->whereDate('payment_date', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate('payment_date', '<=', $dateTo);
        }

        $payments = $query
            ->orderByDesc('payment_date')
            ->orderByDesc('id')
            ->get()
            ->map(fn (PosPayment $p) => $this->formatPayment($p));

        $summaryQuery = PosPayment::where('company_id', $companyId);
        if ($paymentMethod && $paymentMethod !== 'all' && $paymentMethod !== '.*') {
            $summaryQuery->where('payment_method', $paymentMethod);
        }
        if ($paymentType && $paymentType !== 'all') {
            $summaryQuery->where('payment_type', $paymentType);
        }
        if ($location && $location !== 'all') {
            $summaryQuery->where('location', $location);
        }
        if ($dateFrom) {
            $summaryQuery->whereDate('payment_date', '>=', $dateFrom);
        }
        if ($dateTo) {
            $summaryQuery->whereDate('payment_date', '<=', $dateTo);
        }

        $receivedQuery = (clone $summaryQuery)->where(function ($q) {
            $q->where(function ($saleIncome) {
                $saleIncome->where('source_type', self::SOURCE_SALE)
                    ->where(function ($sub) {
                        $sub->whereRaw('LOWER(COALESCE(receipt_type, "")) != ?', ['return'])
                            ->orWhereNull('receipt_type');
                    });
            })->orWhere(function ($purchaseRefund) {
                $purchaseRefund->where('source_type', self::SOURCE_PURCHASE)
                    ->whereRaw('LOWER(COALESCE(receipt_type, "")) = ?', ['return']);
            });
        });
        $paidOutQuery = (clone $summaryQuery)->where(function ($q) {
            $q->where(function ($paidOut) {
                $paidOut->where('source_type', self::SOURCE_PURCHASE)
                    ->where(function ($sub) {
                        $sub->whereRaw('LOWER(COALESCE(receipt_type, "")) != ?', ['return'])
                            ->orWhereNull('receipt_type');
                    });
            })
                ->orWhereIn('source_type', [self::SOURCE_EXPENSE, self::SOURCE_SALARY])
                ->orWhere(function ($sub) {
                    $sub->where('source_type', self::SOURCE_SALE)
                        ->whereRaw('LOWER(receipt_type) = ?', ['return']);
                });
        });

        return [
            'payments' => $payments,
            'summary' => [
                'total_payment_amount' => round((float) $summaryQuery->sum('paid_amount'), 2),
                'total_received' => round((float) $receivedQuery->sum('paid_amount'), 2),
                'total_paid_out' => round((float) $paidOutQuery->sum('paid_amount'), 2),
                'payment_count' => $payments->count(),
            ],
            'filters' => $this->getFilterOptions($companyId),
        ];
    }

    public function getForUser(User $user, int $id): array
    {
        return $this->formatPayment($this->findForUser($user, $id));
    }

    public function createForUser(User $user, array $data): array
    {
        throw new Exception(
            'Payments are recorded automatically when you save a purchase, expense, or employee salary.'
        );
    }

    public function syncFromPurchase(Purchase $purchase): void
    {
        $amount = round((float) $purchase->amount, 2);
        $paymentMethod = strtolower(trim((string) ($purchase->payment_method
            ?: $this->paymentMethodFromNetTerms($purchase->net_terms))));

        if ($amount <= 0 || $paymentMethod === 'credit') {
            $this->deleteBySource($purchase->company_id, self::SOURCE_PURCHASE, $purchase->id);

            return;
        }

        $isReturn = PurchaseService::isPurchaseReturn($purchase->purchase_type);

        PosPayment::updateOrCreate(
            [
                'company_id' => $purchase->company_id,
                'source_type' => self::SOURCE_PURCHASE,
                'source_id' => $purchase->id,
            ],
            [
                'payment_type' => '1008',
                'location' => $purchase->location ?: 'Main Location',
                'payment_date' => $purchase->purchase_date,
                'sales_no' => $purchase->invoice_id,
                'receipt_type' => $isReturn ? 'Return' : 'Purchase',
                'payment_method' => $purchase->payment_method
                    ?: $this->paymentMethodFromNetTerms($purchase->net_terms),
                'discount' => round((float) $purchase->discount, 2),
                'paid_amount' => $amount,
                'notes' => $isReturn
                    ? 'Auto from purchase return '.$purchase->invoice_id
                    : 'Auto from purchase '.$purchase->invoice_id,
            ]
        );
    }

    public function syncFromEmployeeSalary(Employee $employee): void
    {
        $salary = round((float) $employee->monthly_salary, 2);
        if ($salary <= 0) {
            $this->deleteBySource($employee->company_id, self::SOURCE_SALARY, $employee->id);

            return;
        }

        $code = $employee->employee_code ?: (string) $employee->id;
        $monthKey = now()->format('Y-m');
        $salesNo = 'EMP-'.$code.'-'.$monthKey;

        PosPayment::updateOrCreate(
            [
                'company_id' => $employee->company_id,
                'source_type' => self::SOURCE_SALARY,
                'source_id' => $employee->id,
            ],
            [
                'payment_type' => '1008',
                'location' => 'Main Location',
                'payment_date' => now()->toDateString(),
                'sales_no' => $salesNo,
                'receipt_type' => 'Salary',
                'payment_method' => 'Bank Transfer',
                'discount' => 0,
                'paid_amount' => $salary,
                'notes' => 'Auto salary – '.$employee->name.' ('.$monthKey.')',
            ]
        );
    }

    public function syncFromSale(Sale $sale): void
    {
        if (OrderTransactionService::isExchange($sale->transaction_type)) {
            $exchangeAmount = round((float) $sale->net_amount, 2);
            if (abs($exchangeAmount) < 0.005) {
                $this->deleteBySource($sale->company_id, self::SOURCE_SALE, $sale->id);

                return;
            }

            PosPayment::updateOrCreate(
                [
                    'company_id' => $sale->company_id,
                    'source_type' => self::SOURCE_SALE,
                    'source_id' => $sale->id,
                ],
                [
                    'payment_type' => '1008',
                    'location' => $sale->location ?: 'Main Location',
                    'payment_date' => $sale->sale_date,
                    'sales_no' => $sale->sales_id,
                    'receipt_type' => $exchangeAmount >= 0 ? 'Sale' : 'Return',
                    'payment_method' => $sale->payment_method ?: 'Cash',
                    'discount' => round((float) $sale->discount, 2),
                    'paid_amount' => abs($exchangeAmount),
                    'notes' => 'Auto from exchange '.$sale->sales_id
                        .($exchangeAmount >= 0 ? ' (net sale)' : ' (refund due)'),
                ]
            );

            return;
        }

        $amount = round((float) $sale->net_amount, 2);
        if ($amount <= 0) {
            $this->deleteBySource($sale->company_id, self::SOURCE_SALE, $sale->id);

            return;
        }

        $isReturn = OrderTransactionService::isSalesReturn($sale->transaction_type);

        PosPayment::updateOrCreate(
            [
                'company_id' => $sale->company_id,
                'source_type' => self::SOURCE_SALE,
                'source_id' => $sale->id,
            ],
            [
                'payment_type' => '1008',
                'location' => $sale->location ?: 'Main Location',
                'payment_date' => $sale->sale_date,
                'sales_no' => $sale->sales_id,
                'receipt_type' => $isReturn ? 'Return' : 'Sale',
                'payment_method' => $sale->payment_method ?: 'Cash',
                'discount' => round((float) $sale->discount, 2),
                'paid_amount' => $amount,
                'notes' => $isReturn
                    ? 'Auto from sales return '.$sale->sales_id
                    : 'Auto from sale '.$sale->sales_id,
            ]
        );
    }

    public function recordCustomerPayment(
        Customer $customer,
        float $amount,
        string $paymentMethod,
        ?string $notes = null,
        ?string $location = null,
        ?string $chequeNumber = null,
        ?string $bankName = null,
    ): PosPayment {
        $paidAmount = round($amount, 2);
        if ($paidAmount <= 0) {
            throw new Exception('Payment amount must be greater than zero.');
        }

        $companyId = (int) $customer->company_id;
        $salesNo = $this->getNextCustomerPaymentNo($companyId);
        $customerName = $customer->customer_name
            ?: $customer->business_name
            ?: $customer->first_name
            ?: 'Customer';

        return PosPayment::create([
            'company_id' => $companyId,
            'source_type' => self::SOURCE_CUSTOMER_PAYMENT,
            'source_id' => $customer->id,
            'payment_type' => '1008',
            'location' => $location ?: ($customer->inventory_location ?: $customer->location ?: 'Main Location'),
            'payment_date' => now()->toDateString(),
            'sales_no' => $salesNo,
            'receipt_type' => 'Customer Payment',
            'payment_method' => $paymentMethod ?: 'Cash',
            'cheque_number' => $chequeNumber ?: null,
            'bank_name' => $bankName ?: null,
            'discount' => 0,
            'paid_amount' => $paidAmount,
            'notes' => $notes ?: 'Credit payment from '.$customerName,
        ]);
    }

    public function getNextCustomerPaymentNo(int $companyId): string
    {
        $max = PosPayment::where('company_id', $companyId)
            ->where('sales_no', 'like', 'CRP-%')
            ->get()
            ->map(function (PosPayment $p) {
                if (preg_match('/CRP-(\d+)/', (string) $p->sales_no, $m)) {
                    return (int) $m[1];
                }

                return 0;
            })
            ->max();

        $next = ((int) $max) + 1;

        return 'CRP-'.str_pad((string) max(1, $next), 4, '0', STR_PAD_LEFT);
    }

    public function syncFromExpense(Expense $expense): void
    {
        $paidAmount = round((float) $expense->amount - (float) $expense->discount, 2);
        $status = trim((string) $expense->status);

        if ($paidAmount <= 0 || $status !== 'Approved') {
            $this->deleteBySource($expense->company_id, self::SOURCE_EXPENSE, $expense->id);

            return;
        }

        PosPayment::updateOrCreate(
            [
                'company_id' => $expense->company_id,
                'source_type' => self::SOURCE_EXPENSE,
                'source_id' => $expense->id,
            ],
            [
                'payment_type' => '1008',
                'location' => $expense->location ?: 'Main Location',
                'payment_date' => $expense->expense_date,
                'sales_no' => $expense->reference_no,
                'receipt_type' => 'Expense',
                'payment_method' => $expense->payment_method ?: 'Cash',
                'discount' => round((float) $expense->discount, 2),
                'paid_amount' => $paidAmount,
                'notes' => 'Auto from expense '.$expense->reference_no.' – '.$expense->category,
            ]
        );
    }

    public function deleteBySource(int $companyId, string $sourceType, int $sourceId): void
    {
        PosPayment::where('company_id', $companyId)
            ->where('source_type', $sourceType)
            ->where('source_id', $sourceId)
            ->delete();
    }

    private function sourceTypeLabel(?string $sourceType): string
    {
        return match ($sourceType) {
            self::SOURCE_PURCHASE => 'a purchase',
            self::SOURCE_SALARY => 'employee salary',
            self::SOURCE_EXPENSE => 'an expense',
            self::SOURCE_SALE => 'a sale',
            self::SOURCE_CUSTOMER_PAYMENT => 'a customer credit payment',
            default => 'another record',
        };
    }

    public function updateForUser(User $user, int $id, array $data): array
    {
        $payment = $this->findForUser($user, $id);

        if ($payment->source_type) {
            throw new Exception(
                'This payment is linked to '.$this->sourceTypeLabel($payment->source_type).
                '. Update or delete the original record instead.'
            );
        }

        $payload = $this->buildAttributes($payment->company_id, $data, $payment);

        if (isset($payload['sales_no'])) {
            $exists = PosPayment::where('company_id', $payment->company_id)
                ->where('sales_no', $payload['sales_no'])
                ->where('id', '!=', $payment->id)
                ->exists();
            if ($exists) {
                throw new Exception('Sales number already exists.');
            }
        }

        $payment->update($payload);

        return $this->formatPayment($payment->fresh());
    }

    public function deleteForUser(User $user, int $id): void
    {
        $payment = $this->findForUser($user, $id);

        if ($payment->source_type) {
            throw new Exception(
                'This payment is linked to '.$this->sourceTypeLabel($payment->source_type).
                '. Update or delete the original record instead.'
            );
        }

        $payment->delete();
    }

    public function getNextSalesNoForUser(User $user): string
    {
        $company = $this->companySettingService->getCompanyForUser($user);

        $max = PosPayment::where('company_id', $company->id)
            ->where('sales_no', 'like', 'SAL-%')
            ->get()
            ->map(function (PosPayment $p) {
                if (preg_match('/SAL-(\d+)/', $p->sales_no, $m)) {
                    return (int) $m[1];
                }

                return 0;
            })
            ->max();

        $next = ((int) $max) + 1;

        return 'SAL-'.str_pad((string) max(1, $next), 4, '0', STR_PAD_LEFT);
    }

    private function buildAttributes(int $companyId, array $data, ?PosPayment $existing = null): array
    {
        $discount = round((float) ($data['discount'] ?? 0), 2);
        $paidAmount = round((float) ($data['paid_amount'] ?? 0), 2);

        if ($paidAmount <= 0) {
            throw new Exception('Paid amount must be greater than zero.');
        }

        $salesNo = trim((string) ($data['sales_no'] ?? ''));
        if ($salesNo === '' && !$existing) {
            throw new Exception('Sales number is required');
        }

        $payload = [
            'payment_type' => trim((string) ($data['payment_type'] ?? '1008')) ?: '1008',
            'location' => trim((string) ($data['location'] ?? 'Main Location')) ?: 'Main Location',
            'payment_date' => $data['payment_date'] ?? now()->toDateString(),
            'receipt_type' => trim((string) ($data['receipt_type'] ?? 'Sale')) ?: 'Sale',
            'payment_method' => trim((string) ($data['payment_method'] ?? 'Cash')) ?: 'Cash',
            'discount' => $discount,
            'paid_amount' => $paidAmount,
            'notes' => $data['notes'] ?? null,
        ];

        if ($salesNo !== '') {
            $payload['sales_no'] = $salesNo;
        }

        if (!$existing) {
            $payload['company_id'] = $companyId;
        }

        return $payload;
    }

    private function getFilterOptions(int $companyId): array
    {
        $types = PosPayment::where('company_id', $companyId)
            ->distinct()
            ->pluck('payment_type')
            ->filter()
            ->values()
            ->all();

        $paymentTypes = array_values(array_unique(array_merge(self::DEFAULT_PAYMENT_TYPES, $types)));

        $methods = PosPayment::where('company_id', $companyId)
            ->distinct()
            ->pluck('payment_method')
            ->filter()
            ->values()
            ->all();

        $paymentMethods = array_values(array_unique(array_merge(self::DEFAULT_PAYMENT_METHODS, $methods)));

        $locations = PosPayment::where('company_id', $companyId)
            ->distinct()
            ->pluck('location')
            ->filter()
            ->values()
            ->all();

        $branchNames = Branch::where('company_id', $companyId)
            ->where('is_active', true)
            ->orderBy('name')
            ->pluck('name')
            ->all();

        $locations = array_values(array_unique(array_merge(['Main Location'], $branchNames, $locations)));

        return [
            'payment_types' => $paymentTypes,
            'payment_methods' => $paymentMethods,
            'receipt_types' => self::DEFAULT_RECEIPT_TYPES,
            'locations' => $locations,
        ];
    }

    private function findForUser(User $user, int $id): PosPayment
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $payment = PosPayment::where('company_id', $company->id)->where('id', $id)->first();

        if (!$payment) {
            throw new Exception('Payment not found');
        }

        return $payment;
    }

    private function paymentMethodFromNetTerms(?string $netTerms): string
    {
        $terms = strtolower(trim((string) $netTerms));
        if ($terms === '' || $terms === 'cash') {
            return 'Cash';
        }
        if (str_contains($terms, 'card')) {
            return 'Card';
        }
        if (str_contains($terms, 'cheque') || str_contains($terms, 'check')) {
            return 'Cheque';
        }

        return 'Bank Transfer';
    }

    private function formatPayment(PosPayment $payment): array
    {
        return [
            'id' => $payment->id,
            'source_type' => $payment->source_type,
            'source_id' => $payment->source_id,
            'payment_type' => $payment->payment_type,
            'location' => $payment->location,
            'payment_date' => $payment->payment_date->format('Y-m-d'),
            'payment_datetime' => ($payment->created_at ?? $payment->payment_date)->format('d-m-Y H:i'),
            'sales_no' => $payment->sales_no,
            'receipt_type' => $payment->receipt_type,
            'payment_method' => $payment->payment_method,
            'discount' => (float) $payment->discount,
            'paid_amount' => (float) $payment->paid_amount,
            'notes' => $payment->notes,
            'direction' => $this->paymentDirection($payment),
            'source_label' => $this->paymentSourceLabel($payment),
            'details' => $this->paymentDetails($payment),
        ];
    }

    private function isSalesReturnPayment(PosPayment $payment): bool
    {
        return $payment->source_type === self::SOURCE_SALE
            && strtolower(trim((string) $payment->receipt_type)) === 'return';
    }

    private function isPurchaseReturnPayment(PosPayment $payment): bool
    {
        return $payment->source_type === self::SOURCE_PURCHASE
            && strtolower(trim((string) $payment->receipt_type)) === 'return';
    }

    private function paymentDirection(PosPayment $payment): string
    {
        if ($this->isSalesReturnPayment($payment)) {
            return 'Paid Out';
        }

        if ($this->isPurchaseReturnPayment($payment)) {
            return 'Income';
        }

        if ($payment->source_type === self::SOURCE_SALE) {
            return 'Income';
        }

        if (in_array($payment->source_type, [self::SOURCE_PURCHASE, self::SOURCE_EXPENSE, self::SOURCE_SALARY], true)) {
            return 'Paid Out';
        }

        return 'Payment';
    }

    private function paymentSourceLabel(PosPayment $payment): string
    {
        if ($this->isSalesReturnPayment($payment)) {
            return 'Sales return';
        }

        if ($this->isPurchaseReturnPayment($payment)) {
            return 'Purchase return';
        }

        return match ($payment->source_type) {
            self::SOURCE_SALE => 'Customer sale',
            self::SOURCE_PURCHASE => 'Supplier purchase',
            self::SOURCE_EXPENSE => 'Expense',
            self::SOURCE_SALARY => 'Salary',
            default => 'Manual',
        };
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function paymentDetails(PosPayment $payment): array
    {
        if ($payment->source_type === self::SOURCE_SALE && $payment->source_id) {
            $sale = Sale::with('items')->find($payment->source_id);
            if ($sale) {
                return $sale->items->map(function (SaleItem $line) {
                    $qty = (float) $line->qty;
                    $unitPrice = round((float) $line->unit_price, 2);
                    $lineTotal = round((float) $line->line_total, 2);
                    $gross = round($qty * $unitPrice, 2);

                    return [
                        'item_number' => $line->item_number,
                        'description' => $line->description,
                        'qty' => round($qty, 2),
                        'unit_price' => $unitPrice,
                        'discount' => round(max(0, $gross - $lineTotal), 2),
                        'net_price' => $qty > 0 ? round($lineTotal / $qty, 2) : $unitPrice,
                        'amount' => $lineTotal,
                    ];
                })->values()->all();
            }
        }

        if ($payment->source_type === self::SOURCE_PURCHASE && $payment->source_id) {
            $items = PurchaseItem::where('purchase_id', $payment->source_id)->get();

            return $items->map(function (PurchaseItem $line) {
                $qty = (float) $line->qty;
                $unitPrice = round((float) $line->unit_price, 2);
                $lineTotal = round((float) $line->line_total, 2);

                return [
                    'item_number' => $line->item_number ?? '—',
                    'description' => $line->description ?? '—',
                    'qty' => round($qty, 2),
                    'unit_price' => $unitPrice,
                    'discount' => 0,
                    'net_price' => $unitPrice,
                    'amount' => $lineTotal,
                ];
            })->values()->all();
        }

        if ($payment->source_type === self::SOURCE_EXPENSE && $payment->source_id) {
            $expense = Expense::find($payment->source_id);
            if ($expense) {
                return [[
                    'item_number' => $expense->reference_no,
                    'description' => trim(($expense->category ?? '').' — '.($expense->description ?? '')),
                    'qty' => 1,
                    'unit_price' => round((float) $expense->amount, 2),
                    'discount' => round((float) $expense->discount, 2),
                    'net_price' => round((float) $expense->amount - (float) $expense->discount, 2),
                    'amount' => round((float) $expense->amount - (float) $expense->discount, 2),
                ]];
            }
        }

        $rows = [];
        if ($payment->notes) {
            $rows[] = [
                'item_number' => '—',
                'description' => $payment->notes,
                'qty' => 1,
                'unit_price' => round((float) $payment->paid_amount, 2),
                'discount' => round((float) $payment->discount, 2),
                'net_price' => round((float) $payment->paid_amount, 2),
                'amount' => round((float) $payment->paid_amount, 2),
            ];
        }

        return $rows;
    }
}
