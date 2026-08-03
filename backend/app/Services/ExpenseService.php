<?php

namespace App\Services;

use App\Models\Expense;
use App\Models\User;
use Exception;

class ExpenseService
{
    private const STATUSES = ['Approved', 'Pending', 'Rejected'];

    public function __construct(
        private CompanySettingService $companySettingService,
        private PaymentService $paymentService,
        private ExpenseCategoryService $expenseCategoryService,
        private LocationService $locationService,
    ) {
    }

    public function getAllForUser(
        User $user,
        ?string $location = null,
        ?string $dateFrom = null,
        ?string $dateTo = null,
        ?string $category = null,
        ?string $status = null,
        ?string $paymentMethod = null,
    ): array {
        $company = $this->companySettingService->getCompanyForUser($user);
        $companyId = $company->id;

        $query = Expense::where('company_id', $companyId);
        $this->applyListFilters($query, $location, $dateFrom, $dateTo, $category, $status, $paymentMethod);

        $expenses = $query
            ->orderByDesc('expense_date')
            ->orderByDesc('id')
            ->get()
            ->map(fn (Expense $e) => $this->formatExpense($e));

        $summaryQuery = Expense::where('company_id', $companyId);
        $this->applyListFilters($summaryQuery, $location, $dateFrom, $dateTo, $category, $status, $paymentMethod);

        $paidExpr = 'COALESCE(amount, 0) - COALESCE(discount, 0)';
        $totalPaid = round((float) (clone $summaryQuery)->selectRaw("SUM({$paidExpr}) as total")->value('total'), 2);
        $approvedPaid = round((float) (clone $summaryQuery)
            ->where('status', 'Approved')
            ->selectRaw("SUM({$paidExpr}) as total")
            ->value('total'), 2);
        $pendingCount = (clone $summaryQuery)->where('status', 'Pending')->count();

        return [
            'expenses' => $expenses,
            'summary' => [
                'total_expenses' => $expenses->count(),
                'total_expense_amount' => round((float) $totalPaid, 2),
                'total_approved_amount' => round((float) $approvedPaid, 2),
                'pending_count' => $pendingCount,
            ],
            'filters' => $this->getFilterOptions($companyId),
        ];
    }

    private function applyListFilters(
        $query,
        ?string $location,
        ?string $dateFrom,
        ?string $dateTo,
        ?string $category,
        ?string $status,
        ?string $paymentMethod,
    ): void {
        if ($location && $location !== 'all') {
            $query->where('location', $location);
        }
        if ($dateFrom) {
            $query->whereDate('expense_date', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate('expense_date', '<=', $dateTo);
        }
        if ($category && $category !== 'all') {
            $query->where('category', $category);
        }
        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }
        if ($paymentMethod && $paymentMethod !== 'all') {
            $query->where('payment_method', $paymentMethod);
        }
    }

    public function getForUser(User $user, int $id): array
    {
        return $this->formatExpense($this->findForUser($user, $id));
    }

    public function createForUser(User $user, array $data): array
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $data['location'] = $this->locationService->assertValidForUser($user, $data['location'] ?? null);
        $payload = $this->buildAttributes($company->id, $data);

        $ref = $payload['reference_no'];
        if (Expense::where('company_id', $company->id)->where('reference_no', $ref)->exists()) {
            throw new Exception('Reference number already exists.');
        }

        $expense = Expense::create($payload);
        $this->paymentService->syncFromExpense($expense->fresh());

        return $this->formatExpense($expense);
    }

    public function updateForUser(User $user, int $id, array $data): array
    {
        $expense = $this->findForUser($user, $id);
        if (array_key_exists('location', $data)) {
            $data['location'] = $this->locationService->assertValidForUser($user, $data['location']);
        }
        $payload = $this->buildAttributes($expense->company_id, $data, $expense);

        if (isset($payload['reference_no'])) {
            $exists = Expense::where('company_id', $expense->company_id)
                ->where('reference_no', $payload['reference_no'])
                ->where('id', '!=', $expense->id)
                ->exists();
            if ($exists) {
                throw new Exception('Reference number already exists.');
            }
        }

        $expense->update($payload);
        $this->paymentService->syncFromExpense($expense->fresh());

        return $this->formatExpense($expense);
    }

    public function deleteForUser(User $user, int $id): void
    {
        $expense = $this->findForUser($user, $id);
        $companyId = $expense->company_id;
        $expenseId = $expense->id;
        $expense->delete();
        $this->paymentService->deleteBySource($companyId, PaymentService::SOURCE_EXPENSE, $expenseId);
    }

    public function getNextReferenceNoForUser(User $user): string
    {
        $company = $this->companySettingService->getCompanyForUser($user);

        $max = Expense::where('company_id', $company->id)
            ->where('reference_no', 'like', 'EXP-%')
            ->get()
            ->map(function (Expense $e) {
                if (preg_match('/EXP-(\d+)/', $e->reference_no, $m)) {
                    return (int) $m[1];
                }

                return 0;
            })
            ->max();

        $next = ((int) $max) + 1;

        return 'EXP-'.str_pad((string) max(1, $next), 4, '0', STR_PAD_LEFT);
    }

    private function buildAttributes(int $companyId, array $data, ?Expense $existing = null): array
    {
        $amount = round((float) ($data['amount'] ?? 0), 2);
        $discount = round((float) ($data['discount'] ?? 0), 2);

        if ($amount <= 0) {
            throw new Exception('Expense amount must be greater than zero.');
        }

        $category = trim((string) ($data['category'] ?? ''));
        if ($category === '') {
            throw new Exception('Category is required.');
        }

        $description = trim((string) ($data['description'] ?? ''));
        if ($description === '') {
            throw new Exception('Description is required.');
        }

        $referenceNo = trim((string) ($data['reference_no'] ?? ''));
        if ($referenceNo === '' && !$existing) {
            throw new Exception('Reference number is required.');
        }

        $status = trim((string) ($data['status'] ?? 'Approved'));
        if (!in_array($status, self::STATUSES, true)) {
            $status = 'Approved';
        }

        $payload = [
            'location' => trim((string) ($data['location'] ?? 'Main Location')) ?: 'Main Location',
            'expense_date' => $data['expense_date'] ?? now()->toDateString(),
            'category' => $category,
            'description' => $description,
            'amount' => $amount,
            'discount' => $discount,
            'payment_method' => trim((string) ($data['payment_method'] ?? 'Cash')) ?: 'Cash',
            'status' => $status,
            'notes' => $data['notes'] ?? null,
        ];

        if ($referenceNo !== '') {
            $payload['reference_no'] = $referenceNo;
        }

        if (!$existing) {
            $payload['company_id'] = $companyId;
        }

        return $payload;
    }

    private function getFilterOptions(int $companyId): array
    {
        $categories = $this->expenseCategoryService->categoryNamesForCompany($companyId);

        $storedLocations = Expense::where('company_id', $companyId)
            ->distinct()
            ->pluck('location')
            ->filter()
            ->values()
            ->all();

        $locations = $this->locationService->getOptionsForCompany($companyId, $storedLocations);

        return [
            'categories' => $categories,
            'locations' => $locations,
            'statuses' => self::STATUSES,
            'payment_methods' => PaymentService::defaultPaymentMethods(),
        ];
    }

    private function findForUser(User $user, int $id): Expense
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $expense = Expense::where('company_id', $company->id)->where('id', $id)->first();

        if (!$expense) {
            throw new Exception('Expense not found');
        }

        return $expense;
    }

    private function formatExpense(Expense $expense): array
    {
        $amount = (float) $expense->amount;
        $discount = (float) $expense->discount;
        $paidAmount = round($amount - $discount, 2);

        return [
            'id' => $expense->id,
            'location' => $expense->location,
            'expense_date' => $expense->expense_date->format('Y-m-d'),
            'expense_datetime' => ($expense->created_at ?? $expense->expense_date)->format('d-m-Y H:i'),
            'reference_no' => $expense->reference_no,
            'category' => $expense->category,
            'description' => $expense->description,
            'amount' => $amount,
            'discount' => $discount,
            'paid_amount' => $paidAmount,
            'payment_method' => $expense->payment_method,
            'status' => $expense->status,
            'notes' => $expense->notes,
            'details' => [
                [
                    'category' => $expense->category,
                    'description' => $expense->description,
                    'amount' => $amount,
                    'discount' => $discount,
                    'paid_amount' => $paidAmount,
                ],
            ],
        ];
    }
}
