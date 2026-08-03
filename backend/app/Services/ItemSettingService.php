<?php

namespace App\Services;

use App\Models\ItemSetting;
use App\Models\User;

class ItemSettingService
{
    /** @var list<string> */
    public const DEFAULT_UOM_OPTIONS = ['pcs', 'kg', 'g', 'l', 'ml', 'box', 'pack', 'dozen'];

    private const BOOLEAN_FIELDS = [
        'allow_auto_number',
        'allow_item_discount',
        'allow_wholesale_price',
        'allow_upload_item_image',
        'allow_variant_in_add_item',
        'allow_quick_add_item_in_sales_screen',
        'allow_favorite_items_on_sales_screen',
        'allow_editing_purchase_price_in_inventory_dashboard',
        'allow_total_price_entry_on_sales_screen',
    ];

    public function getForUser(User $user): array
    {
        $setting = $this->getOrCreateSetting($user);

        return $this->formatSetting($setting);
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

        if ($payload !== []) {
            $setting->update($payload);
        }

        if (array_key_exists('uom_options', $data)) {
            $setting->uom_options = $this->normalizeUomOptions($data['uom_options']);
            $setting->save();
        }

        return $this->formatSetting($setting->fresh());
    }

    /**
     * @param  mixed  $options
     * @return list<string>
     */
    public function normalizeUomOptions(mixed $options): array
    {
        if (!is_array($options)) {
            throw new \Exception('Unit of measure list must be an array.');
        }

        $normalized = [];
        foreach ($options as $raw) {
            $value = strtolower(trim((string) $raw));
            if ($value === '') {
                continue;
            }
            if (!preg_match('/^[a-z0-9._-]{1,20}$/', $value)) {
                throw new \Exception(
                    "Invalid unit \"{$value}\". Use 1–20 letters, numbers, dots, dashes, or underscores."
                );
            }
            if (!in_array($value, $normalized, true)) {
                $normalized[] = $value;
            }
        }

        if ($normalized === []) {
            throw new \Exception('At least one unit of measure is required.');
        }

        if (!in_array('pcs', $normalized, true)) {
            array_unshift($normalized, 'pcs');
        }

        return array_values($normalized);
    }

    /** @return list<string> */
    private function resolveUomOptions(ItemSetting $setting): array
    {
        $stored = $setting->uom_options;
        if (is_array($stored) && $stored !== []) {
            try {
                return $this->normalizeUomOptions($stored);
            } catch (\Exception) {
                // fall through to defaults if stored data is corrupt
            }
        }

        return self::DEFAULT_UOM_OPTIONS;
    }

    private function getOrCreateSetting(User $user): ItemSetting
    {
        return ItemSetting::firstOrCreate(
            ['user_id' => $user->id],
            [
                'allow_auto_number' => true,
                'allow_item_discount' => true,
                'allow_wholesale_price' => true,
                'allow_upload_item_image' => false,
                'allow_variant_in_add_item' => true,
                'allow_quick_add_item_in_sales_screen' => true,
                'allow_favorite_items_on_sales_screen' => true,
                'allow_editing_purchase_price_in_inventory_dashboard' => true,
                'allow_total_price_entry_on_sales_screen' => true,
                'uom_options' => self::DEFAULT_UOM_OPTIONS,
            ]
        );
    }

    private function formatSetting(ItemSetting $setting): array
    {
        $data = ['id' => $setting->id];

        foreach (self::BOOLEAN_FIELDS as $field) {
            $data[$field] = (bool) $setting->{$field};
        }

        $data['uom_options'] = $this->resolveUomOptions($setting);

        return $data;
    }
}
