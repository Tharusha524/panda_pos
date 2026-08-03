<?php

namespace App\Services;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\User;
use Exception;

class ExpenseCategoryService
{
    private const DEFAULT_NAMES = [
        'Utilities',
        'Rent',
        'Maintenance',
        'Supplies',
        'Transport',
        'Marketing',
        'Other',
    ];

    public function __construct(private CompanySettingService $companySettingService)
    {
    }

    public function getAllForUser(User $user): array
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $this->ensureDefaults($company->id);

        return ExpenseCategory::where('company_id', $company->id)
            ->orderBy('name')
            ->get()
            ->map(fn (ExpenseCategory $c) => $this->formatCategory($c))
            ->values()
            ->all();
    }

    public function createForUser(User $user, array $data): array
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $name = trim((string) ($data['name'] ?? ''));

        if ($name === '') {
            throw new Exception('Category name is required.');
        }

        if (ExpenseCategory::where('company_id', $company->id)->where('name', $name)->exists()) {
            throw new Exception('This expense category already exists.');
        }

        $category = ExpenseCategory::create([
            'company_id' => $company->id,
            'name' => $name,
        ]);

        return $this->formatCategory($category);
    }

    public function updateForUser(User $user, int $id, array $data): array
    {
        $category = $this->findForUser($user, $id);
        $name = trim((string) ($data['name'] ?? ''));

        if ($name === '') {
            throw new Exception('Category name is required.');
        }

        $exists = ExpenseCategory::where('company_id', $category->company_id)
            ->where('name', $name)
            ->where('id', '!=', $category->id)
            ->exists();

        if ($exists) {
            throw new Exception('This expense category already exists.');
        }

        $oldName = $category->name;
        $category->update(['name' => $name]);

        if ($oldName !== $name) {
            Expense::where('company_id', $category->company_id)
                ->where('category', $oldName)
                ->update(['category' => $name]);
        }

        return $this->formatCategory($category->fresh());
    }

    public function deleteForUser(User $user, int $id): void
    {
        $category = $this->findForUser($user, $id);

        $inUse = Expense::where('company_id', $category->company_id)
            ->where('category', $category->name)
            ->exists();

        if ($inUse) {
            throw new Exception('Cannot delete: expenses are using this category.');
        }

        $category->delete();
    }

    public function categoryNamesForCompany(int $companyId): array
    {
        $this->ensureDefaults($companyId);

        return ExpenseCategory::where('company_id', $companyId)
            ->orderBy('name')
            ->pluck('name')
            ->all();
    }

    private function ensureDefaults(int $companyId): void
    {
        if (ExpenseCategory::where('company_id', $companyId)->exists()) {
            return;
        }

        foreach (self::DEFAULT_NAMES as $name) {
            ExpenseCategory::create([
                'company_id' => $companyId,
                'name' => $name,
            ]);
        }
    }

    private function findForUser(User $user, int $id): ExpenseCategory
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $category = ExpenseCategory::where('company_id', $company->id)->where('id', $id)->first();

        if (!$category) {
            throw new Exception('Expense category not found');
        }

        return $category;
    }

    private function formatCategory(ExpenseCategory $category): array
    {
        return [
            'id' => $category->id,
            'name' => $category->name,
        ];
    }
}
