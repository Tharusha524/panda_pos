<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\User;
use Exception;

class BranchService
{
    public function __construct(
        private CompanySettingService $companySettingService,
        private LocationService $locationService,
    ) {
    }

    public function getAllForUser(User $user)
    {
        $company = $this->companySettingService->getCompanyForUser($user);

        return Branch::where('company_id', $company->id)
            ->orderBy('name')
            ->get();
    }

    public function createForUser(User $user, array $data): Branch
    {
        $company = $this->companySettingService->getCompanyForUser($user);

        return Branch::create([
            'company_id' => $company->id,
            'name' => $data['name'],
            'address' => $data['address'] ?? null,
            'city' => $data['city'] ?? null,
            'phone' => $data['phone'] ?? null,
            'is_active' => $data['is_active'] ?? true,
        ]);
    }

    public function updateForUser(User $user, int $id, array $data): Branch
    {
        $branch = $this->findForUser($user, $id);

        $payload = [];
        foreach (['name', 'address', 'city', 'phone', 'is_active'] as $field) {
            if (array_key_exists($field, $data)) {
                $payload[$field] = $data[$field];
            }
        }

        if ($payload !== []) {
            $branch->update($payload);
        }

        return $branch->fresh();
    }

    public function deleteForUser(User $user, int $id): void
    {
        $branch = $this->findForUser($user, $id);
        $company = $this->companySettingService->getCompanyForUser($user);

        if ($this->locationService->branchNameInUse($company->id, $branch->name)) {
            throw new Exception(
                'Cannot delete this branch: it is used by inventory, sales, purchases, or other records.'
            );
        }

        $branch->delete();
    }

    private function findForUser(User $user, int $id): Branch
    {
        $company = $this->companySettingService->getCompanyForUser($user);

        $branch = Branch::where('company_id', $company->id)->where('id', $id)->first();

        if (!$branch) {
            throw new Exception('Branch not found');
        }

        return $branch;
    }
}
