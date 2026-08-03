<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Offer;
use App\Services\OfferDiscountService;
use App\Services\OfferService;
use Illuminate\Http\Request;

class OfferController extends Controller
{
    public function __construct(
        private OfferService $offerService,
        private OfferDiscountService $offerDiscountService,
    ) {
    }

    public function index(Request $request)
    {
        try {
            $discountType = $request->query('discount_type');
            $status = $request->query('status');

            $result = $this->offerService->getAllForUser(
                $request->user(),
                is_string($discountType) ? $discountType : null,
                is_string($status) ? $status : null,
            );

            return response()->json([
                'success' => true,
                'data' => $result['offers'],
                'summary' => $result['summary'],
                'filters' => $result['filters'],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function applicable(Request $request)
    {
        try {
            $saleDate = $request->query('sale_date');

            return response()->json([
                'success' => true,
                'data' => $this->offerDiscountService->getApplicableOffersForUser(
                    $request->user(),
                    is_string($saleDate) ? $saleDate : null,
                ),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function preview(Request $request)
    {
        try {
            $validated = $request->validate([
                'offer_id' => 'required|integer',
                'sale_date' => 'nullable|date',
                'promo_code' => 'nullable|string|max:50',
                'lines' => 'required|array|min:1',
                'lines.*.item_id' => 'nullable|integer',
                'lines.*.item_number' => 'nullable|string|max:50',
                'lines.*.description' => 'nullable|string|max:255',
                'lines.*.qty' => 'required|numeric|min:0.01',
                'lines.*.unit_price' => 'required|numeric|min:0',
                'lines.*.item_batch_id' => 'nullable|integer|exists:item_batches,id',
            ]);

            $offer = $this->offerDiscountService->resolveOfferForUser(
                $request->user(),
                (int) $validated['offer_id'],
            );

            $result = $this->offerDiscountService->applyToLines(
                $offer,
                $validated['lines'],
                $validated['sale_date'] ?? null,
                $validated['promo_code'] ?? null,
            );

            // Stacked preview: primary selected offer + best opposite-type offer.
            $pricingMode = strtolower(trim((string) ($request->query('pricing_mode', 'retail'))));
            if (!in_array($pricingMode, ['retail', 'wholesale'], true)) {
                $pricingMode = 'retail';
            }
            $stackType = $offer->discount_type === 'product' ? 'order' : 'product';
            $bestStackedDiscount = 0.0;
            $bestStackedLines = null;
            $promoCode = $validated['promo_code'] ?? null;

            $candidateOffers = Offer::where('company_id', (int) $offer->company_id)
                ->where('is_active', true)
                ->where('discount_type', $stackType)
                ->where('id', '!=', $offer->id)
                ->with(['items', 'itemBatches'])
                ->get();

            foreach ($candidateOffers as $candidate) {
                $candidatePricingMode = strtolower(trim((string) ($candidate->pricing_mode ?? 'both')));
                if (
                    in_array($candidatePricingMode, ['retail', 'wholesale'], true)
                    && $candidatePricingMode !== $pricingMode
                ) {
                    continue;
                }
                try {
                    $stacked = $this->offerDiscountService->applyToLines(
                        $candidate,
                        $result['lines'],
                        $validated['sale_date'] ?? null,
                        is_string($promoCode) ? $promoCode : null,
                    );
                    $discountAmount = (float) ($stacked['offer_discount'] ?? 0);
                    if ($discountAmount > $bestStackedDiscount) {
                        $bestStackedDiscount = $discountAmount;
                        $bestStackedLines = $stacked['lines'] ?? null;
                    }
                } catch (\Throwable) {
                    // Ignore non-qualifying stack candidate.
                }
            }

            if ($bestStackedDiscount > 0) {
                $result['offer_discount'] = round((float) $result['offer_discount'] + $bestStackedDiscount, 2);
                if (is_array($bestStackedLines)) {
                    $result['lines'] = $bestStackedLines;
                }
            }

            $subTotal = round(array_sum(array_column($result['lines'], 'line_total')), 2);

            return response()->json([
                'success' => true,
                'data' => [
                    'offer_discount' => $result['offer_discount'],
                    'sub_total' => $subTotal,
                    'lines' => $result['lines'],
                    'offer_promo_code' => $result['offer_promo_code'] ?? null,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function show(Request $request, int $id)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $this->offerService->getForUser($request->user(), $id),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function store(Request $request)
    {
        try {
            $validated = $this->validateOffer($request);

            $offer = $this->offerService->createForUser($request->user(), $validated);

            return response()->json([
                'success' => true,
                'message' => 'Offer saved successfully',
                'data' => $offer,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function update(Request $request, int $id)
    {
        try {
            $validated = $this->validateOffer($request, false);

            $offer = $this->offerService->updateForUser($request->user(), $id, $validated);

            return response()->json([
                'success' => true,
                'message' => 'Offer updated successfully',
                'data' => $offer,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function destroy(Request $request, int $id)
    {
        try {
            $this->offerService->deleteForUser($request->user(), $id);

            return response()->json([
                'success' => true,
                'message' => 'Offer deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    private function validateOffer(Request $request, bool $requireName = true): array
    {
        return $request->validate([
            'name' => ($requireName ? 'required' : 'sometimes|required').'|string|max:255',
            'description' => 'nullable|string',
            'days_of_week_enabled' => 'nullable|boolean',
            'days_of_week' => 'nullable|array',
            'days_of_week.*' => 'string|max:20',
            'expiration_enabled' => 'nullable|boolean',
            'expiration_date' => 'nullable|date',
            'discount_type' => 'nullable|string|in:product,order',
            'pricing_mode' => 'nullable|string|in:retail,wholesale,both',
            'discount_rules' => 'nullable|array',
            'item_ids' => 'nullable|array',
            'item_ids.*' => 'integer|exists:items,id',
            'item_batch_ids' => 'nullable|array',
            'item_batch_ids.*' => 'integer|exists:item_batches,id',
            'is_active' => 'nullable|boolean',
        ]);
    }
}
