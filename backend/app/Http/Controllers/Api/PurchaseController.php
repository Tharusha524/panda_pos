<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CompanySettingService;
use App\Services\PurchaseService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PurchaseController extends Controller
{
    public function __construct(
        private PurchaseService $purchaseService,
        private CompanySettingService $companySettingService,
    ) {
    }

    public function index(Request $request)
    {
        try {
            $purchaseType = $request->query('purchase_type');
            $location = $request->query('location');
            $dateFrom = $request->query('date_from');
            $dateTo = $request->query('date_to');

            $result = $this->purchaseService->getAllForUser(
                $request->user(),
                is_string($purchaseType) ? $purchaseType : null,
                is_string($location) ? $location : null,
                is_string($dateFrom) ? $dateFrom : null,
                is_string($dateTo) ? $dateTo : null,
            );

            return response()->json([
                'success' => true,
                'data' => $result['purchases'],
                'returned_purchase_ids' => $result['returned_purchase_ids'] ?? [],
                'summary' => $result['summary'],
                'filters' => $result['filters'],
                'payment_methods' => $result['payment_methods'] ?? [],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function show(Request $request, int $id)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $this->purchaseService->getForUser($request->user(), $id),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function store(Request $request)
    {
        try {
            $validated = $this->validatePurchase($request);

            $purchase = $this->purchaseService->createForUser($request->user(), $validated);

            return response()->json([
                'success' => true,
                'message' => 'Purchase saved successfully',
                'data' => $purchase,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function update(Request $request, int $id)
    {
        try {
            $validated = $this->validatePurchase($request, false);

            $purchase = $this->purchaseService->updateForUser($request->user(), $id, $validated);

            return response()->json([
                'success' => true,
                'message' => 'Purchase updated successfully',
                'data' => $purchase,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function destroy(Request $request, int $id)
    {
        try {
            $this->purchaseService->deleteForUser($request->user(), $id);

            return response()->json([
                'success' => true,
                'message' => 'Purchase deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function nextInvoiceId(Request $request)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => [
                    'invoice_id' => $this->purchaseService->getNextInvoiceIdForUser($request->user()),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    private function validatePurchase(Request $request, bool $requireInvoice = true): array
    {
        $company = $this->companySettingService->getCompanyForUser($request->user());
        $companyId = (int) $company->id;

        return $request->validate([
            'purchase_type' => 'nullable|string|max:20',
            'location' => 'nullable|string|max:100',
            'purchase_date' => 'nullable|date',
            'invoice_id' => ($requireInvoice ? 'required' : 'nullable').'|string|max:50',
            'supplier_id' => [
                'nullable',
                'integer',
                Rule::exists('suppliers', 'id')->where(fn ($query) => $query->where('company_id', $companyId)),
            ],
            'supplier_name' => 'nullable|string|max:255',
            'returned_from_purchase_id' => [
                'nullable',
                'integer',
                Rule::exists('purchases', 'id')->where(fn ($query) => $query->where('company_id', $companyId)),
            ],
            'sub_total' => 'nullable|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'amount' => 'nullable|numeric|min:0',
            'net_terms' => 'nullable|string|max:50',
            'payment_method' => 'nullable|string|max:50',
            'bank_id' => [
                'nullable',
                'integer',
                Rule::exists('banks', 'id')->where(fn ($query) => $query->where('company_id', $companyId)),
            ],
            'cheque_number' => 'nullable|string|max:50',
            'notes' => 'nullable|string',
            'items' => 'nullable|array',
            'items.*.item_id' => [
                'nullable',
                'integer',
                'min:1',
                Rule::exists('items', 'id')->where(fn ($query) => $query->where('company_id', $companyId)),
            ],
            'items.*.item_number' => 'nullable|string|max:100',
            'items.*.description' => 'required_with:items|string|max:500',
            'items.*.qty' => 'nullable|numeric|min:0.01',
            'items.*.unit_price' => 'nullable|numeric|min:0',
            'items.*.line_total' => 'nullable|numeric|min:0',
            'items.*.expiry_date' => 'nullable|date',
        ], [
            'items.*.item_id.exists' => 'One or more products are no longer in inventory. Remove them and re-add from the catalog.',
            'items.*.item_id.min' => 'Each line must use a valid product from the catalog.',
            'supplier_id.exists' => 'The selected supplier is invalid.',
            'bank_id.exists' => 'The selected bank is invalid.',
            'returned_from_purchase_id.exists' => 'The original purchase invoice could not be found.',
        ]);
    }
}
