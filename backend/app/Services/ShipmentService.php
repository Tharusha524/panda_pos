<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Sale;
use App\Models\Shipment;
use App\Models\User;
use Exception;

class ShipmentService
{
    private const STATUSES = ['Pending', 'In Transit', 'Delivered'];

    public function __construct(
        private CompanySettingService $companySettingService,
        private LocationService $locationService,
        private OrderTransactionService $orderTransactionService,
    ) {
    }

    public function getAllForUser(
        User $user,
        ?string $location = null,
        ?string $status = null,
        ?string $dateFrom = null,
        ?string $dateTo = null,
    ): array {
        $company = $this->companySettingService->getCompanyForUser($user);
        $companyId = $company->id;

        $query = Shipment::where('company_id', $companyId);
        $this->applyListFilters($query, $location, $status, $dateFrom, $dateTo);

        $shipments = $query
            ->orderByDesc('shipment_date')
            ->orderByDesc('id')
            ->get()
            ->map(fn (Shipment $s) => $this->formatShipment($s));

        $summaryQuery = Shipment::where('company_id', $companyId);
        $this->applyListFilters($summaryQuery, $location, $status, $dateFrom, $dateTo);

        $storedLocations = Shipment::where('company_id', $companyId)
            ->distinct()
            ->pluck('location')
            ->filter()
            ->values()
            ->all();

        return [
            'shipments' => $shipments,
            'summary' => [
                'total_shipments' => $shipments->count(),
                'in_transit' => $shipments->where('status', 'In Transit')->count(),
                'total_freight_cost' => round((float) $summaryQuery->sum('freight_cost'), 2),
            ],
            'filters' => [
                'locations' => $this->locationService->getOptionsForCompany($companyId, $storedLocations),
                'statuses' => self::STATUSES,
            ],
        ];
    }

    public function getForUser(User $user, int $id): array
    {
        return $this->formatShipment($this->findForUser($user, $id));
    }

    public function createForUser(User $user, array $data): array
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $data = $this->orderTransactionService->filterShipmentData($user, $data);
        $payload = $this->buildAttributes($company->id, $data, $user);

        $shipmentNo = $payload['shipment_no'];
        if (Shipment::where('company_id', $company->id)->where('shipment_no', $shipmentNo)->exists()) {
            throw new Exception('Shipment number already exists.');
        }

        $shipment = Shipment::create($payload);

        return $this->formatShipment($shipment);
    }

    public function updateForUser(User $user, int $id, array $data): array
    {
        $shipment = $this->findForUser($user, $id);
        $data = $this->orderTransactionService->filterShipmentData($user, $data);
        $payload = $this->buildAttributes($shipment->company_id, $data, $user, $shipment);

        if (isset($payload['shipment_no'])) {
            $exists = Shipment::where('company_id', $shipment->company_id)
                ->where('shipment_no', $payload['shipment_no'])
                ->where('id', '!=', $shipment->id)
                ->exists();
            if ($exists) {
                throw new Exception('Shipment number already exists.');
            }
        }

        $shipment->update($payload);

        return $this->formatShipment($shipment->fresh());
    }

    public function deleteForUser(User $user, int $id): void
    {
        $this->findForUser($user, $id)->delete();
    }

    public function getNextShipmentNoForUser(User $user): string
    {
        $company = $this->companySettingService->getCompanyForUser($user);

        $max = Shipment::where('company_id', $company->id)
            ->where('shipment_no', 'like', 'SHIP-%')
            ->get()
            ->map(function (Shipment $s) {
                if (preg_match('/SHIP-(\d+)/', $s->shipment_no, $m)) {
                    return (int) $m[1];
                }

                return 0;
            })
            ->max();

        $next = ((int) $max) + 1;

        return 'SHIP-'.str_pad((string) max(1, $next), 4, '0', STR_PAD_LEFT);
    }

    private function buildAttributes(int $companyId, array $data, User $user, ?Shipment $existing = null): array
    {
        $location = $this->locationService->assertValidForUser($user, $data['location'] ?? $existing?->location);

        $customerName = trim((string) ($data['customer_name'] ?? ''));
        $customerId = $data['customer_id'] ?? null;
        $saleId = $data['sale_id'] ?? null;
        $salesIdRef = trim((string) ($data['sales_id'] ?? ''));

        if ($saleId) {
            $sale = Sale::where('company_id', $companyId)->where('id', $saleId)->first();
            if ($sale) {
                $salesIdRef = $sale->sales_id;
                $customerId = $sale->customer_id;
                $customerName = $sale->customer_name ?: $customerName;
                if (!array_key_exists('location', $data)) {
                    $location = $this->locationService->normalize($sale->location);
                }
            }
        }

        if ($customerId) {
            $customer = Customer::where('company_id', $companyId)->where('id', $customerId)->first();
            if ($customer) {
                $customerName = $customer->customer_name
                    ?: $customer->business_name
                    ?: $customer->first_name
                    ?: $customerName;
            }
        }

        $status = trim((string) ($data['status'] ?? 'Pending'));
        if (!in_array($status, self::STATUSES, true)) {
            $status = 'Pending';
        }

        $shipmentNo = trim((string) ($data['shipment_no'] ?? ''));
        if ($shipmentNo === '' && !$existing) {
            throw new Exception('Shipment number is required');
        }

        $settings = $this->orderTransactionService->getSettings($user);
        $allowCustom = (bool) $settings['allow_custom_fields_in_shipping_screen'];

        $payload = [
            'location' => $location,
            'sale_id' => $saleId ?: null,
            'sales_id' => $salesIdRef ?: null,
            'customer_id' => $customerId ?: null,
            'customer_name' => $customerName ?: null,
            'shipment_date' => $data['shipment_date'] ?? now()->toDateString(),
            'destination' => $data['destination'] ?? null,
            'estimated_delivery_date' => $data['estimated_delivery_date'] ?? null,
            'weight' => isset($data['weight']) ? round((float) $data['weight'], 2) : null,
            'freight_cost' => $allowCustom
                ? round((float) ($data['freight_cost'] ?? $existing?->freight_cost ?? 0), 2)
                : (float) ($existing?->freight_cost ?? 0),
            'invoice_cost' => $allowCustom
                ? round((float) ($data['invoice_cost'] ?? $existing?->invoice_cost ?? 0), 2)
                : (float) ($existing?->invoice_cost ?? 0),
            'bsl_number' => $allowCustom ? ($data['bsl_number'] ?? $existing?->bsl_number) : ($existing?->bsl_number),
            'us_lot_number' => $allowCustom ? ($data['us_lot_number'] ?? $existing?->us_lot_number) : ($existing?->us_lot_number),
            'status' => $status,
            'notes' => $data['notes'] ?? null,
        ];

        if ($shipmentNo !== '') {
            $payload['shipment_no'] = $shipmentNo;
        }

        if (!$existing) {
            $payload['company_id'] = $companyId;
        }

        return $payload;
    }

    private function applyListFilters(
        $query,
        ?string $location,
        ?string $status,
        ?string $dateFrom,
        ?string $dateTo,
    ): void {
        if ($location && $location !== 'all') {
            $query->where('location', $location);
        }
        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }
        if ($dateFrom) {
            $query->whereDate('shipment_date', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate('shipment_date', '<=', $dateTo);
        }
    }

    private function findForUser(User $user, int $id): Shipment
    {
        $company = $this->companySettingService->getCompanyForUser($user);
        $shipment = Shipment::where('company_id', $company->id)->where('id', $id)->first();

        if (!$shipment) {
            throw new Exception('Shipment not found');
        }

        return $shipment;
    }

    private function formatShipment(Shipment $shipment): array
    {
        return [
            'id' => $shipment->id,
            'location' => $shipment->location,
            'shipment_no' => $shipment->shipment_no,
            'sale_id' => $shipment->sale_id,
            'sales_id' => $shipment->sales_id,
            'customer_id' => $shipment->customer_id,
            'customer_name' => $shipment->customer_name,
            'shipment_date' => $shipment->shipment_date->format('Y-m-d'),
            'shipment_datetime' => ($shipment->created_at ?? $shipment->shipment_date)->format('d-m-Y H:i'),
            'destination' => $shipment->destination,
            'estimated_delivery_date' => $shipment->estimated_delivery_date?->format('Y-m-d'),
            'weight' => $shipment->weight !== null ? (float) $shipment->weight : null,
            'freight_cost' => (float) $shipment->freight_cost,
            'invoice_cost' => (float) $shipment->invoice_cost,
            'bsl_number' => $shipment->bsl_number,
            'us_lot_number' => $shipment->us_lot_number,
            'status' => $shipment->status,
            'notes' => $shipment->notes,
            'details' => [
                [
                    'label' => 'Destination',
                    'value' => $shipment->destination ?? '—',
                ],
                [
                    'label' => 'Freight (Rs)',
                    'value' => round((float) $shipment->freight_cost, 2),
                ],
                [
                    'label' => 'Invoice cost (Rs)',
                    'value' => round((float) $shipment->invoice_cost, 2),
                ],
                [
                    'label' => 'Est. delivery',
                    'value' => $shipment->estimated_delivery_date?->format('d-m-Y') ?? '—',
                ],
            ],
        ];
    }
}
