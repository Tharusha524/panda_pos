<?php

namespace App\Services;

use App\Models\HardwareSetting;
use App\Models\User;
use Exception;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class HardwareSettingService
{
    private const BOOLEAN_FIELDS = [
        'allow_auto_print',
        'allow_multiple_printers',
        'allow_customer_display',
        'allow_company_details_receipt',
        'allow_custom_header_on_sales_receipt',
        'allow_dual_language_print',
        'show_barcode_on_sales_receipt',
        'show_item_uom_on_sales_receipt',
        'allow_customer_details_on_sales_receipt',
        'allow_discount_on_sales_receipt',
        'allow_logo_on_sales_receipt',
    ];

    private const PAPER_SIZES = ['a4', 'a5', '80mm', 'letter'];

    private const RECEIPT_STYLES = ['style_1', 'style_2', 'style_3', 'style_4'];

    private const LETTERHEAD_MARGINS = ['none', '5', '10', '15', '20'];

    public function getForUser(User $user): array
    {
        return $this->formatSetting($this->getOrCreateSetting($user));
    }

    public function updateForUser(User $user, array $data): array
    {
        $setting = $this->getOrCreateSetting($user);
        $payload = [];

        foreach (self::BOOLEAN_FIELDS as $field) {
            if (array_key_exists($field, $data)) {
                $payload[$field] = (bool) $data[$field];
            }
        }

        if (array_key_exists('printing_paper_size', $data)) {
            $size = strtolower((string) $data['printing_paper_size']);
            if (!in_array($size, self::PAPER_SIZES, true)) {
                throw new Exception('Invalid printing paper size.');
            }
            $payload['printing_paper_size'] = $size;
        }

        if (array_key_exists('sales_receipt_printout_style', $data)) {
            $style = strtolower((string) $data['sales_receipt_printout_style']);
            if (!in_array($style, self::RECEIPT_STYLES, true)) {
                throw new Exception('Invalid sales receipt printout style.');
            }
            $payload['sales_receipt_printout_style'] = $style;
        }

        if (array_key_exists('letterhead_top_margin_cm', $data)) {
            $margin = strtolower((string) $data['letterhead_top_margin_cm']);
            if (!in_array($margin, self::LETTERHEAD_MARGINS, true)) {
                throw new Exception('Invalid letterhead top margin.');
            }
            $payload['letterhead_top_margin_cm'] = $margin;
        }

        foreach ([
            'customize_label_for_discount',
            'custom_header_name',
            'custom_header_address',
            'custom_header_phone',
        ] as $field) {
            if (array_key_exists($field, $data)) {
                $payload[$field] = $data[$field];
            }
        }

        if ($payload !== []) {
            $setting->update($payload);
        }

        return $this->formatSetting($setting->fresh());
    }

    public function uploadLogo80mmForUser(User $user, UploadedFile $file): array
    {
        $setting = $this->getOrCreateSetting($user);
        $this->deleteStoredFile($setting->logo_80mm_path);
        $path = $file->store('hardware-logos/80mm', 'public');
        $setting->update(['logo_80mm_path' => $path]);

        return $this->formatSetting($setting->fresh());
    }

    public function uploadLogoA4ForUser(User $user, UploadedFile $file): array
    {
        $setting = $this->getOrCreateSetting($user);
        $this->deleteStoredFile($setting->logo_a4_a5_path);
        $path = $file->store('hardware-logos/a4-a5', 'public');
        $setting->update(['logo_a4_a5_path' => $path]);

        return $this->formatSetting($setting->fresh());
    }

    public function deleteLogo80mmForUser(User $user): array
    {
        $setting = $this->getOrCreateSetting($user);
        $this->deleteStoredFile($setting->logo_80mm_path);
        $setting->update(['logo_80mm_path' => null]);

        return $this->formatSetting($setting->fresh());
    }

    public function deleteLogoA4ForUser(User $user): array
    {
        $setting = $this->getOrCreateSetting($user);
        $this->deleteStoredFile($setting->logo_a4_a5_path);
        $setting->update(['logo_a4_a5_path' => null]);

        return $this->formatSetting($setting->fresh());
    }

    public function openCashDrawer(): array
    {
        return [
            'opened' => true,
            'message' => 'Cash drawer command sent.',
        ];
    }

    private function getOrCreateSetting(User $user): HardwareSetting
    {
        return HardwareSetting::firstOrCreate(
            ['user_id' => $user->id],
            [
                'printing_paper_size' => 'a4',
                'sales_receipt_printout_style' => 'style_4',
                'allow_auto_print' => true,
                'allow_multiple_printers' => false,
                'allow_customer_display' => false,
                'allow_company_details_receipt' => true,
                'allow_custom_header_on_sales_receipt' => true,
                'allow_dual_language_print' => false,
                'show_barcode_on_sales_receipt' => false,
                'show_item_uom_on_sales_receipt' => true,
                'allow_customer_details_on_sales_receipt' => false,
                'allow_discount_on_sales_receipt' => true,
                'allow_logo_on_sales_receipt' => true,
                'customize_label_for_discount' => 'Your Discount',
                'letterhead_top_margin_cm' => 'none',
            ]
        );
    }

    private function formatSetting(HardwareSetting $setting): array
    {
        $data = ['id' => $setting->id];

        foreach (self::BOOLEAN_FIELDS as $field) {
            $data[$field] = (bool) $setting->{$field};
        }

        $data['printing_paper_size'] = $setting->printing_paper_size;
        $data['sales_receipt_printout_style'] = $setting->sales_receipt_printout_style;
        $data['custom_header_name'] = $setting->custom_header_name ?? '';
        $data['custom_header_address'] = $setting->custom_header_address ?? '';
        $data['custom_header_phone'] = $setting->custom_header_phone ?? '';
        $data['customize_label_for_discount'] = $setting->customize_label_for_discount;
        $data['letterhead_top_margin_cm'] = $setting->letterhead_top_margin_cm;
        $data['logo_80mm_url'] = $this->resolveFileUrl($setting->logo_80mm_path);
        $data['logo_a4_a5_url'] = $this->resolveFileUrl($setting->logo_a4_a5_path);

        return $data;
    }

    private function resolveFileUrl(?string $path): ?string
    {
        if (!$path) {
            return null;
        }

        return rtrim(config('app.url'), '/') . '/storage/' . ltrim($path, '/');
    }

    private function deleteStoredFile(?string $path): void
    {
        if ($path) {
            Storage::disk('public')->delete($path);
        }
    }
}
