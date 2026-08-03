<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\UserSettingService;
use Illuminate\Http\Request;

class UserSettingController extends Controller
{
    public function __construct(private UserSettingService $userSettingService)
    {
    }

    public function show(Request $request)
    {
        try {
            $data = $this->userSettingService->getForUser($request->user());

            return response()->json([
                'success' => true,
                'data' => $data,
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
                'first_name' => 'nullable|string|max:255',
                'last_name' => 'nullable|string|max:255',
                'email' => 'nullable|email|max:255',
                'phone' => 'nullable|string|max:20',
                'role' => 'nullable|string|exists:roles,slug',
                'two_factor_enabled' => 'nullable|boolean',
            ]);

            $data = $this->userSettingService->updateForUser(
                $request->user(),
                $validated
            );

            return response()->json([
                'success' => true,
                'message' => 'User settings saved successfully',
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
