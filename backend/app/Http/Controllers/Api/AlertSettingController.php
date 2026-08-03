<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AlertSettingService;
use Illuminate\Http\Request;

class AlertSettingController extends Controller
{
    public function __construct(private AlertSettingService $alertSettingService)
    {
    }

    public function show(Request $request)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $this->alertSettingService->getForUser($request->user()),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function update(Request $request)
    {
        try {
            $validated = $request->validate([
                'expiry_alert_period_days' => 'nullable|integer|min:0|max:365',
                'cheque_alert_period_days' => 'nullable|integer|min:0|max:365',
                'staff_notify_email' => 'nullable|email|max:255',
                'staff_notify_phone' => 'nullable|string|max:32',
                'staff_send_email' => 'nullable|boolean',
                'staff_send_sms' => 'nullable|boolean',
                'staff_daily_digest' => 'nullable|boolean',
            ]);

            $data = $this->alertSettingService->updateForUser(
                $request->user(),
                $validated
            );

            return response()->json([
                'success' => true,
                'message' => 'Alert settings saved successfully',
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
