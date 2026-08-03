<?php

namespace App\Services;

use App\Models\Company;
use App\Models\User;
use App\Support\UserSchema;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class CompanySettingService
{
    public function getForUser(User $user): Company
    {
        return $this->getOrCreateCompany($user);
    }

    public function updateForUser(User $user, array $data): Company
    {
        $company = $this->getOrCreateCompany($user);

        $payload = [];
        $fields = [
            'name', 'industry', 'email', 'phone', 'address', 'city', 'state',
            'zip', 'country', 'tax_id', 'registration_number', 'currency', 'language',
        ];

        foreach ($fields as $field) {
            if (array_key_exists($field, $data)) {
                $payload[$field] = $data[$field];
            }
        }

        if ($payload !== []) {
            $company->update($payload);
        }

        return $company->fresh();
    }

    public function updateLocaleForUser(User $user, array $data): Company
    {
        $company = $this->getOrCreateCompany($user);

        $payload = [];
        if (array_key_exists('currency', $data)) {
            $payload['currency'] = $data['currency'];
        }
        if (array_key_exists('language', $data)) {
            $payload['language'] = $data['language'];
        }

        if ($payload !== []) {
            $company->update($payload);
        }

        return $company->fresh();
    }

    public function getCompanyForUser(User $user): Company
    {
        return $this->getOrCreateCompany($user);
    }

    /**
     * Logo/name for unauthenticated screens (login, register, backend-configure).
     * This app is deployed one-company-per-instance in practice, so the first
     * company created is treated as the site's public branding.
     */
    public function getPublicBranding(): array
    {
        $company = Company::oldest('id')->first();

        return [
            'name' => $company?->name,
            'logo_url' => $this->resolveLogoUrl($company?->logo_path),
        ];
    }

    private function getOrCreateCompany(User $user): Company
    {
        $linkedCompanyId = UserSchema::companyIdFor($user);
        if ($linkedCompanyId) {
            $shared = Company::find($linkedCompanyId);
            if ($shared) {
                return $shared;
            }
        }

        $owned = Company::where('user_id', $user->id)->first();
        if ($owned) {
            $this->linkUserToCompany($user, (int) $owned->id);

            return $owned;
        }

        return $this->provisionOwnedCompanyForUser($user);
    }

    public function provisionOwnedCompanyForUser(User $user): Company
    {
        $existing = Company::where('user_id', $user->id)->first();
        if ($existing) {
            $this->linkUserToCompany($user, (int) $existing->id);

            return $existing;
        }

        $company = Company::create([
            'user_id' => $user->id,
            'name' => 'My POS Business',
            'industry' => 'Retail',
            'email' => $user->email,
            'phone' => $user->phone,
            'address' => '',
            'city' => '',
            'state' => '',
            'zip' => '',
            'country' => 'USA',
            'tax_id' => '',
            'registration_number' => '',
            'currency' => 'USD',
            'language' => 'en',
        ]);

        $this->linkUserToCompany($user, (int) $company->id);

        return $company;
    }

    private function linkUserToCompany(User $user, int $companyId): void
    {
        if (!UserSchema::hasCompanyIdColumn()) {
            return;
        }

        if (!UserSchema::companyIdFor($user)) {
            $user->update(['company_id' => $companyId]);
        }
    }

    public function uploadLogoForUser(User $user, UploadedFile $file): Company
    {
        $company = $this->getOrCreateCompany($user);

        if ($company->logo_path) {
            Storage::disk('public')->delete($company->logo_path);
        }

        $path = $file->store('company-logos', 'public');
        $company->update(['logo_path' => $path]);

        return $company->fresh();
    }

    public function deleteLogoForUser(User $user): Company
    {
        $company = $this->getOrCreateCompany($user);

        if ($company->logo_path) {
            Storage::disk('public')->delete($company->logo_path);
            $company->update(['logo_path' => null]);
        }

        return $company->fresh();
    }

    public function getPrintHeaderForUser(User $user): array
    {
        $company = $this->getOrCreateCompany($user);
        $formatted = $this->formatCompany($company);

        return [
            'company_name' => $formatted['name'],
            'logo_url' => $formatted['logo_url'],
            'address_line' => $this->buildAddressLine($company),
            'email' => $formatted['email'],
            'phone' => $formatted['phone'],
            'tax_id' => $formatted['tax_id'],
            'registration_number' => $formatted['registration_number'],
        ];
    }

    private function buildAddressLine(Company $company): string
    {
        $parts = array_filter([
            $company->address,
            trim(($company->city ?? '') . ($company->state ? ', ' . $company->state : '')),
            trim(($company->zip ?? '') . ($company->country ? ' ' . $company->country : '')),
        ]);

        return implode(', ', $parts);
    }

    private function resolveLogoUrl(?string $logoPath): ?string
    {
        if (!$logoPath) {
            return null;
        }

        return rtrim(config('app.url'), '/') . '/storage/' . ltrim($logoPath, '/');
    }

    public function formatCompany(Company $company): array
    {
        return [
            'id' => $company->id,
            'name' => $company->name,
            'logo_url' => $this->resolveLogoUrl($company->logo_path),
            'industry' => $company->industry ?? '',
            'email' => $company->email ?? '',
            'phone' => $company->phone ?? '',
            'address' => $company->address ?? '',
            'city' => $company->city ?? '',
            'state' => $company->state ?? '',
            'zip' => $company->zip ?? '',
            'country' => $company->country ?? '',
            'tax_id' => $company->tax_id ?? '',
            'registration_number' => $company->registration_number ?? '',
            'currency' => $company->currency,
            'language' => $company->language,
        ];
    }
}
