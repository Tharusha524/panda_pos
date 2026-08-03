<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SubscriptionService;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    public function __construct(private SubscriptionService $subscriptionService)
    {
    }

    public function status(Request $request)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $this->subscriptionService->getStatusForUser($request->user()),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function show(Request $request)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $this->subscriptionService->getDetailsForUser($request->user()),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function pay(Request $request)
    {
        try {
            $validated = $request->validate([
                'amount' => 'nullable|numeric|min:0',
                'card_type' => 'nullable|string|max:50',
                'card_number' => 'required|string|min:4|max:24',
            ]);

            $data = $this->subscriptionService->recordOnlinePayment(
                $request->user(),
                $validated
            );

            return response()->json([
                'success' => true,
                'message' => 'Payment recorded successfully. Your subscription is active.',
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
