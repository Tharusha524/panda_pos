<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CustomerService;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function __construct(private CustomerService $customerService)
    {
    }

    public function index(Request $request)
    {
        try {
            $location = $request->query('location');
            $orderBy = $request->query('order_by');
            $sort = $request->query('sort');

            $result = $this->customerService->getAllForUser(
                $request->user(),
                is_string($location) ? $location : null,
                is_string($orderBy) ? $orderBy : null,
                is_string($sort) ? $sort : null
            );

            return response()->json([
                'success' => true,
                'data' => $result['customers'],
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

    public function types(Request $request)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $this->customerService->getTypesForUser($request->user()),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function storeType(Request $request)
    {
        try {
            $validated = $request->validate(['name' => 'required|string|max:255']);

            $type = $this->customerService->createTypeForUser($request->user(), $validated);

            return response()->json([
                'success' => true,
                'message' => 'Customer type created successfully',
                'data' => $type,
            ], 201);
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
                'data' => $this->customerService->getForUser($request->user(), $id),
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
            $validated = $this->validateCustomer($request);

            $customer = $this->customerService->createForUser($request->user(), $validated);

            return response()->json([
                'success' => true,
                'message' => 'Customer saved successfully',
                'data' => $customer,
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
            $validated = $this->validateCustomer($request, false);

            $customer = $this->customerService->updateForUser($request->user(), $id, $validated);

            return response()->json([
                'success' => true,
                'message' => 'Customer updated successfully',
                'data' => $customer,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function receivePayment(Request $request, int $id)
    {
        try {
            $validated = $request->validate([
                'amount' => 'required|numeric|min:0.01',
                'payment_method' => 'nullable|string|max:50',
                'notes' => 'nullable|string|max:500',
                'location' => 'nullable|string|max:100',
                'cheque_number' => 'nullable|string|max:50',
                'bank_name' => 'nullable|string|max:100',
                'sale_id' => 'nullable|integer',
            ]);

            $result = $this->customerService->receivePaymentForUser($request->user(), $id, $validated);

            return response()->json([
                'success' => true,
                'message' => 'Payment recorded successfully',
                'data' => $result,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function outstandingBills(Request $request, int $id)
    {
        try {
            $bills = $this->customerService->outstandingBillsForUser($request->user(), $id);

            return response()->json([
                'success' => true,
                'data' => $bills,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function payments(Request $request, int $id)
    {
        try {
            $payments = $this->customerService->paymentsForUser($request->user(), $id);

            return response()->json([
                'success' => true,
                'data' => $payments,
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
            $this->customerService->deleteForUser($request->user(), $id);

            return response()->json([
                'success' => true,
                'message' => 'Customer deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    private function validateCustomer(Request $request, bool $requireFields = true): array
    {
        $req = $requireFields ? 'required' : 'nullable';

        return $request->validate([
            'customer_code' => 'nullable|string|max:50',
            'first_name' => "{$req}|string|max:255",
            'customer_name' => 'nullable|string|max:255',
            'business_name' => 'nullable|string|max:255',
            'contact_no' => "{$req}|string|max:30",
            'allow_duplicate_phone' => 'nullable|boolean',
            'email' => 'nullable|email|max:255',
            'date_of_birth' => 'nullable|date',
            'passport_no' => 'nullable|string|max:50',
            'nic' => 'nullable|string|max:20',
            'address_line1' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'country' => 'nullable|string|max:100',
            'province' => 'nullable|string|max:100',
            'source' => 'nullable|string|max:50',
            'sales_person_id' => 'nullable|string|max:100',
            'lead_sales_person' => 'nullable|string|max:100',
            'other_sales_person' => 'nullable|string|max:100',
            'support_person' => 'nullable|string|max:100',
            'customer_status' => 'nullable|string|max:50',
            'product' => 'nullable|string|max:100',
            'credit_limit' => 'nullable|numeric|min:0',
            'opening_balance' => 'nullable|numeric',
            'net_balance' => 'nullable|numeric',
            'notes' => 'nullable|string',
            'language' => 'nullable|string|max:50',
            'inventory_location' => 'nullable|string|max:100',
            'location' => 'nullable|string|max:100',
            'route' => "{$req}|string|max:255",
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'customer_type_id' => 'nullable|integer',
            'customer_discount' => 'nullable|numeric|min:0',
            'advance_payment' => 'nullable|numeric|min:0',
            'advance_payment_notes' => 'nullable|string',
            'apply_advance_on_update' => 'nullable|boolean',
            'payment_received' => 'nullable|numeric|min:0',
            'payment_received_notes' => 'nullable|string',
        ]);
    }
}
