<?php

namespace App\Services;

use App\Models\Item;
use App\Models\TaxSetting;
use App\Models\User;
use App\Models\VatRate;
use Exception;
use Illuminate\Support\Facades\DB;

class TaxSettingService
{
    private const VAT_TYPES = ['none', 'exclusive', 'inclusive'];

    public function __construct(private CompanySettingService $companySettingService)
    {
    }

    public function getForUser(User $user): array
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $setting = $this->getOrCreateSetting($company->id);
        $rates = VatRate::where('company_id', $company->id)
            ->orderBy('vat_code')
            ->get()
            ->map(fn (VatRate $r) => $this->formatRate($r))
            ->all();

        return [
            'settings' => $this->formatSetting($setting, $rates),
            'vat_rates' => $rates,
        ];
    }

    public function getPosTaxContextForUser(User $user): array
    {
        $data = $this->getForUser($user);
        $settings = $data['settings'];
        $defaultRate = null;
        if ($settings['default_vat_rate_id']) {
            $defaultRate = collect($data['vat_rates'])
                ->firstWhere('id', $settings['default_vat_rate_id']);
        }

        return [
            'allow_vat' => (bool) $settings['allow_vat'],
            'vat_type' => $settings['vat_type'],
            'default_vat_rate_id' => $settings['default_vat_rate_id'],
            'default_vat_rate' => $defaultRate,
            'vat_rates' => $data['vat_rates'],
        ];
    }

    public function updateSettingsForUser(User $user, array $data): array
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $setting = $this->getOrCreateSetting($company->id);
        $payload = [];

        if (array_key_exists('allow_vat', $data)) {
            $payload['allow_vat'] = (bool) $data['allow_vat'];
        }
        if (array_key_exists('vat_type', $data)) {
            $type = strtolower(trim((string) $data['vat_type']));
            if (!in_array($type, self::VAT_TYPES, true)) {
                throw new Exception('Invalid VAT type. Use none, exclusive, or inclusive.');
            }
            $payload['vat_type'] = $type;
        }
        if (array_key_exists('default_vat_rate_id', $data)) {
            $rateId = $data['default_vat_rate_id'];
            if ($rateId === null || $rateId === '') {
                $payload['default_vat_rate_id'] = null;
            } else {
                $rate = VatRate::where('company_id', $company->id)->where('id', (int) $rateId)->first();
                if (!$rate) {
                    throw new Exception('Default VAT rate not found.');
                }
                $payload['default_vat_rate_id'] = $rate->id;
            }
        }

        if ($payload !== []) {
            $setting->update($payload);
        }

        return $this->getForUser($user);
    }

    public function createVatRateForUser(User $user, array $data): array
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $code = trim((string) ($data['vat_code'] ?? ''));
        $desc = trim((string) ($data['vat_desc'] ?? ''));
        if ($code === '' || $desc === '') {
            throw new Exception('VAT code and description are required.');
        }

        if (VatRate::where('company_id', $company->id)->where('vat_code', $code)->exists()) {
            throw new Exception('VAT code already exists.');
        }

        VatRate::create([
            'company_id' => $company->id,
            'vat_code' => $code,
            'vat_desc' => $desc,
            'vat_rate' => round((float) ($data['vat_rate'] ?? 0), 2),
        ]);

        return $this->getForUser($user);
    }

    public function updateVatRateForUser(User $user, int $id, array $data): array
    {
        $rate = $this->findRateForUser($user, $id);
        $payload = [];

        if (array_key_exists('vat_code', $data)) {
            $code = trim((string) $data['vat_code']);
            if ($code === '') {
                throw new Exception('VAT code is required.');
            }
            $exists = VatRate::where('company_id', $rate->company_id)
                ->where('vat_code', $code)
                ->where('id', '!=', $id)
                ->exists();
            if ($exists) {
                throw new Exception('VAT code already exists.');
            }
            $payload['vat_code'] = $code;
        }
        if (array_key_exists('vat_desc', $data)) {
            $payload['vat_desc'] = trim((string) $data['vat_desc']);
        }
        if (array_key_exists('vat_rate', $data)) {
            $payload['vat_rate'] = round((float) $data['vat_rate'], 2);
        }

        if ($payload !== []) {
            $rate->update($payload);
        }

        return $this->getForUser($user);
    }

    public function deleteVatRateForUser(User $user, int $id): array
    {
        $rate = $this->findRateForUser($user, $id);
        $companyId = $rate->company_id;

        DB::transaction(function () use ($rate, $companyId) {
            Item::where('company_id', $companyId)->where('vat_rate_id', $rate->id)->update(['vat_rate_id' => null]);
            TaxSetting::where('company_id', $companyId)
                ->where('default_vat_rate_id', $rate->id)
                ->update(['default_vat_rate_id' => null]);
            $rate->delete();
        });

        return $this->getForUser($user);
    }

    public function assignVatToItemsForUser(User $user, array $data): array
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $itemIds = $data['item_ids'] ?? [];
        if (!is_array($itemIds) || $itemIds === []) {
            throw new Exception('Select at least one item.');
        }

        $vatRateId = $data['vat_rate_id'] ?? null;
        if ($vatRateId !== null && $vatRateId !== '') {
            $rate = VatRate::where('company_id', $company->id)->where('id', (int) $vatRateId)->first();
            if (!$rate) {
                throw new Exception('VAT rate not found.');
            }
            $vatRateId = $rate->id;
        } else {
            $vatRateId = null;
        }

        Item::where('company_id', $company->id)
            ->whereIn('id', array_map('intval', $itemIds))
            ->update(['vat_rate_id' => $vatRateId]);

        return $this->getForUser($user);
    }

    private function getOrCreateSetting(int $companyId): TaxSetting
    {
        $setting = TaxSetting::firstOrCreate(
            ['company_id' => $companyId],
            [
                'allow_vat' => false,
                'vat_type' => 'none',
                'default_vat_rate_id' => null,
            ]
        );

        if (VatRate::where('company_id', $companyId)->count() === 0) {
            $default = VatRate::create([
                'company_id' => $companyId,
                'vat_code' => '1',
                'vat_desc' => 'Default Tax',
                'vat_rate' => 0,
            ]);
            if (!$setting->default_vat_rate_id) {
                $setting->update(['default_vat_rate_id' => $default->id]);
            }
        }

        return $setting->fresh(['defaultVatRate']);
    }

    private function findRateForUser(User $user, int $id): VatRate
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $rate = VatRate::where('company_id', $company->id)->where('id', $id)->first();
        if (!$rate) {
            throw new Exception('VAT rate not found.');
        }

        return $rate;
    }

    private function formatRate(VatRate $rate): array
    {
        return [
            'id' => $rate->id,
            'vat_code' => $rate->vat_code,
            'vat_desc' => $rate->vat_desc,
            'vat_rate' => (float) $rate->vat_rate,
        ];
    }

    private function formatSetting(TaxSetting $setting, array $rates): array
    {
        $default = $setting->default_vat_rate_id
            ? collect($rates)->firstWhere('id', $setting->default_vat_rate_id)
            : null;

        return [
            'id' => $setting->id,
            'allow_vat' => (bool) $setting->allow_vat,
            'default_vat_rate_id' => $setting->default_vat_rate_id,
            'vat_type' => $setting->vat_type ?? 'none',
            'default_vat_rate' => $default,
        ];
    }
}
