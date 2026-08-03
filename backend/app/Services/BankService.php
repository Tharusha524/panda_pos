<?php

namespace App\Services;

use App\Models\Bank;
use App\Models\User;
use Exception;

class BankService
{
    public function __construct(private CompanySettingService $companySettingService)
    {
    }

    public function getAllForUser(User $user)
    {
        $company = $this->companySettingService->getCompanyForUser($user);

        return Bank::where('company_id', $company->id)
            ->orderBy('name')
            ->orderBy('bank_code')
            ->get()
            ->map(fn (Bank $bank) => $this->formatBank($bank));
    }

    public function createForUser(User $user, array $data): array
    {
        $company = $this->companySettingService->getCompanyForUser($user);

        $bankCode = trim((string) ($data['bank_code'] ?? ''));
        if ($bankCode === '') {
            $bankCode = $this->nextBankCode($company->id);
        }

        if (Bank::where('company_id', $company->id)->where('bank_code', $bankCode)->exists()) {
            throw new Exception('Bank ID already exists.');
        }

        $bank = Bank::create([
            'company_id' => $company->id,
            'bank_code' => $bankCode,
            'name' => $data['name'],
            'address' => $data['address'] ?? null,
            'is_active' => $data['is_active'] ?? true,
        ]);

        return $this->formatBank($bank);
    }

    public function updateForUser(User $user, int $id, array $data): array
    {
        $bank = $this->findForUser($user, $id);
        $companyId = $bank->company_id;

        $payload = [];
        if (array_key_exists('name', $data)) {
            $payload['name'] = $data['name'];
        }
        if (array_key_exists('address', $data)) {
            $payload['address'] = $data['address'];
        }
        if (array_key_exists('is_active', $data)) {
            $payload['is_active'] = (bool) $data['is_active'];
        }
        if (array_key_exists('bank_code', $data) && trim((string) $data['bank_code']) !== '') {
            $newCode = trim((string) $data['bank_code']);
            $exists = Bank::where('company_id', $companyId)
                ->where('bank_code', $newCode)
                ->where('id', '!=', $id)
                ->exists();
            if ($exists) {
                throw new Exception('Bank ID already exists.');
            }
            $payload['bank_code'] = $newCode;
        }

        if ($payload !== []) {
            $bank->update($payload);
        }

        return $this->formatBank($bank->fresh());
    }

    public function deleteForUser(User $user, int $id): void
    {
        $this->findForUser($user, $id)->delete();
    }

    private function findForUser(User $user, int $id): Bank
    {
        $company = $this->companySettingService->getCompanyForUser($user);

        $bank = Bank::where('company_id', $company->id)->where('id', $id)->first();

        if (!$bank) {
            throw new Exception('Bank not found');
        }

        return $bank;
    }

    private function nextBankCode(int $companyId): string
    {
        $codes = Bank::where('company_id', $companyId)->pluck('bank_code');

        $maxNumeric = $codes
            ->map(fn ($code) => ctype_digit((string) $code) ? (int) $code : 0)
            ->max();

        return (string) (($maxNumeric ?? 0) + 1);
    }

    private function formatBank(Bank $bank): array
    {
        return [
            'id' => $bank->id,
            'company_id' => $bank->company_id,
            'bank_code' => $bank->bank_code,
            'name' => $bank->name,
            'address' => $bank->address ?? '',
            'is_active' => (bool) $bank->is_active,
        ];
    }
}
