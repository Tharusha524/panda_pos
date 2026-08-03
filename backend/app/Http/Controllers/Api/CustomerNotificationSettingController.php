<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CustomerNotificationSettingService;
use Illuminate\Http\Request;

class CustomerNotificationSettingController extends Controller
{
    public function __construct(
        private CustomerNotificationSettingService $notificationSettingService
    ) {
    }

    public function show(Request $request)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $this->notificationSettingService->getForUser($request->user()),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function showSales(Request $request)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $this->notificationSettingService->getSalesForUser($request->user()),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function updateSales(Request $request)
    {
        try {
            $validated = $request->validate([
                'enabled' => 'nullable|boolean',
                'send_email' => 'nullable|boolean',
                'send_sms' => 'nullable|boolean',
                'email_subject' => 'nullable|string|max:255',
                'email_body' => 'nullable|string|max:5000',
                'sms_template' => 'nullable|string|max:500',
            ]);

            $this->notificationSettingService->updateSalesForUser(
                $request->user(),
                $validated
            );

            return response()->json([
                'success' => true,
                'message' => 'Sales notification settings saved successfully',
                'data' => $this->notificationSettingService->getSalesForUser($request->user()),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function showPayment(Request $request)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $this->notificationSettingService->getPaymentForUser($request->user()),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function updatePayment(Request $request)
    {
        try {
            $validated = $request->validate([
                'enabled' => 'nullable|boolean',
                'send_email' => 'nullable|boolean',
                'send_sms' => 'nullable|boolean',
                'email_subject' => 'nullable|string|max:255',
                'email_body' => 'nullable|string|max:5000',
                'sms_template' => 'nullable|string|max:500',
            ]);

            $this->notificationSettingService->updatePaymentForUser(
                $request->user(),
                $validated
            );

            return response()->json([
                'success' => true,
                'message' => 'Payment notification settings saved successfully',
                'data' => $this->notificationSettingService->getPaymentForUser($request->user()),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
