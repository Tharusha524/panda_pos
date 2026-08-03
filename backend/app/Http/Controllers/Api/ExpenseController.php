<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ExpenseService;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    public function __construct(private ExpenseService $expenseService)
    {
    }

    public function index(Request $request)
    {
        try {
            $location = $request->query('location');
            $dateFrom = $request->query('date_from');
            $dateTo = $request->query('date_to');
            $category = $request->query('category');
            $status = $request->query('status');
            $paymentMethod = $request->query('payment_method');

            $result = $this->expenseService->getAllForUser(
                $request->user(),
                is_string($location) ? $location : null,
                is_string($dateFrom) ? $dateFrom : null,
                is_string($dateTo) ? $dateTo : null,
                is_string($category) ? $category : null,
                is_string($status) ? $status : null,
                is_string($paymentMethod) ? $paymentMethod : null,
            );

            return response()->json([
                'success' => true,
                'data' => $result['expenses'],
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
                'data' => $this->expenseService->getForUser($request->user(), $id),
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
            $validated = $this->validateExpense($request);
            $expense = $this->expenseService->createForUser($request->user(), $validated);

            return response()->json([
                'success' => true,
                'message' => 'Expense saved successfully',
                'data' => $expense,
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
            $validated = $this->validateExpense($request, false);
            $expense = $this->expenseService->updateForUser($request->user(), $id, $validated);

            return response()->json([
                'success' => true,
                'message' => 'Expense updated successfully',
                'data' => $expense,
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
            $this->expenseService->deleteForUser($request->user(), $id);

            return response()->json([
                'success' => true,
                'message' => 'Expense deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function nextReferenceNo(Request $request)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => [
                    'reference_no' => $this->expenseService->getNextReferenceNoForUser($request->user()),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    private function validateExpense(Request $request, bool $requireReference = true): array
    {
        return $request->validate([
            'location' => 'nullable|string|max:100',
            'expense_date' => 'nullable|date',
            'reference_no' => ($requireReference ? 'required' : 'nullable').'|string|max:50',
            'category' => 'required|string|max:100',
            'description' => 'required|string|max:500',
            'amount' => 'required|numeric|min:0.01',
            'discount' => 'nullable|numeric|min:0',
            'payment_method' => 'nullable|string|max:50',
            'status' => 'nullable|string|max:20',
            'notes' => 'nullable|string',
        ]);
    }
}
