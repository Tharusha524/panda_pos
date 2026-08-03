<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SaleService;
use Illuminate\Http\Request;

class SaleController extends Controller
{
    public function __construct(private SaleService $saleService)
    {
    }

    public function index(Request $request)
    {
        try {
            $transactionType = $request->query('transaction_type');
            $location = $request->query('location');
            $dateFrom = $request->query('date_from');
            $dateTo = $request->query('date_to');
            $orderStatus = $request->query('order_status');
            $customerId = $request->query('customer_id');

            $result = $this->saleService->getAllForUser(
                $request->user(),
                is_string($transactionType) ? $transactionType : null,
                is_string($location) ? $location : null,
                is_string($dateFrom) ? $dateFrom : null,
                is_string($dateTo) ? $dateTo : null,
                is_string($orderStatus) ? $orderStatus : null,
                is_numeric($customerId) ? (int) $customerId : null,
            );

            return response()->json([
                'success' => true,
                'data' => $result['sales'],
                'returned_sale_ids' => $result['returned_sale_ids'] ?? [],
                'summary' => $result['summary'],
                'filters' => $result['filters'],
                'order_settings' => $result['order_settings'],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function posContext(Request $request)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $this->saleService->getPosContextForUser($request->user()),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function holdOrders(Request $request)
    {
        try {
            $location = $request->query('location');

            return response()->json([
                'success' => true,
                'data' => $this->saleService->getHoldOrdersForUser(
                    $request->user(),
                    is_string($location) ? $location : null,
                ),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function completeHold(Request $request, int $id)
    {
        try {
            $validated = $this->validateSale($request, false);
            $sale = $this->saleService->completeHoldForUser($request->user(), $id, $validated);
            $receipt = $this->saleService->buildReceiptFromSale($request->user(), $sale);

            return response()->json([
                'success' => true,
                'message' => 'Hold order completed successfully',
                'data' => $sale,
                'receipt' => $receipt,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function verifyRefundCard(Request $request)
    {
        try {
            $validated = $request->validate([
                'card_last4' => 'required|string|size:4',
            ]);
            $this->saleService->verifyRefundCardForUser($request->user(), $validated['card_last4']);

            return response()->json([
                'success' => true,
                'message' => 'Card verification passed',
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
                'data' => $this->saleService->getForUser($request->user(), $id),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function receipt(Request $request, int $id)
    {
        try {
            $language = $request->query('language');

            return response()->json([
                'success' => true,
                'data' => $this->saleService->getReceiptForUser(
                    $request->user(),
                    $id,
                    is_string($language) ? $language : null,
                ),
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
            $validated = $this->validateSale($request);
            $user = $request->user();
            $sale = $this->saleService->createForUser($user, $validated);
            $receipt = $this->saleService->buildReceiptFromSale($user, $sale);

            return response()->json([
                'success' => true,
                'message' => 'Sale saved successfully',
                'data' => $sale,
                'receipt' => $receipt,
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
            $validated = $this->validateSale($request, false);
            $sale = $this->saleService->updateForUser($request->user(), $id, $validated);

            return response()->json([
                'success' => true,
                'message' => 'Sale updated successfully',
                'data' => $sale,
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
            $holdPin = $request->input('hold_pin');
            $this->saleService->deleteForUser(
                $request->user(),
                $id,
                is_string($holdPin) ? $holdPin : null,
            );

            return response()->json([
                'success' => true,
                'message' => 'Sale deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function nextSalesId(Request $request)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => [
                    'sales_id' => $this->saleService->getNextSalesIdForUser($request->user()),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    private function validateSale(Request $request, bool $requireSalesId = true): array
    {
        return $request->validate([
            'transaction_type' => 'nullable|string|max:20',
            'order_status' => 'nullable|string|in:completed,hold,quotation',
            'sales_type' => 'nullable|string|max:50',
            'pricing_mode' => 'nullable|string|in:retail,wholesale',
            'location' => 'nullable|string|max:100',
            'sale_date' => 'nullable|date',
            'sales_id' => ($requireSalesId ? 'required' : 'nullable').'|string|max:50',
            'customer_id' => 'nullable|integer|exists:customers,id',
            'customer_name' => 'nullable|string|max:255',
            'returned_from_sale_id' => 'nullable|integer|exists:sales,id',
            'sub_total' => 'nullable|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'service_charge' => 'nullable|numeric|min:0',
            'net_amount' => 'nullable|numeric|min:0',
            'payment_method' => 'nullable|string|max:50',
            'amount_received' => 'nullable|numeric|min:0',
            'bank_id' => 'nullable|integer|exists:banks,id',
            'cheque_number' => 'nullable|string|max:50',
            'offer_applied' => 'nullable|boolean',
            'offer_id' => 'nullable|integer|exists:offers,id',
            'offer_promo_code' => 'nullable|string|max:50',
            'promo_code' => 'nullable|string|max:50',
            'refund_card_last4' => 'nullable|string|size:4',
            'hold_pin' => 'nullable|string|max:20',
            'notes' => 'nullable|string',
            'items' => 'nullable|array',
            'items.*.item_id' => 'nullable|integer|exists:items,id',
            'items.*.item_number' => 'nullable|string|max:100',
            'items.*.description' => 'required_with:items|string|max:500',
            'items.*.qty' => 'nullable|numeric|min:0.01',
            'items.*.unit_price' => 'nullable|numeric|min:0',
            'items.*.line_total' => 'nullable|numeric|min:0',
            'items.*.imei_serial' => 'nullable|string|max:100',
            'items.*.batch_id' => 'nullable|string|max:100',
            'items.*.item_batch_id' => 'nullable|integer|exists:item_batches,id',
            'items.*.secondary_uom' => 'nullable|string|max:50',
            'items.*.secondary_uom_qty' => 'nullable|numeric|min:0',
            'items.*.additional_details' => 'nullable|string|max:2000',
        ]);
    }
}
