<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AlertNotificationTemplateService;
use App\Services\StaffAlertNotificationService;
use App\Services\SmsConfigService;
use App\Services\SystemAlertService;
use Illuminate\Http\Request;

class SystemAlertController extends Controller
{
    public function __construct(
        private SystemAlertService $systemAlertService,
        private StaffAlertNotificationService $staffAlertNotificationService,
        private SmsConfigService $smsConfigService,
        private AlertNotificationTemplateService $alertNotificationTemplateService,
    ) {
    }

    public function index(Request $request)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $this->systemAlertService->getAlertsForUser($request->user()),
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
            $result = $this->staffAlertNotificationService->sendTestNotification($request->user());
            $smsStatus = $this->smsConfigService->statusForUser($request->user());

            return response()->json([
                'success' => true,
                'message' => 'Test notification sent.',
                'data' => array_merge($result, [
                    'sms_config' => $smsStatus,
                ]),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function templatePreview(Request $request)
    {
        try {
            $preview = $this->alertNotificationTemplateService->buildPreviewSample();

            return response()->json([
                'success' => true,
                'data' => $preview,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
