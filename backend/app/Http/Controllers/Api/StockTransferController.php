<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\StockTransferService;
use Illuminate\Http\Request;

class StockTransferController extends Controller
{
    public function __construct(private StockTransferService $stockTransferService)
    {
    }

    public function context(Request $request)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $this->stockTransferService->getContextForUser($request->user()),
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function search(Request $request)
    {
        try {
            $search = trim((string) $request->query('q', ''));
            $fromLocation = trim((string) $request->query('from_location', ''));
            $toLocation = trim((string) $request->query('to_location', ''));

            if ($fromLocation === '') {
                throw new \Exception('from_location is required.');
            }

            $result = $this->stockTransferService->searchItemsForUser(
                $request->user(),
                $search,
                $fromLocation,
                $toLocation !== '' ? $toLocation : null,
            );

            return response()->json(['success' => true, 'data' => $result['items']]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function summary(Request $request)
    {
        try {
            $toLocation = trim((string) $request->query('to_location', ''));
            $dateFrom = trim((string) $request->query('date_from', ''));
            $dateTo = trim((string) $request->query('date_to', ''));

            if ($toLocation === '') {
                throw new \Exception('to_location is required.');
            }
            if ($dateFrom === '' || $dateTo === '') {
                throw new \Exception('date_from and date_to are required.');
            }

            $result = $this->stockTransferService->transferSummaryForUser(
                $request->user(),
                $toLocation,
                $dateFrom,
                $dateTo,
            );

            return response()->json(['success' => true, 'data' => $result]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function transfer(Request $request)
    {
        try {
            $validated = $request->validate([
                'from_location' => 'required|string|max:100',
                'to_location' => 'required|string|max:100',
                'transfer_date' => 'nullable|date',
                'notes' => 'nullable|string|max:500',
                'lines' => 'required|array|min:1',
                'lines.*.item_id' => 'required|integer',
                // Whole numbers only — these are countable item quantities.
                'lines.*.qty' => 'required|integer|min:1',
            ]);

            $result = $this->stockTransferService->executeTransferForUser($request->user(), $validated);

            return response()->json([
                'success' => true,
                'message' => 'Stock transferred successfully',
                'data' => $result,
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }
}
