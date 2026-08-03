<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PaymentService;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(private PaymentService $paymentService)
    {
    }

    public function index(Request $request)
    {
        try {
            $paymentMethod = $request->query('payment_method');
            $paymentType = $request->query('payment_type');
            $location = $request->query('location');
            $dateFrom = $request->query('date_from');
            $dateTo = $request->query('date_to');

            $result = $this->paymentService->getAllForUser(
                $request->user(),
                is_string($paymentMethod) ? $paymentMethod : null,
                is_string($paymentType) ? $paymentType : null,
                is_string($location) ? $location : null,
                is_string($dateFrom) ? $dateFrom : null,
                is_string($dateTo) ? $dateTo : null,
            );

            return response()->json([
                'success' => true,
                'data' => $result['payments'],
                'summary' => $result['summary'],
                'filters' => $result['filters'],
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
                'data' => $this->paymentService->getForUser($request->user(), $id),
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
            $validated = $this->validatePayment($request);

            $payment = $this->paymentService->createForUser($request->user(), $validated);

            return response()->json([
                'success' => true,
                'message' => 'Payment saved successfully',
                'data' => $payment,
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
            $validated = $this->validatePayment($request, false);

            $payment = $this->paymentService->updateForUser($request->user(), $id, $validated);

            return response()->json([
                'success' => true,
                'message' => 'Payment updated successfully',
                'data' => $payment,
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
            $this->paymentService->deleteForUser($request->user(), $id);

            return response()->json([
                'success' => true,
                'message' => 'Payment deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function nextSalesNo(Request $request)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => [
                    'sales_no' => $this->paymentService->getNextSalesNoForUser($request->user()),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    private function validatePayment(Request $request, bool $requireSalesNo = true): array
    {
        return $request->validate([
            'payment_type' => 'nullable|string|max:20',
            'location' => 'nullable|string|max:100',
            'payment_date' => 'nullable|date',
            'sales_no' => ($requireSalesNo ? 'required' : 'nullable').'|string|max:50',
            'receipt_type' => 'nullable|string|max:50',
            'payment_method' => 'nullable|string|max:50',
            'discount' => 'nullable|numeric|min:0',
            'paid_amount' => 'nullable|numeric|min:0.01',
            'notes' => 'nullable|string',
        ]);
    }
}
