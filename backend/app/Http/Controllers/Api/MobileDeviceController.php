<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MobileDeviceProfile;
use Illuminate\Http\Request;

class MobileDeviceController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'device_id' => 'required|string|max:191',
            'device_name' => 'nullable|string|max:191',
            'brand' => 'nullable|string|max:191',
            'model' => 'nullable|string|max:191',
            'manufacturer' => 'nullable|string|max:191',
            'platform' => 'nullable|string|max:20',
            'os_version' => 'nullable|string|max:50',
            'app_version' => 'nullable|string|max:50',
            'private_ip' => 'nullable|string|max:45',
            'public_ip' => 'nullable|string|max:45',
            'permissions' => 'nullable|array',
            'reported_at' => 'nullable|date',
        ]);

        $user = $request->user();
        $serverIp = $request->ip();
        $privateIp = $validated['private_ip'] ?? $serverIp;
        $now = now();

        $profile = MobileDeviceProfile::updateOrCreate(
            [
                'user_id' => $user->id,
                'device_id' => $validated['device_id'],
            ],
            [
                'company_id' => $user->company_id,
                'device_name' => $validated['device_name'] ?? null,
                'brand' => $validated['brand'] ?? null,
                'model' => $validated['model'] ?? null,
                'manufacturer' => $validated['manufacturer'] ?? null,
                'platform' => $validated['platform'] ?? null,
                'os_version' => $validated['os_version'] ?? null,
                'app_version' => $validated['app_version'] ?? null,
                'private_ip' => $privateIp,
                'public_ip' => $validated['public_ip'] ?? null,
                'permissions' => $validated['permissions'] ?? null,
                'payload' => array_merge($validated, [
                    'server_seen_ip' => $serverIp,
                    'user_agent' => $request->userAgent(),
                ]),
                'reported_at' => $validated['reported_at'] ?? $now,
                'last_seen_at' => $now,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Mobile device profile saved',
            'data' => [
                'id' => $profile->id,
                'device_id' => $profile->device_id,
                'private_ip' => $profile->private_ip,
                'public_ip' => $profile->public_ip,
                'last_seen_at' => $profile->last_seen_at?->toIso8601String(),
            ],
        ]);
    }
}
