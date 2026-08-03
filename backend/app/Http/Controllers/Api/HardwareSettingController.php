<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\HardwareSettingService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class HardwareSettingController extends Controller
{
    public function __construct(private HardwareSettingService $hardwareSettingService)
    {
    }

    public function show(Request $request)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $this->hardwareSettingService->getForUser($request->user()),
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
                'printing_paper_size' => ['nullable', 'string', Rule::in(['a4', 'a5', '80mm', 'letter'])],
                'sales_receipt_printout_style' => ['nullable', 'string', Rule::in(['style_1', 'style_2', 'style_3', 'style_4'])],
                'allow_auto_print' => 'nullable|boolean',
                'allow_multiple_printers' => 'nullable|boolean',
                'allow_customer_display' => 'nullable|boolean',
                'allow_company_details_receipt' => 'nullable|boolean',
                'allow_custom_header_on_sales_receipt' => 'nullable|boolean',
                'custom_header_name' => 'nullable|string|max:255',
                'custom_header_address' => 'nullable|string|max:1000',
                'custom_header_phone' => 'nullable|string|max:50',
                'allow_dual_language_print' => 'nullable|boolean',
                'show_barcode_on_sales_receipt' => 'nullable|boolean',
                'show_item_uom_on_sales_receipt' => 'nullable|boolean',
                'allow_customer_details_on_sales_receipt' => 'nullable|boolean',
                'allow_discount_on_sales_receipt' => 'nullable|boolean',
                'allow_logo_on_sales_receipt' => 'nullable|boolean',
                'customize_label_for_discount' => 'nullable|string|max:100',
                'letterhead_top_margin_cm' => ['nullable', 'string', Rule::in(['none', '5', '10', '15', '20'])],
            ]);

            $data = $this->hardwareSettingService->updateForUser(
                $request->user(),
                $validated
            );

            return response()->json([
                'success' => true,
                'message' => 'Hardware settings saved successfully',
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function uploadLogo80mm(Request $request)
    {
        try {
            $validated = $request->validate([
                'logo' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            ]);

            $data = $this->hardwareSettingService->uploadLogo80mmForUser(
                $request->user(),
                $validated['logo']
            );

            return response()->json([
                'success' => true,
                'message' => '80mm logo uploaded successfully',
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function uploadLogoA4(Request $request)
    {
        try {
            $validated = $request->validate([
                'logo' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            ]);

            $data = $this->hardwareSettingService->uploadLogoA4ForUser(
                $request->user(),
                $validated['logo']
            );

            return response()->json([
                'success' => true,
                'message' => 'A4/A5 logo uploaded successfully',
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function deleteLogo80mm(Request $request)
    {
        try {
            $data = $this->hardwareSettingService->deleteLogo80mmForUser($request->user());

            return response()->json([
                'success' => true,
                'message' => '80mm logo removed',
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function deleteLogoA4(Request $request)
    {
        try {
            $data = $this->hardwareSettingService->deleteLogoA4ForUser($request->user());

            return response()->json([
                'success' => true,
                'message' => 'A4/A5 logo removed',
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function openCashDrawer(Request $request)
    {
        try {
            $result = $this->hardwareSettingService->openCashDrawer();

            return response()->json([
                'success' => true,
                'message' => $result['message'],
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
