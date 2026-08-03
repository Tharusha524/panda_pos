<?php

namespace App\Services;

use App\Models\Supplier;
use App\Models\User;
use Exception;

class SupplierService
{
    public function __construct(
        private CompanySettingService $companySettingService,
        private LocationService $locationService,
    ) {
    }

    public function getAllForUser(User $user, ?string $location = null): array
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $companyId = $company->id;

        $query = Supplier::where('company_id', $companyId);

        if ($location && $location !== 'all') {
            $query->where('location', $location);
        }

        $suppliers = $query
            ->orderBy('first_name')
            ->get()
            ->map(fn (Supplier $supplier) => $this->formatSupplier($supplier));

        $storedLocations = Supplier::where('company_id', $companyId)
            ->distinct()
            ->pluck('location')
            ->filter()
            ->values()
            ->all();

        $totalPayables = round((float) $suppliers->sum(fn (array $s) => (float) ($s['net_balance'] ?? 0)), 2);

        return [
            'suppliers' => $suppliers,
            'summary' => [
                'total_suppliers' => $suppliers->count(),
                'total_payables' => $totalPayables,
            ],
            'filters' => [
                'locations' => $this->locationService->getOptionsForCompany($companyId, $storedLocations),
            ],
        ];
    }

    public function getForUser(User $user, int $id): array
    {
        return $this->formatSupplier($this->findForUser($user, $id));
    }

    public function createForUser(User $user, array $data): array
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $location = $this->locationService->assertValidForUser($user, $data['location'] ?? null);

        $firstName = trim((string) ($data['first_name'] ?? ''));
        if ($firstName === '') {
            throw new Exception('Supplier first name is required');
        }

        $phone = trim((string) ($data['phone'] ?? ''));
        if ($phone === '') {
            throw new Exception('Phone number is required');
        }

        $supplierCode = trim((string) ($data['supplier_code'] ?? ''));
        if ($supplierCode === '') {
            $supplierCode = $this->nextSupplierCode($company->id, $location);
        }

        if (Supplier::where('company_id', $company->id)
            ->where('supplier_code', $supplierCode)
            ->where('location', $location)
            ->exists()) {
            throw new Exception('Supplier ID already exists at this branch/location.');
        }

        $openingBalance = (float) ($data['opening_balance'] ?? 0);

        $supplier = Supplier::create([
            'company_id' => $company->id,
            'location' => $location,
            'supplier_code' => $supplierCode,
            'first_name' => $firstName,
            'phone' => $phone,
            'email' => $data['email'] ?? null,
            'opening_balance' => $openingBalance,
            'net_balance' => $openingBalance,
            'address_line1' => $data['address_line1'] ?? null,
            'address_line2' => $data['address_line2'] ?? null,
            'city' => $data['city'] ?? null,
            'province' => $data['province'] ?? null,
            'postal_code' => $data['postal_code'] ?? null,
            'country' => $data['country'] ?? 'Sri Lanka',
        ]);

        return $this->formatSupplier($supplier);
    }

    public function updateForUser(User $user, int $id, array $data): array
    {
        $supplier = $this->findForUser($user, $id);
        $companyId = $supplier->company_id;

        if (array_key_exists('location', $data)) {
            $supplier->location = $this->locationService->assertValidForUser($user, $data['location']);
        }

        if (array_key_exists('first_name', $data)) {
            $firstName = trim((string) $data['first_name']);
            if ($firstName === '') {
                throw new Exception('Supplier first name is required');
            }
            $supplier->first_name = $firstName;
        }

        if (array_key_exists('phone', $data)) {
            $phone = trim((string) $data['phone']);
            if ($phone === '') {
                throw new Exception('Phone number is required');
            }
            $supplier->phone = $phone;
        }

        if (array_key_exists('supplier_code', $data) && trim((string) $data['supplier_code']) !== '') {
            $newCode = trim((string) $data['supplier_code']);
            $exists = Supplier::where('company_id', $companyId)
                ->where('supplier_code', $newCode)
                ->where('location', $supplier->location)
                ->where('id', '!=', $id)
                ->exists();
            if ($exists) {
                throw new Exception('Supplier ID already exists at this branch/location.');
            }
            $supplier->supplier_code = $newCode;
        }

        foreach ([
            'email', 'address_line1', 'address_line2', 'city', 'province', 'postal_code', 'country',
        ] as $field) {
            if (array_key_exists($field, $data)) {
                $supplier->{$field} = $data[$field];
            }
        }

        if (array_key_exists('opening_balance', $data)) {
            $openingBalance = (float) $data['opening_balance'];
            $supplier->opening_balance = $openingBalance;
            $supplier->net_balance = $openingBalance;
        }

        $supplier->save();

        return $this->formatSupplier($supplier->fresh());
    }

    public function deleteForUser(User $user, int $id): void
    {
        $this->findForUser($user, $id)->delete();
    }

    private function findForUser(User $user, int $id): Supplier
    {
        $company = $this->companySettingService->getCompanyForUser($user);

        $supplier = Supplier::where('company_id', $company->id)->where('id', $id)->first();

        if (!$supplier) {
            throw new Exception('Supplier not found');
        }

        return $supplier;
    }

    private function nextSupplierCode(int $companyId, string $location): string
    {
        $codes = Supplier::where('company_id', $companyId)
            ->where('location', $location)
            ->pluck('supplier_code');

        $maxNumeric = $codes
            ->map(fn ($code) => ctype_digit((string) $code) ? (int) $code : 0)
            ->max();

        return (string) (($maxNumeric ?? 0) + 1);
    }

    private function formatSupplier(Supplier $supplier): array
    {
        return [
            'id' => $supplier->id,
            'location' => $supplier->location ?? LocationService::MAIN_LOCATION,
            'supplier_code' => $supplier->supplier_code,
            'first_name' => $supplier->first_name,
            'name' => $supplier->first_name,
            'phone' => $supplier->phone,
            'phone_display' => $supplier->phone,
            'email' => $supplier->email,
            'opening_balance' => (float) $supplier->opening_balance,
            'net_balance' => (float) $supplier->net_balance,
            'address_line1' => $supplier->address_line1,
            'address_line2' => $supplier->address_line2,
            'city' => $supplier->city,
            'province' => $supplier->province,
            'postal_code' => $supplier->postal_code,
            'country' => $supplier->country,
        ];
    }
}
