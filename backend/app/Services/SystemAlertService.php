<?php

namespace App\Services;

use App\Models\Sale;
use App\Models\User;

class SystemAlertService
{
    public function __construct(
        private ItemService $itemService,
        private AlertSettingService $alertSettingService,
        private CompanySettingService $companySettingService,
    ) {
    }

    public function getAlertsForUser(User $user): array
    {
        $inventory = $this->itemService->getInventoryListForUser($user);
        $items = collect($inventory['items']);
        $summary = $inventory['summary'];
        $alertSettings = $inventory['alert_settings'] ?? $this->alertSettingService->getForUser($user);

        $company = $this->companySettingService->getCompanyForUser($user);
        $holdOrdersCount = Sale::where('company_id', $company->id)
            ->where('order_status', 'hold')
            ->count();

        $alerts = [];

        $expiredCount = (int) ($summary['expired_count'] ?? 0);
        if ($expiredCount > 0) {
            $alerts[] = $this->buildInventoryAlert(
                'expired',
                'error',
                'Expired stock',
                $expiredCount,
                'expired',
                $items->filter(
                    fn ($item) => (bool) ($item['has_expired_stock'] ?? false)
                        || ($item['expiry_status'] ?? '') === 'expired'
                ),
            );
        }

        $expiringSoonCount = (int) ($summary['expiring_soon_count'] ?? 0);
        if ($expiringSoonCount > 0) {
            $alerts[] = $this->buildInventoryAlert(
                'expiring_soon',
                'warning',
                'Expiring soon',
                $expiringSoonCount,
                'expiring_soon',
                $items->where('expiry_status', 'expiring_soon'),
            );
        }

        $lowStockCount = (int) ($summary['low_stock_count'] ?? 0);
        if ($lowStockCount > 0) {
            $alerts[] = $this->buildInventoryAlert(
                'low_stock',
                'warning',
                'Low stock',
                $lowStockCount,
                '/pos/inventory',
                $items->filter(function ($item) {
                    $qty = (float) ($item['qty'] ?? 0);
                    $reorder = (float) ($item['reorder_qty'] ?? 0);

                    return $reorder > 0 && $qty <= $reorder;
                }),
            );
        }

        $oversoldCount = (int) ($summary['oversold_count'] ?? 0);
        if ($oversoldCount > 0) {
            $alerts[] = $this->buildInventoryAlert(
                'oversold',
                'warning',
                'Oversold items',
                $oversoldCount,
                '/pos/inventory',
                $items->filter(fn ($item) => (float) ($item['qty'] ?? 0) < 0),
            );
        }

        if ($holdOrdersCount > 0) {
            $alerts[] = [
                'id' => 'hold_orders',
                'severity' => 'info',
                'title' => 'Held sales orders',
                'message' => $holdOrdersCount === 1
                    ? '1 sales order is on hold.'
                    : "{$holdOrdersCount} sales orders are on hold.",
                'count' => $holdOrdersCount,
                'link' => '/pos/sales',
                'items' => [],
            ];
        }

        return [
            'generated_at' => now()->format('Y-m-d H:i:s'),
            'total_count' => (int) collect($alerts)->sum('count'),
            'alert_count' => count($alerts),
            'summary' => array_merge($summary, [
                'hold_orders_count' => $holdOrdersCount,
            ]),
            'alert_settings' => $alertSettings,
            'alerts' => $alerts,
        ];
    }

    /**
     * @param \Illuminate\Support\Collection<int, array<string, mixed>> $matchedItems
     * @return array<string, mixed>
     */
    private function buildInventoryAlert(
        string $id,
        string $severity,
        string $title,
        int $count,
        string $linkOrExpiry,
        $matchedItems,
    ): array {
        $link = str_starts_with($linkOrExpiry, '/')
            ? $linkOrExpiry
            : "/pos/inventory?expiry={$linkOrExpiry}";

        $message = match ($id) {
            'expired' => $count === 1
                ? '1 item has expired stock — write off in Inventory.'
                : "{$count} items have expired stock — write off in Inventory.",
            'expiring_soon' => $count === 1
                ? '1 item is expiring within your alert period.'
                : "{$count} items are expiring within your alert period.",
            'low_stock' => $count === 1
                ? '1 item is at or below reorder level.'
                : "{$count} items are at or below reorder level.",
            'oversold' => $count === 1
                ? '1 item was sold below zero stock.'
                : "{$count} items were sold below zero stock.",
            default => "{$count} item(s) need attention.",
        };

        return [
            'id' => $id,
            'severity' => $severity,
            'title' => $title,
            'message' => $message,
            'count' => $count,
            'link' => $link,
            'items' => $matchedItems
                ->take(8)
                ->values()
                ->map(fn ($item) => [
                    'id' => $item['id'],
                    'item_number' => $item['item_number'],
                    'description' => $item['description'],
                    'location' => $item['location'],
                    'qty' => (float) ($item['qty'] ?? 0),
                    'uom' => $item['uom'] ?? 'pcs',
                    'nearest_expiry_date' => $item['nearest_expiry_date'] ?? null,
                    'reorder_qty' => (float) ($item['reorder_qty'] ?? 0),
                ])
                ->all(),
        ];
    }
}
