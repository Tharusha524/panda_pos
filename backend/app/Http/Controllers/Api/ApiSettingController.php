<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ApiSettingService;
use Illuminate\Http\Request;

class ApiSettingController extends Controller
{
    public function __construct(private ApiSettingService $apiSettingService)
    {
    }

    public function show(Request $request)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $this->apiSettingService->getForUser($request->user()),
            ]);
        } catch (\Exception $e) {
            $status = str_contains($e->getMessage(), 'administrators') ? 403 : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $status);
        }
    }

    public function update(Request $request)
    {
        try {
            $validated = $request->validate([
                'api_enabled' => 'sometimes|boolean',
                'public_base_url' => 'nullable|string|max:500',
                'integration_api_key' => 'nullable|string|max:500',
                'webhook_enabled' => 'sometimes|boolean',
                'webhook_url' => 'nullable|string|max:500',
                'webhook_secret' => 'nullable|string|max:500',
                'cors_allowed_origins' => 'nullable|string|max:2000',
                'mobile_sync_enabled' => 'sometimes|boolean',
                'mobile_sync_interval_seconds' => 'sometimes|integer|min:60|max:86400',
                'sms_api_url' => 'nullable|string|max:500',
                'sms_api_key' => 'nullable|string|max:500',
                'payment_gateway' => 'sometimes|string|in:none,stripe,paypal,custom',
                'payment_gateway_key' => 'nullable|string|max:500',
                'notes' => 'nullable|string|max:5000',
            ]);

            $data = $this->apiSettingService->updateForUser($request->user(), $validated);

            return response()->json([
                'success' => true,
                'message' => 'API settings saved successfully',
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            $status = str_contains($e->getMessage(), 'administrators') ? 403 : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $status);
        }
    }

    public function regenerateKey(Request $request)
    {
        try {
            $data = $this->apiSettingService->regenerateIntegrationKey($request->user());

            return response()->json([
                'success' => true,
                'message' => 'Integration API key generated. Copy it now — it will not be shown again in full.',
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            $status = str_contains($e->getMessage(), 'administrators') ? 403 : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $status);
        }
    }
}
