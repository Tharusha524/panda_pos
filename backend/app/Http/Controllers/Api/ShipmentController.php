<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ShipmentService;
use Illuminate\Http\Request;

class ShipmentController extends Controller
{
    public function __construct(private ShipmentService $shipmentService)
    {
    }

    public function index(Request $request)
    {
        try {
            $result = $this->shipmentService->getAllForUser(
                $request->user(),
                is_string($request->query('location')) ? $request->query('location') : null,
                is_string($request->query('status')) ? $request->query('status') : null,
                is_string($request->query('date_from')) ? $request->query('date_from') : null,
                is_string($request->query('date_to')) ? $request->query('date_to') : null,
            );

            return response()->json([
                'success' => true,
                'data' => $result['shipments'],
                'summary' => $result['summary'],
                'filters' => $result['filters'],
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function show(Request $request, int $id)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $this->shipmentService->getForUser($request->user(), $id),
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function store(Request $request)
    {
        try {
            $shipment = $this->shipmentService->createForUser(
                $request->user(),
                $this->validateShipment($request)
            );

            return response()->json([
                'success' => true,
                'message' => 'Shipment saved successfully',
                'data' => $shipment,
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function update(Request $request, int $id)
    {
        try {
            $shipment = $this->shipmentService->updateForUser(
                $request->user(),
                $id,
                $this->validateShipment($request, false)
            );

            return response()->json([
                'success' => true,
                'message' => 'Shipment updated successfully',
                'data' => $shipment,
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function destroy(Request $request, int $id)
    {
        try {
            $this->shipmentService->deleteForUser($request->user(), $id);

            return response()->json([
                'success' => true,
                'message' => 'Shipment deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function nextShipmentNo(Request $request)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => ['shipment_no' => $this->shipmentService->getNextShipmentNoForUser($request->user())],
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    private function validateShipment(Request $request, bool $requireNo = true): array
    {
        return $request->validate([
            'shipment_no' => ($requireNo ? 'required' : 'nullable').'|string|max:50',
            'location' => 'nullable|string|max:255',
            'sale_id' => 'nullable|integer',
            'sales_id' => 'nullable|string|max:50',
            'customer_id' => 'nullable|integer',
            'customer_name' => 'nullable|string|max:255',
            'shipment_date' => ($requireNo ? 'required' : 'nullable').'|date',
            'destination' => 'nullable|string|max:255',
            'estimated_delivery_date' => 'nullable|date',
            'weight' => 'nullable|numeric|min:0',
            'freight_cost' => 'nullable|numeric|min:0',
            'invoice_cost' => 'nullable|numeric|min:0',
            'bsl_number' => 'nullable|string|max:100',
            'us_lot_number' => 'nullable|string|max:100',
            'status' => 'nullable|string|max:30',
            'notes' => 'nullable|string',
        ]);
    }
}
