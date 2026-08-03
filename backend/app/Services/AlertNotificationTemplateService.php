<?php

namespace App\Services;

use Illuminate\Support\Facades\View;

class AlertNotificationTemplateService
{
    /** Brand color aligned with POS UI (--pallet-blue). */
    private const BRAND_PRIMARY = '#00327e';

    /**
     * @param array<string, mixed> $alerts
     * @return array{email_subject: string, email_html: string, email_text: string, sms_body: string}
     */
    public function build(string $recipientName, array $alerts, bool $isTest, ?string $companyName = null): array
    {
        $appName = config('app.name', 'Sky Smart Software');
        $generatedAt = $alerts['generated_at'] ?? now()->format('Y-m-d H:i:s');
        $summaryRows = $this->buildSummaryRows($alerts['summary'] ?? []);
        $alertSections = $this->buildAlertSections($alerts['alerts'] ?? []);
        $prefix = $isTest ? '[TEST] ' : '';
        $subject = $prefix . $appName . ' inventory alerts';

        $viewData = [
            'appName' => $appName,
            'brandColor' => self::BRAND_PRIMARY,
            'recipientName' => $recipientName,
            'companyName' => $companyName,
            'isTest' => $isTest,
            'generatedAt' => $generatedAt,
            'summaryRows' => $summaryRows,
            'alertSections' => $alertSections,
            'totalCount' => (int) ($alerts['total_count'] ?? 0),
            'posUrl' => rtrim((string) config('app.url', ''), '/'),
        ];

        return [
            'email_subject' => $subject,
            'email_html' => View::make('emails.inventory-alerts', $viewData)->render(),
            'email_text' => $this->buildPlainText($viewData),
            'sms_body' => $this->buildSmsBody($appName, $summaryRows, $isTest),
        ];
    }

    /**
     * Sample message for owner preview in settings UI.
     *
     * @return array{email_subject: string, email_html: string, email_text: string, sms_body: string}
     */
    public function buildPreviewSample(): array
    {
        return $this->build(
            'Sample User',
            $this->sampleAlerts(),
            true,
            'Sample Company',
        );
    }

    /**
     * @param array<string, mixed> $summary
     * @return list<array{key: string, label: string, count: int, tone: string}>
     */
    private function buildSummaryRows(array $summary): array
    {
        $rows = [];
        foreach ([
            'expired_count' => ['Expired stock', 'error'],
            'expiring_soon_count' => ['Expiring soon', 'warning'],
            'low_stock_count' => ['Low stock', 'warning'],
            'oversold_count' => ['Oversold', 'warning'],
            'hold_orders_count' => ['Held orders', 'info'],
        ] as $key => [$label, $tone]) {
            $count = (int) ($summary[$key] ?? 0);
            if ($count > 0) {
                $rows[] = [
                    'key' => $key,
                    'label' => $label,
                    'count' => $count,
                    'tone' => $tone,
                ];
            }
        }

        if ($rows === []) {
            $rows[] = [
                'key' => 'none',
                'label' => 'No active alerts',
                'count' => 0,
                'tone' => 'success',
            ];
        }

        return $rows;
    }

    /**
     * @param list<array<string, mixed>> $alerts
     * @return list<array<string, mixed>>
     */
    private function buildAlertSections(array $alerts): array
    {
        $sections = [];

        foreach ($alerts as $alert) {
            $severity = (string) ($alert['severity'] ?? 'info');
            $sections[] = [
                'id' => $alert['id'] ?? 'alert',
                'title' => $alert['title'] ?? 'Alert',
                'message' => $alert['message'] ?? '',
                'count' => (int) ($alert['count'] ?? 0),
                'severity' => $severity,
                'tone' => $this->severityTone($severity),
                'items' => array_slice($alert['items'] ?? [], 0, 5),
                'moreCount' => max(0, count($alert['items'] ?? []) - 5),
            ];
        }

        return $sections;
    }

    private function severityTone(string $severity): string
    {
        return match ($severity) {
            'error' => 'error',
            'warning' => 'warning',
            default => 'info',
        };
    }

    /**
     * @param array<string, mixed> $viewData
     */
    private function buildPlainText(array $viewData): string
    {
        $lines = [];
        $lines[] = 'Hello ' . ($viewData['recipientName'] ?? 'there') . ',';
        $lines[] = '';

        if ($viewData['isTest'] ?? false) {
            $lines[] = 'This is a test notification from your POS alert system.';
        } else {
            $lines[] = 'Here is your inventory alert summary:';
        }
        $lines[] = '';

        foreach ($viewData['summaryRows'] ?? [] as $row) {
            if (($row['count'] ?? 0) > 0) {
                $lines[] = ($row['label'] ?? 'Alert') . ': ' . $row['count'];
            } elseif (($row['key'] ?? '') === 'none') {
                $lines[] = 'No active inventory alerts at this time.';
            }
        }

        foreach ($viewData['alertSections'] ?? [] as $section) {
            $lines[] = '';
            $lines[] = strtoupper($section['title'] ?? 'Alert') . ' (' . ($section['count'] ?? 0) . ')';
            $lines[] = $section['message'] ?? '';
            foreach ($section['items'] ?? [] as $item) {
                $lines[] = sprintf(
                    '- %s %s (%s) qty %s %s',
                    $item['item_number'] ?? '',
                    $item['description'] ?? '',
                    $item['location'] ?? '',
                    $item['qty'] ?? 0,
                    $item['uom'] ?? '',
                );
            }
            if (($section['moreCount'] ?? 0) > 0) {
                $lines[] = '… and ' . $section['moreCount'] . ' more item(s). Open POS for full list.';
            }
        }

        $lines[] = '';
        $lines[] = 'Open your POS app → Inventory or click the bell icon for details.';
        $lines[] = 'Generated at: ' . ($viewData['generatedAt'] ?? '');

        return implode("\n", $lines);
    }

    /**
     * @param list<array{label: string, count: int, key?: string}> $summaryRows
     */
    private function buildSmsBody(string $appName, array $summaryRows, bool $isTest): string
    {
        $prefix = $isTest ? '[TEST] ' : '';
        $parts = [];

        foreach ($summaryRows as $row) {
            if (($row['count'] ?? 0) > 0) {
                $parts[] = $row['count'] . ' ' . strtolower($row['label']);
            } elseif (($row['key'] ?? '') === 'none') {
                $parts[] = 'no alerts';
            }
        }

        $summary = implode(', ', $parts);
        $body = $prefix . $appName . ' alerts: ' . $summary . '. Open POS → Inventory or bell icon.';

        if (strlen($body) > 320) {
            $body = substr($body, 0, 317) . '…';
        }

        return $body;
    }

    /**
     * @return array<string, mixed>
     */
    private function sampleAlerts(): array
    {
        return [
            'generated_at' => now()->format('Y-m-d H:i:s'),
            'total_count' => 4,
            'alert_count' => 2,
            'summary' => [
                'expired_count' => 1,
                'expiring_soon_count' => 2,
                'low_stock_count' => 1,
                'oversold_count' => 0,
                'hold_orders_count' => 0,
            ],
            'alerts' => [
                [
                    'id' => 'expired',
                    'severity' => 'error',
                    'title' => 'Expired stock',
                    'message' => '1 item has expired stock — write off in Inventory.',
                    'count' => 1,
                    'items' => [
                        [
                            'item_number' => 'SKU-1001',
                            'description' => 'Organic milk 1L',
                            'location' => 'Main store',
                            'qty' => 3,
                            'uom' => 'pcs',
                        ],
                    ],
                ],
                [
                    'id' => 'low_stock',
                    'severity' => 'warning',
                    'title' => 'Low stock',
                    'message' => '1 item is at or below reorder level.',
                    'count' => 1,
                    'items' => [
                        [
                            'item_number' => 'SKU-2044',
                            'description' => 'Paper towels 6-pack',
                            'location' => 'Warehouse',
                            'qty' => 2,
                            'uom' => 'pcs',
                        ],
                    ],
                ],
            ],
        ];
    }
}
