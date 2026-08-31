<?php

namespace App\Services;

use App\Models\Item;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Supplier;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\DB;

class PurchaseService
{
    public const PURCHASE_TYPE_PURCHASE = '1001';

    public const PURCHASE_TYPE_RETURN = '1002';

    public const PURCHASE_TYPE_ORDER = '1003';

    private const DEFAULT_PURCHASE_TYPES = [
        self::PURCHASE_TYPE_PURCHASE,
        self::PURCHASE_TYPE_RETURN,
        self::PURCHASE_TYPE_ORDER,
    ];

    public static function isPurchaseReturn(?string $purchaseType): bool
    {
        return trim((string) $purchaseType) === self::PURCHASE_TYPE_RETURN;
    }

    public function __construct(
        private CompanySettingService $companySettingService,
        private PaymentService $paymentService,
        private LocationService $locationService,
        private BatchStockService $batchStockService,
        private SupplierBalanceService $supplierBalanceService,
    ) {
    }

    public function getAllForUser(
        User $user,
        ?string $purchaseType = null,
        ?string $location = null,
        ?string $dateFrom = null,
        ?string $dateTo = null,
    ): array {
        $company = $this->companySettingService->getCompanyForUser($user);
        $companyId = $company->id;

        $this->backfillReturnedFromPurchaseLinks($companyId);

        $query = Purchase::where('company_id', $companyId);
        $this->applyListFilters($query, $purchaseType, $location, $dateFrom, $dateTo);

        $purchases = $query
            ->with('items')
            ->orderByDesc('purchase_date')
            ->orderByDesc('id')
            ->get();

        $fullyReturnedSourceIds = $this->getFullyReturnedSourcePurchaseIdMap($companyId);

        $purchases = $purchases
            ->map(function (Purchase $p) use ($companyId, $fullyReturnedSourceIds) {
                $formatted = $this->formatPurchase($p);

                return $this->attachPurchaseReturnStatus($formatted, $companyId, $fullyReturnedSourceIds);
            });

        $summaryQuery = Purchase::where('company_id', $companyId);
        $this->applyListFilters($summaryQuery, $purchaseType, $location, $dateFrom, $dateTo);

        return [
            'purchases' => $purchases,
            'returned_purchase_ids' => array_map('intval', array_keys($fullyReturnedSourceIds)),
            'summary' => [
                'total_purchases' => $purchases->count(),
                'total_purchase_amount' => round((float) $summaryQuery->sum('amount'), 2),
            ],
            'filters' => $this->getFilterOptions($companyId),
            'payment_methods' => PaymentService::defaultPaymentMethods(),
        ];
    }

    public function getForUser(User $user, int $id): array
    {
        $purchase = $this->findForUser($user, $id);
        $purchase->load('items');

        $formatted = $this->formatPurchase($purchase);
        $fullyReturnedMap = $this->getFullyReturnedSourcePurchaseIdMap((int) $purchase->company_id);
        $formatted = $this->attachPurchaseReturnStatus($formatted, (int) $purchase->company_id, $fullyReturnedMap);

        if (!self::isPurchaseReturn($purchase->purchase_type)) {
            $formatted['remaining_return_items'] = $this->buildRemainingReturnItems($purchase);
        }

        return $formatted;
    }

    public function createForUser(User $user, array $data): array
    {
        $company = $this->companySettingService->getCompanyForUser($user);

        return DB::transaction(function () use ($user, $company, $data) {
            $data['location'] = $this->locationService->assertValidForUser($user, $data['location'] ?? null);
            $payload = $this->buildAttributes($company->id, $data);

            $lines = $this->normalizeLineItems($company->id, $data['items'] ?? []);
            if ($lines === []) {
                throw new Exception('Add at least one product to the purchase.');
            }

            if (self::isPurchaseReturn((string) ($payload['purchase_type'] ?? ''))) {
                $sourceId = (int) ($data['returned_from_purchase_id'] ?? $payload['returned_from_purchase_id'] ?? 0);
                if ($sourceId <= 0) {
                    $resolved = $this->resolveReturnedFromPurchaseIdFromNotes(
                        $company->id,
                        (string) ($payload['notes'] ?? $data['notes'] ?? '')
                    );
                    $sourceId = $resolved ?? 0;
                }
                if ($sourceId > 0) {
                    $payload['returned_from_purchase_id'] = $sourceId;
                    $this->assertReturnWithinRemainingQty($company->id, $sourceId, $lines);
                }
            }

            if ($lines !== []) {
                $payload['sub_total'] = round(array_sum(array_column($lines, 'line_total')), 2);
                $payload['amount'] = round($payload['sub_total'] - ($payload['discount'] ?? 0), 2);
            }

            $invoiceId = $payload['invoice_id'];
            if (Purchase::where('company_id', $company->id)->where('invoice_id', $invoiceId)->exists()) {
                throw new Exception('Invoice ID already exists.');
            }

            $purchase = Purchase::create($payload);
            $purchaseItems = $this->syncLineItems($purchase, $lines);

            if (
                self::isPurchaseReturn((string) ($payload['purchase_type'] ?? ''))
                && !empty($payload['returned_from_purchase_id'])
                && (int) $purchase->returned_from_purchase_id !== (int) $payload['returned_from_purchase_id']
            ) {
                $purchase->forceFill(['returned_from_purchase_id' => (int) $payload['returned_from_purchase_id']])->save();
            }

            $this->batchStockService->applyPurchaseStock($purchase, $lines, $purchaseItems, $user);
            $freshPurchase = $purchase->fresh();
            $this->paymentService->syncFromPurchase($freshPurchase);
            $this->supplierBalanceService->applyPurchaseEffect($freshPurchase);

            return $this->formatPurchase($freshPurchase->load('items'));
        });
    }

    public function updateForUser(User $user, int $id, array $data): array
    {
        $purchase = $this->findForUser($user, $id);
        $purchase->load('items');

        return DB::transaction(function () use ($user, $purchase, $data) {
            $previousLocation = $purchase->location;
            $previousLines = $this->inventoryLinesFromPurchase($purchase);
            $previousWasReturn = self::isPurchaseReturn($purchase->purchase_type);

            if (array_key_exists('location', $data)) {
                $data['location'] = $this->locationService->assertValidForUser($user, $data['location']);
            }
            $payload = $this->buildAttributes($purchase->company_id, $data, $purchase);
            $lines = $this->normalizeLineItems($purchase->company_id, $data['items'] ?? null);

            if ($lines !== null) {
                if ($lines === []) {
                    throw new Exception('Add at least one product to the purchase.');
                }
                $payload['sub_total'] = round(array_sum(array_column($lines, 'line_total')), 2);
                $payload['amount'] = round($payload['sub_total'] - ($payload['discount'] ?? 0), 2);
            }

            if (isset($payload['invoice_id'])) {
                $exists = Purchase::where('company_id', $purchase->company_id)
                    ->where('invoice_id', $payload['invoice_id'])
                    ->where('id', '!=', $purchase->id)
                    ->exists();
                if ($exists) {
                    throw new Exception('Invoice ID already exists.');
                }
            }

            $beforePurchase = $purchase->fresh();

            $purchase->update($payload);
            $purchase->refresh();

            $newLocation = $purchase->location;

            if ($lines !== null) {
                $this->batchStockService->reversePurchaseStock(
                    $purchase->company_id,
                    $previousLines,
                    $previousLocation,
                    $previousWasReturn,
                );
                $purchase->items()->delete();
                $purchaseItems = $this->syncLineItems($purchase, $lines);
                $this->batchStockService->applyPurchaseStock($purchase->fresh(), $lines, $purchaseItems, $user);
            } elseif (isset($payload['location']) && $payload['location'] !== $previousLocation) {
                $this->batchStockService->reversePurchaseStock(
                    $purchase->company_id,
                    $previousLines,
                    $previousLocation,
                    $previousWasReturn,
                );
                $purchase->load('items');
                $currentLines = $this->inventoryLinesFromPurchase($purchase);
                $purchaseItems = $purchase->items->all();
                $this->batchStockService->applyPurchaseStock($purchase->fresh(), $currentLines, $purchaseItems, $user);
            }

            $this->paymentService->syncFromPurchase($purchase->fresh());
            $this->supplierBalanceService->syncPurchaseChange($purchase->fresh(), $beforePurchase);

            return $this->formatPurchase($purchase->fresh()->load('items'));
        });
    }

    public function deleteForUser(User $user, int $id): void
    {
        $purchase = $this->findForUser($user, $id);
        $purchase->load('items');
        $companyId = $purchase->company_id;
        $purchaseId = $purchase->id;

        DB::transaction(function () use ($purchase, $companyId, $purchaseId) {
            $this->batchStockService->reversePurchaseStock(
                $companyId,
                $this->inventoryLinesFromPurchase($purchase),
                $purchase->location,
                self::isPurchaseReturn($purchase->purchase_type),
            );
            $this->supplierBalanceService->revertPurchaseEffect($purchase);
            $purchase->delete();
            $this->paymentService->deleteBySource($companyId, PaymentService::SOURCE_PURCHASE, $purchaseId);
        });
    }

    public function getNextInvoiceIdForUser(User $user): string
    {
        $company = $this->companySettingService->getCompanyForUser($user);

        $max = Purchase::where('company_id', $company->id)
            ->where('invoice_id', 'like', 'INV-%')
            ->get()
            ->map(function (Purchase $p) {
                if (preg_match('/INV-(\d+)/', $p->invoice_id, $m)) {
                    return (int) $m[1];
                }

                return 0;
            })
            ->max();

        $next = ((int) $max) + 1;

        return 'INV-'.str_pad((string) max(1, $next), 4, '0', STR_PAD_LEFT);
    }

    private function normalizeLineItems(int $companyId, mixed $items): ?array
    {
        if ($items === null) {
            return null;
        }

        if (!is_array($items)) {
            return [];
        }

        $lines = [];
        foreach ($items as $row) {
            if (!is_array($row)) {
                continue;
            }
            $description = trim((string) ($row['description'] ?? ''));
            if ($description === '') {
                continue;
            }
            $qty = max(0.01, (float) ($row['qty'] ?? 1));
            $unitPrice = max(0, (float) ($row['unit_price'] ?? 0));
            $lineTotal = round($qty * $unitPrice, 2);
            $itemId = isset($row['item_id']) && $row['item_id'] !== '' ? (int) $row['item_id'] : null;
            if ($itemId !== null && $itemId <= 0) {
                $itemId = null;
            }

            $itemNumber = trim((string) ($row['item_number'] ?? ''));
            if ($itemId) {
                $item = Item::where('company_id', $companyId)->where('id', $itemId)->first();
                if (!$item) {
                    throw new Exception(
                        'Product not found for '.($itemNumber !== '' ? $itemNumber : 'selected item')
                        .'. Remove the line and re-add it from the catalog.'
                    );
                }
                $itemNumber = $item->item_number;
                if ($description === '' || $description === $itemNumber) {
                    $description = $item->description;
                }
            }

            $expiryDate = trim((string) ($row['expiry_date'] ?? ''));
            $lines[] = [
                'item_id' => $itemId,
                'item_number' => $itemNumber ?: null,
                'description' => $description,
                'qty' => $qty,
                'unit_price' => $unitPrice,
                'line_total' => $lineTotal,
                'expiry_date' => $expiryDate !== '' ? $expiryDate : null,
            ];
        }

        return $lines;
    }

    /**
     * @return PurchaseItem[]
     */
    private function syncLineItems(Purchase $purchase, array $lines): array
    {
        $created = [];
        foreach ($lines as $line) {
            $created[] = PurchaseItem::create([
                'purchase_id' => $purchase->id,
                'item_id' => $line['item_id'],
                'item_number' => $line['item_number'],
                'description' => $line['description'],
                'qty' => $line['qty'],
                'unit_price' => $line['unit_price'],
                'line_total' => $line['line_total'],
                'expiry_date' => $line['expiry_date'] ?? null,
            ]);
        }

        return $created;
    }

    /**
     * @return array<int, array{item_id: ?int, qty: float, unit_price: float}>
     */
    private function inventoryLinesFromPurchase(Purchase $purchase): array
    {
        $items = $purchase->relationLoaded('items') ? $purchase->items : $purchase->items()->get();

        return $items->map(fn (PurchaseItem $line) => [
            'item_id' => $line->item_id,
            'qty' => (float) $line->qty,
            'unit_price' => (float) $line->unit_price,
            'expiry_date' => $line->expiry_date?->format('Y-m-d'),
            'item_batch_id' => $line->item_batch_id,
        ])->values()->all();
    }

    private function buildAttributes(int $companyId, array $data, ?Purchase $existing = null): array
    {
        $supplierName = trim((string) ($data['supplier_name'] ?? ''));
        $supplierId = $data['supplier_id'] ?? null;

        if ($supplierId) {
            $supplier = Supplier::where('company_id', $companyId)->where('id', $supplierId)->first();
            if ($supplier) {
                $supplierName = $supplier->first_name;
            }
        }

        if ($supplierName === '') {
            throw new Exception('Supplier name is required');
        }

        $subTotal = round((float) ($data['sub_total'] ?? 0), 2);
        $discount = round((float) ($data['discount'] ?? 0), 2);
        $amount = round((float) ($data['amount'] ?? ($subTotal - $discount)), 2);

        $invoiceId = trim((string) ($data['invoice_id'] ?? ''));
        if ($invoiceId === '' && !$existing) {
            throw new Exception('Invoice ID is required');
        }

        $purchaseType = trim((string) ($data['purchase_type'] ?? $existing?->purchase_type ?? '1001')) ?: '1001';
        $returnedFromPurchaseId = isset($data['returned_from_purchase_id']) && $data['returned_from_purchase_id'] !== ''
            ? (int) $data['returned_from_purchase_id']
            : ($existing?->returned_from_purchase_id ?? null);

        if (self::isPurchaseReturn($purchaseType) && !$returnedFromPurchaseId) {
            $returnedFromPurchaseId = $this->resolveReturnedFromPurchaseIdFromNotes(
                $companyId,
                (string) ($data['notes'] ?? $existing?->notes ?? '')
            );
        }

        // The purchase screen lets the buyer type any bank name freely —
        // bank_id only fits a real registered bank (numeric FK), so a
        // non-numeric bank_id is free text and belongs in bank_name instead
        // (mirrors the sales checkout bank_name fix). Falls back to
        // $existing when the field isn't part of this update.
        $rawBankId = array_key_exists('bank_id', $data) ? $data['bank_id'] : $existing?->bank_id;
        $bankId = is_numeric($rawBankId) ? (int) $rawBankId : null;
        $bankName = array_key_exists('bank_name', $data)
            ? trim((string) ($data['bank_name'] ?? ''))
            : trim((string) ($existing?->bank_name ?? ''));
        if ($bankName === '' && $rawBankId !== null && $rawBankId !== '' && !is_numeric($rawBankId)) {
            $bankName = trim((string) $rawBankId);
        }

        $payload = [
            'purchase_type' => $purchaseType,
            'location' => trim((string) ($data['location'] ?? 'Main Location')) ?: 'Main Location',
            'purchase_date' => $data['purchase_date'] ?? now()->toDateString(),
            'supplier_id' => $supplierId ?: null,
            'supplier_name' => $supplierName,
            'returned_from_purchase_id' => self::isPurchaseReturn($purchaseType)
                ? $returnedFromPurchaseId
                : null,
            'sub_total' => $subTotal,
            'discount' => $discount,
            'amount' => $amount,
            'payment_method' => $this->normalizePaymentMethod($data['payment_method'] ?? $existing?->payment_method ?? 'Cash'),
            'bank_id' => $bankId,
            'bank_name' => $bankName ?: null,
            'cheque_number' => $data['cheque_number'] ?? $existing?->cheque_number ?? null,
            'net_terms' => $data['net_terms'] ?? null,
            'notes' => $data['notes'] ?? null,
        ];

        if ($invoiceId !== '') {
            $payload['invoice_id'] = $invoiceId;
        }

        if (!$existing) {
            $payload['company_id'] = $companyId;
        }

        return $payload;
    }

    private function getFilterOptions(int $companyId): array
    {
        $types = Purchase::where('company_id', $companyId)
            ->distinct()
            ->pluck('purchase_type')
            ->filter()
            ->values()
            ->all();

        $purchaseTypes = array_values(array_unique(array_merge(self::DEFAULT_PURCHASE_TYPES, $types)));

        $storedLocations = Purchase::where('company_id', $companyId)
            ->distinct()
            ->pluck('location')
            ->filter()
            ->values()
            ->all();

        $locations = $this->locationService->getOptionsForCompany($companyId, $storedLocations);

        return [
            'purchase_types' => $purchaseTypes,
            'locations' => $locations,
        ];
    }

    private function normalizePaymentMethod(?string $method): string
    {
        $value = trim((string) $method);
        $allowed = PaymentService::defaultPaymentMethods();

        return in_array($value, $allowed, true) ? $value : 'Cash';
    }

    private function findForUser(User $user, int $id): Purchase
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $purchase = Purchase::where('company_id', $company->id)->where('id', $id)->first();

        if (!$purchase) {
            throw new Exception('Purchase not found');
        }

        return $purchase;
    }

    private function applyListFilters(
        $query,
        ?string $purchaseType,
        ?string $location,
        ?string $dateFrom,
        ?string $dateTo,
    ): void {
        if ($purchaseType && $purchaseType !== 'all') {
            $query->where('purchase_type', $purchaseType);
        }
        if ($location && $location !== 'all') {
            $query->where('location', $location);
        }
        if ($dateFrom) {
            $query->whereDate('purchase_date', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate('purchase_date', '<=', $dateTo);
        }
    }

    private function formatPurchase(Purchase $purchase): array
    {
        $items = $purchase->relationLoaded('items')
            ? $purchase->items
            : $purchase->items()->get();

        $details = $items->map(fn (PurchaseItem $line) => [
            'item_number' => $line->item_number,
            'description' => $line->description,
            'qty' => (float) $line->qty,
            'unit_price' => (float) $line->unit_price,
            'discount' => 0,
            'net_price' => (float) $line->qty > 0
                ? round((float) $line->line_total / (float) $line->qty, 2)
                : (float) $line->unit_price,
            'amount' => (float) $line->line_total,
        ])->values()->all();

        return [
            'id' => $purchase->id,
            'purchase_type' => $purchase->purchase_type,
            'location' => $purchase->location,
            'purchase_date' => $purchase->purchase_date->format('Y-m-d'),
            'purchase_datetime' => ($purchase->created_at ?? $purchase->purchase_date)->format('d-m-Y H:i'),
            'invoice_id' => $purchase->invoice_id,
            'supplier_id' => $purchase->supplier_id,
            'supplier_name' => $purchase->supplier_name,
            'returned_from_purchase_id' => $purchase->returned_from_purchase_id,
            'has_return' => false,
            'has_partial_return' => false,
            'return_status' => 'none',
            'sub_total' => (float) $purchase->sub_total,
            'discount' => (float) $purchase->discount,
            'amount' => (float) $purchase->amount,
            'payment_method' => $purchase->payment_method ?? 'Cash',
            'bank_id' => $purchase->bank_id,
            'bank_name' => $purchase->bank_name,
            'cheque_number' => $purchase->cheque_number,
            'net_terms' => $purchase->net_terms,
            'notes' => $purchase->notes,
            'items' => $items->map(fn (PurchaseItem $line) => [
                'id' => $line->id,
                'item_id' => $line->item_id,
                'item_number' => $line->item_number,
                'description' => $line->description,
                'qty' => (float) $line->qty,
                'unit_price' => (float) $line->unit_price,
                'line_total' => (float) $line->line_total,
                'expiry_date' => $line->expiry_date?->format('Y-m-d'),
                'item_batch_id' => $line->item_batch_id,
            ])->values()->all(),
            'details' => $details,
        ];
    }

    private function attachPurchaseReturnStatus(array $formatted, int $companyId, array $fullyReturnedMap): array
    {
        if (self::isPurchaseReturn((string) ($formatted['purchase_type'] ?? ''))) {
            return $formatted;
        }

        $purchaseId = (int) ($formatted['id'] ?? 0);
        if ($purchaseId <= 0) {
            return $formatted;
        }

        if (isset($fullyReturnedMap[$purchaseId])) {
            $formatted['has_return'] = true;
            $formatted['has_partial_return'] = false;
            $formatted['return_status'] = 'full';
            $formatted['return_qty_summary'] = $this->buildReturnQtySummary($formatted, $companyId);

            return $formatted;
        }

        $returnedQtyMap = $this->getReturnedQtyMapForSource($companyId, $purchaseId);
        $hasPartial = $this->hasAnyReturnedQty($returnedQtyMap);

        $formatted['has_return'] = false;
        $formatted['has_partial_return'] = $hasPartial;
        $formatted['return_status'] = $hasPartial ? 'partial' : 'none';
        $formatted['return_qty_summary'] = $this->buildReturnQtySummary($formatted, $companyId);

        return $formatted;
    }

    /**
     * @return array{
     *   purchased_qty: float,
     *   returned_qty: float,
     *   remaining_qty: float,
     *   lines: array<int, array{item_number: ?string, description: string, purchased_qty: float, returned_qty: float, remaining_qty: float}>
     * }
     */
    private function buildReturnQtySummary(array $formatted, int $companyId): array
    {
        $purchaseId = (int) ($formatted['id'] ?? 0);
        $returnedQtyMap = $purchaseId > 0
            ? $this->getReturnedQtyMapForSource($companyId, $purchaseId)
            : [];

        $purchasedTotal = 0.0;
        $returnedTotal = 0.0;
        $remainingTotal = 0.0;
        $lines = [];

        foreach ($formatted['items'] ?? [] as $line) {
            $key = $this->returnLineKey($line['item_id'] ?? null, $line['item_number'] ?? null);
            $purchased = round((float) ($line['qty'] ?? 0), 2);
            $returned = round((float) ($returnedQtyMap[$key] ?? 0), 2);
            $remaining = round(max(0, $purchased - $returned), 2);

            $purchasedTotal += $purchased;
            $returnedTotal += $returned;
            $remainingTotal += $remaining;

            if ($returned > 0.009 || $remaining > 0.009) {
                $lines[] = [
                    'item_number' => $line['item_number'] ?? null,
                    'description' => (string) ($line['description'] ?? ''),
                    'purchased_qty' => $purchased,
                    'returned_qty' => $returned,
                    'remaining_qty' => $remaining,
                ];
            }
        }

        return [
            'purchased_qty' => round($purchasedTotal, 2),
            'returned_qty' => round($returnedTotal, 2),
            'remaining_qty' => round($remainingTotal, 2),
            'lines' => $lines,
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function buildRemainingReturnItems(Purchase $source): array
    {
        $source->loadMissing('items');
        $returnedQtyMap = $this->getReturnedQtyMapForSource((int) $source->company_id, (int) $source->id);
        $remaining = [];

        foreach ($source->items as $line) {
            $key = $this->returnLineKey($line->item_id, $line->item_number);
            $purchased = (float) $line->qty;
            $returned = (float) ($returnedQtyMap[$key] ?? 0);
            $qtyLeft = round(max(0, $purchased - $returned), 2);
            if ($qtyLeft < 0.01) {
                continue;
            }

            $remaining[] = [
                'id' => $line->id,
                'item_id' => $line->item_id,
                'item_number' => $line->item_number,
                'description' => $line->description,
                'qty' => $qtyLeft,
                'purchased_qty' => $purchased,
                'returned_qty' => $returned,
                'unit_price' => (float) $line->unit_price,
                'line_total' => round($qtyLeft * (float) $line->unit_price, 2),
                'expiry_date' => $line->expiry_date?->format('Y-m-d'),
                'item_batch_id' => $line->item_batch_id,
            ];
        }

        return $remaining;
    }

    /**
     * @param  array<int, array{item_id: ?int, item_number?: ?string, qty: float}>  $lines
     */
    private function assertReturnWithinRemainingQty(int $companyId, int $sourcePurchaseId, array $lines): void
    {
        $source = Purchase::where('company_id', $companyId)->where('id', $sourcePurchaseId)->first();
        if (!$source) {
            throw new Exception('Original purchase invoice not found.');
        }

        if (self::isPurchaseReturn($source->purchase_type)) {
            throw new Exception('Cannot return a return transaction.');
        }

        $source->load('items');
        $remainingByKey = [];
        foreach ($this->buildRemainingReturnItems($source) as $row) {
            $key = $this->returnLineKey($row['item_id'] ?? null, $row['item_number'] ?? null);
            $remainingByKey[$key] = (float) $row['qty'];
        }

        if ($remainingByKey === []) {
            throw new Exception('This invoice has already been fully returned.');
        }

        foreach ($lines as $line) {
            $key = $this->returnLineKey($line['item_id'] ?? null, $line['item_number'] ?? null);
            $qty = (float) ($line['qty'] ?? 0);
            if ($qty <= 0) {
                continue;
            }

            if (!array_key_exists($key, $remainingByKey)) {
                throw new Exception('One or more return items were not on the original purchase invoice.');
            }

            if ($qty - $remainingByKey[$key] > 0.009) {
                $label = trim((string) ($line['item_number'] ?? $line['description'] ?? 'item'));
                throw new Exception(
                    "Return qty for {$label} exceeds remaining returnable qty ({$remainingByKey[$key]})."
                );
            }
        }
    }

    private function returnLineKey(?int $itemId, ?string $itemNumber): string
    {
        if ($itemId) {
            return 'id:'.$itemId;
        }

        $number = strtoupper(trim((string) $itemNumber));

        return $number !== '' ? 'num:'.$number : 'desc:';
    }

    /**
     * @return array<string, float>
     */
    private function getReturnedQtyMapForSource(int $companyId, int $sourcePurchaseId): array
    {
        $map = [];

        foreach ($this->getReturnDocumentsForSource($companyId, $sourcePurchaseId) as $returnPurchase) {
            $returnPurchase->loadMissing('items');
            foreach ($returnPurchase->items as $line) {
                $key = $this->returnLineKey($line->item_id, $line->item_number);
                $map[$key] = round(($map[$key] ?? 0) + (float) $line->qty, 2);
            }
        }

        return $map;
    }

    /**
     * @return \Illuminate\Support\Collection<int, Purchase>
     */
    private function getReturnDocumentsForSource(int $companyId, int $sourcePurchaseId)
    {
        $source = Purchase::where('company_id', $companyId)->where('id', $sourcePurchaseId)->first();
        if (!$source) {
            return collect();
        }

        return Purchase::where('company_id', $companyId)
            ->where('purchase_type', self::PURCHASE_TYPE_RETURN)
            ->where(function ($query) use ($sourcePurchaseId, $source) {
                $query->where('returned_from_purchase_id', $sourcePurchaseId)
                    ->orWhere('notes', 'like', 'Return for invoice '.$source->invoice_id.'%');
            })
            ->get();
    }

    /**
     * @param  array<string, float>  $returnedQtyMap
     */
    private function hasAnyReturnedQty(array $returnedQtyMap): bool
    {
        foreach ($returnedQtyMap as $qty) {
            if ($qty > 0.009) {
                return true;
            }
        }

        return false;
    }

    /**
     * @return array<int, true>
     */
    private function getFullyReturnedSourcePurchaseIdMap(int $companyId): array
    {
        $map = [];

        Purchase::where('company_id', $companyId)
            ->where('purchase_type', self::PURCHASE_TYPE_PURCHASE)
            ->with('items')
            ->orderByDesc('id')
            ->chunk(200, function ($purchases) use ($companyId, &$map) {
                foreach ($purchases as $purchase) {
                    if ($this->buildRemainingReturnItems($purchase) === []) {
                        $returnedMap = $this->getReturnedQtyMapForSource($companyId, (int) $purchase->id);
                        if ($this->hasAnyReturnedQty($returnedMap)) {
                            $map[(int) $purchase->id] = true;
                        }
                    }
                }
            });

        return $map;
    }

    private function backfillReturnedFromPurchaseLinks(int $companyId): void
    {
        Purchase::where('company_id', $companyId)
            ->where(function ($query) {
                $query->whereNull('returned_from_purchase_id')->orWhere('returned_from_purchase_id', 0);
            })
            ->whereNotNull('notes')
            ->where('notes', 'like', 'Return for invoice %')
            ->get(['id', 'notes'])
            ->each(function (Purchase $returnPurchase) use ($companyId) {
                $sourceId = $this->resolveReturnedFromPurchaseIdFromNotes($companyId, (string) $returnPurchase->notes);
                if ($sourceId) {
                    $returnPurchase->forceFill(['returned_from_purchase_id' => $sourceId])->save();
                }
            });
    }

    private function resolveReturnedFromPurchaseIdFromNotes(int $companyId, string $notes): ?int
    {
        if (!preg_match('/Return for invoice\s+(\S+)/i', $notes, $matches)) {
            return null;
        }

        $sourceId = Purchase::where('company_id', $companyId)
            ->where('invoice_id', $matches[1])
            ->value('id');

        return $sourceId ? (int) $sourceId : null;
    }

}
