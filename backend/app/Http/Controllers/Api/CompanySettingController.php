<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CompanySettingService;
use Illuminate\Http\Request;

class CompanySettingController extends Controller
{
    public function __construct(private CompanySettingService $companySettingService)
    {
    }

    /** Public — no auth. Logo/name for the login, register, and configure screens. */
    public function publicBranding(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => $this->companySettingService->getPublicBranding(),
        ]);
    }

    public function show(Request $request)
    {
        try {
            $company = $this->companySettingService->getForUser($request->user());

            return response()->json([
                'success' => true,
                'data' => $this->companySettingService->formatCompany($company),
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
                'name' => 'nullable|string|max:255',
                'industry' => 'nullable|string|max:255',
                'email' => 'nullable|email|max:255',
                'phone' => 'nullable|string|max:20',
                'address' => 'nullable|string|max:500',
                'city' => 'nullable|string|max:255',
                'state' => 'nullable|string|max:255',
                'zip' => 'nullable|string|max:20',
                'country' => 'nullable|string|max:255',
                'tax_id' => 'nullable|string|max:100',
                'registration_number' => 'nullable|string|max:100',
                'currency' => 'nullable|string|max:10',
                'language' => 'nullable|string|max:10',
            ]);

            $company = $this->companySettingService->updateForUser(
                $request->user(),
                $validated
            );

            return response()->json([
                'success' => true,
                'message' => 'Company settings saved successfully',
                'data' => $this->companySettingService->formatCompany($company),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function printHeader(Request $request)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $this->companySettingService->getPrintHeaderForUser($request->user()),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function uploadLogo(Request $request)
    {
        try {
            $validated = $request->validate([
                'logo' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            ]);

            $company = $this->companySettingService->uploadLogoForUser(
                $request->user(),
                $validated['logo']
            );

            return response()->json([
                'success' => true,
                'message' => 'Company logo uploaded successfully',
                'data' => $this->companySettingService->formatCompany($company),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function deleteLogo(Request $request)
    {
        try {
            $company = $this->companySettingService->deleteLogoForUser($request->user());

            return response()->json([
                'success' => true,
                'message' => 'Company logo removed',
                'data' => $this->companySettingService->formatCompany($company),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function updateLocale(Request $request)
    {
        try {
            $validated = $request->validate([
                'currency' => 'required|string|max:10',
                'language' => 'required|string|max:10',
            ]);

            $company = $this->companySettingService->updateLocaleForUser(
                $request->user(),
                $validated
            );

            return response()->json([
                'success' => true,
                'message' => 'Currency and language saved successfully',
                'data' => $this->companySettingService->formatCompany($company),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
