<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\RepairService;
use Illuminate\Http\Request;

class RepairController extends Controller
{
    public function __construct(private RepairService $repairService)
    {
    }

    public function index(Request $request)
    {
        try {
            $result = $this->repairService->getDashboardForUser(
                $request->user(),
                is_string($request->query('location')) ? $request->query('location') : null,
            );

            return response()->json([
                'success' => true,
                'data' => $result['items'],
                'summary' => $result['summary'],
                'filters' => $result['filters'],
                'selected_location' => $result['selected_location'],
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function search(Request $request)
    {
        try {
            $search = trim((string) $request->query('q', ''));
            $fromLocation = (string) $request->query('from_location', RepairService::REPAIR_LOCATION);

            $result = $this->repairService->searchItemsForUser(
                $request->user(),
                $search,
                $fromLocation,
            );

            return response()->json(['success' => true, 'data' => $result['items']]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function context(Request $request)
    {
        try {
            $type = (string) $request->query('type', 'send');

            return response()->json([
                'success' => true,
                'data' => $this->repairService->getTransferContextForUser($request->user(), $type),
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function transfer(Request $request)
    {
        try {
            $validated = $request->validate([
                'transfer_type' => 'required|string|in:send,receive',
                'from_location' => 'required|string|max:100',
                'to_location' => 'required|string|max:100',
                'transfer_date' => 'nullable|date',
                'lines' => 'required|array|min:1',
                'lines.*.item_id' => 'required|integer',
                'lines.*.qty' => 'required|numeric|min:0.01',
            ]);

            $result = $this->repairService->executeTransferForUser($request->user(), $validated);

            return response()->json([
                'success' => true,
                'message' => 'Items transferred successfully',
                'data' => $result,
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }
}
