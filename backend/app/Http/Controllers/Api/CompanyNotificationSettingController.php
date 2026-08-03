<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CompanyNotificationSettingService;
use App\Services\StaffAlertNotificationService;
use Illuminate\Http\Request;

class CompanyNotificationSettingController extends Controller
{
    public function __construct(
        private CompanyNotificationSettingService $companyNotificationSettingService,
        private StaffAlertNotificationService $staffAlertNotificationService,
    ) {
    }

    public function show(Request $request)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $this->companyNotificationSettingService->getForUser($request->user()),
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
                'alerts_enabled' => 'nullable|boolean',
                'send_email' => 'nullable|boolean',
                'send_sms' => 'nullable|boolean',
                'notify_owner' => 'nullable|boolean',
                'notify_employees' => 'nullable|boolean',
                'daily_digest' => 'nullable|boolean',
                'smtp_host' => 'nullable|string|max:255',
                'smtp_port' => 'nullable|integer|min:1|max:65535',
                'smtp_username' => 'nullable|string|max:255',
                'smtp_password' => 'nullable|string|max:500',
                'smtp_encryption' => 'nullable|string|in:tls,ssl,none',
                'mail_from_address' => 'nullable|email|max:255',
                'mail_from_name' => 'nullable|string|max:255',
                'sms_api_url' => 'nullable|string|max:500',
                'sms_api_key' => 'nullable|string|max:500',
                'sms_provider' => 'nullable|string|in:http,log,twilio',
            ]);

            $data = $this->companyNotificationSettingService->updateForUser(
                $request->user(),
                $validated
            );

            return response()->json([
                'success' => true,
                'message' => 'Company notification settings saved.',
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function sendTest(Request $request)
    {
        try {
            $result = $this->staffAlertNotificationService->sendCompanyOwnerTest($request->user());

            return response()->json([
                'success' => true,
                'message' => 'Test sent to company main email/phone.',
                'data' => $result,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
