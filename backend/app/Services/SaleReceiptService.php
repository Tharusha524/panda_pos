<?php

namespace App\Services;

use App\Models\Item;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use Exception;

class SaleReceiptService
{
    public function __construct(
        private CompanySettingService $companySettingService,
        private HardwareSettingService $hardwareSettingService,
    ) {
    }

    /**
     * Receipt print payload for a completed sale (respects hardware settings).
     */
    public function getReceiptForUser(User $user, int $saleId, ?string $language = null): array
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $sale = Sale::where('company_id', $company->id)
            ->where('id', $saleId)
            ->with('items')
            ->first();

        if (!$sale) {
            throw new Exception('Sale not found');
        }

        return $this->buildReceiptPayload($user, $this->formatSale($sale), $language);
    }

    /**
     * Build receipt from sale array (e.g. immediately after create).
     */
    public function buildReceiptFromSale(User $user, array $sale, ?string $language = null): array
    {
        return $this->buildReceiptPayload($user, $sale, $language);
    }

    public function getPrintContextForUser(User $user): array
    {
        $hardware = $this->hardwareSettingService->getForUser($user);
        $companyHeader = $this->companySettingService->getPrintHeaderForUser($user);

        return [
            'hardware_settings' => $hardware,
            'company_header' => $companyHeader,
            'resolved_header' => $this->resolveHeader($hardware, $companyHeader),
        ];
    }

    private function buildReceiptPayload(User $user, array $sale, ?string $language): array
    {
        $hardware = $this->hardwareSettingService->getForUser($user);
        $companyHeader = $this->companySettingService->getPrintHeaderForUser($user);
        $resolvedHeader = $this->resolveHeader($hardware, $companyHeader);

        $company = $this->companySettingService->getCompanyForUser($user);
        $itemUoms = $this->loadItemUoms($company->id, $sale['items'] ?? []);

        $lines = [];
        foreach ($sale['items'] ?? [] as $line) {
            $row = [
                'item_number' => $line['item_number'] ?? null,
                'description' => $line['description'] ?? '',
                'qty' => (float) ($line['qty'] ?? 0),
                'unit_price' => (float) ($line['unit_price'] ?? 0),
                'line_total' => (float) ($line['line_total'] ?? 0),
            ];
            if ($hardware['show_item_uom_on_sales_receipt']) {
                $itemId = $line['item_id'] ?? null;
                $row['uom'] = $itemId ? ($itemUoms[$itemId] ?? null) : null;
            }
            $lines[] = $row;
        }

        $transactionType = (string) ($sale['transaction_type'] ?? OrderTransactionService::TRANSACTION_TYPE_SALE);
        $isReturn = OrderTransactionService::isSalesReturn($transactionType);

        $receipt = [
            'sales_id' => $sale['sales_id'],
            'transaction_type' => $transactionType,
            'is_return' => $isReturn,
            'sale_date' => $sale['sale_date'],
            'location' => $sale['location'],
            'payment_method' => $sale['payment_method'],
            'customer_name' => $hardware['allow_customer_details_on_sales_receipt']
                ? ($sale['customer_name'] ?? null)
                : null,
            'sub_total' => (float) $sale['sub_total'],
            'discount' => $hardware['allow_discount_on_sales_receipt']
                ? (float) $sale['discount']
                : 0.0,
            'service_charge' => (float) ($sale['service_charge'] ?? 0),
            'card_payment_charge' => (float) ($sale['card_payment_charge'] ?? 0),
            'net_amount' => (float) $sale['net_amount'],
            'amount_received' => $sale['amount_received'] !== null ? (float) $sale['amount_received'] : null,
            'cheque_number' => $sale['cheque_number'] ?? null,
            'lines' => $lines,
            'show_barcode' => (bool) $hardware['show_barcode_on_sales_receipt'],
            'barcode_value' => $hardware['show_barcode_on_sales_receipt'] ? $sale['sales_id'] : null,
        ];

        if (!$hardware['allow_discount_on_sales_receipt']) {
            $receipt['discount_label'] = null;
        } else {
            $receipt['discount_label'] = $hardware['customize_label_for_discount'] ?: 'Your Discount';
        }

        $labels = $this->labelsForLanguage($language, $hardware['allow_dual_language_print']);
        if ($isReturn) {
            $labels['receipt_title'] = 'Sales Return Receipt';
        }

        return [
            'sale' => $receipt,
            'header' => $resolvedHeader,
            'hardware_settings' => $hardware,
            'print_options' => [
                'printing_paper_size' => $hardware['printing_paper_size'],
                'sales_receipt_printout_style' => $hardware['sales_receipt_printout_style'],
                'letterhead_top_margin_cm' => $hardware['letterhead_top_margin_cm'],
                'allow_auto_print' => (bool) $hardware['allow_auto_print'],
                'allow_dual_language_print' => (bool) $hardware['allow_dual_language_print'],
                'logo_url' => $this->resolveLogoUrl($hardware),
                'allow_logo_on_sales_receipt' => (bool) $hardware['allow_logo_on_sales_receipt'],
            ],
            'labels' => $labels,
        ];
    }

    /**
     * @param  array<string, mixed>  $hardware
     * @param  array<string, mixed>  $companyHeader
     * @return array<string, mixed>
     */
    private function resolveHeader(array $hardware, array $companyHeader): array
    {
        if ($hardware['allow_custom_header_on_sales_receipt']) {
            $name = trim((string) ($hardware['custom_header_name'] ?? ''));
            $address = trim((string) ($hardware['custom_header_address'] ?? ''));
            $phone = trim((string) ($hardware['custom_header_phone'] ?? ''));

            if ($name !== '' || $address !== '' || $phone !== '') {
                return [
                    'company_name' => $name ?: $companyHeader['company_name'],
                    'address_line' => $address ?: ($companyHeader['address_line'] ?? ''),
                    'phone' => $phone ?: ($companyHeader['phone'] ?? ''),
                    'email' => $companyHeader['email'] ?? '',
                    'tax_id' => $companyHeader['tax_id'] ?? null,
                    'registration_number' => $companyHeader['registration_number'] ?? null,
                    'logo_url' => null,
                    'source' => 'custom',
                ];
            }
        }

        if (!$hardware['allow_company_details_receipt']) {
            return [
                'company_name' => $companyHeader['company_name'] ?? 'Company',
                'address_line' => '',
                'phone' => '',
                'email' => '',
                'tax_id' => null,
                'registration_number' => null,
                'logo_url' => null,
                'source' => 'minimal',
            ];
        }

        return array_merge($companyHeader, ['source' => 'company']);
    }

    /**
     * @param  array<string, mixed>  $hardware
     */
    private function resolveLogoUrl(array $hardware): ?string
    {
        if (!$hardware['allow_logo_on_sales_receipt']) {
            return null;
        }

        $paper = strtolower((string) $hardware['printing_paper_size']);
        if ($paper === '80mm') {
            return $hardware['logo_80mm_url'] ?? $hardware['logo_a4_a5_url'] ?? null;
        }

        return $hardware['logo_a4_a5_url'] ?? $hardware['logo_80mm_url'] ?? null;
    }

    /**
     * @param  array<int, array<string, mixed>>  $lines
     * @return array<int, string|null>
     */
    private function loadItemUoms(int $companyId, array $lines): array
    {
        $ids = [];
        foreach ($lines as $line) {
            if (!empty($line['item_id'])) {
                $ids[] = (int) $line['item_id'];
            }
        }
        if ($ids === []) {
            return [];
        }

        return Item::where('company_id', $companyId)
            ->whereIn('id', array_unique($ids))
            ->pluck('uom', 'id')
            ->all();
    }

    /**
     * @return array<string, string>
     */
    private function labelsForLanguage(?string $language, bool $dualEnabled): array
    {
        $lang = strtolower(trim((string) $language));
        if (!$dualEnabled || $lang === '' || $lang === 'en') {
            return $this->englishLabels();
        }

        if ($lang === 'si') {
            return [
                'receipt_title' => 'විකුණුම් රිසිට්පත',
                'sales_id' => 'විකිණීම් අංකය',
                'date' => 'දිනය',
                'location' => 'ස්ථානය',
                'customer' => 'පාරිභෝගික',
                'item_no' => 'අයිතම අංකය',
                'description' => 'විස්තර',
                'qty' => 'ප්‍රමාණය',
                'uom' => 'මිනුම',
                'unit_price' => 'ඒකක මිල',
                'total' => 'මුළු',
                'sub_total' => 'උප එකතුව',
                'discount' => 'වට්ටම',
                'service_charge' => 'සේවා ගාස්තු',
                'card_charge' => 'කාඩ් ගාස්තු',
                'net_amount' => 'ශුද්ධ මුදල',
                'payment' => 'ගෙවීම',
                'received' => 'ලැබුණු',
                'change' => 'ඉතිරි',
                'thank_you' => 'ඔබේ ව්‍යාපාරයට ස්තූතියි',
            ];
        }

        return $this->englishLabels();
    }

    /**
     * @return array<string, string>
     */
    private function formatSale(Sale $sale): array
    {
        $items = $sale->items;

        return [
            'id' => $sale->id,
            'sales_id' => $sale->sales_id,
            'sale_date' => $sale->sale_date->format('Y-m-d'),
            'location' => $sale->location,
            'customer_name' => $sale->customer_name,
            'payment_method' => $sale->payment_method,
            'sub_total' => (float) $sale->sub_total,
            'discount' => (float) $sale->discount,
            'service_charge' => (float) ($sale->service_charge ?? 0),
            'card_payment_charge' => (float) ($sale->card_payment_charge ?? 0),
            'net_amount' => (float) $sale->net_amount,
            'amount_received' => $sale->amount_received !== null ? (float) $sale->amount_received : null,
            'cheque_number' => $sale->cheque_number,
            'items' => $items->map(fn (SaleItem $line) => [
                'item_id' => $line->item_id,
                'item_number' => $line->item_number,
                'description' => $line->description,
                'qty' => (float) $line->qty,
                'unit_price' => (float) $line->unit_price,
                'line_total' => (float) $line->line_total,
            ])->values()->all(),
        ];
    }

    private function englishLabels(): array
    {
        return [
            'receipt_title' => 'Sales Receipt / Bill',
            'sales_id' => 'Sales ID',
            'date' => 'Date',
            'location' => 'Location',
            'customer' => 'Customer',
            'item_no' => 'Item No',
            'description' => 'Description',
            'qty' => 'Qty',
            'uom' => 'UOM',
            'unit_price' => 'Unit (Rs)',
            'total' => 'Total (Rs)',
            'sub_total' => 'Sub Total',
            'discount' => 'Discount',
            'service_charge' => 'Service Charge',
            'card_charge' => 'Card Charge',
            'net_amount' => 'Net Amount',
            'payment' => 'Payment',
            'received' => 'Received',
            'change' => 'Change',
            'thank_you' => 'Thank you for your business',
        ];
    }
}
