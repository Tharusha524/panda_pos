<?php

namespace App\Http\Middleware;

use App\Services\SubscriptionService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSubscriptionPaid
{
    public function __construct(private SubscriptionService $subscriptionService)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || $this->subscriptionService->canAccess($user)) {
            return $next($request);
        }

        return response()->json([
            'success' => false,
            'message' => 'Monthly subscription payment is required. Please pay online to continue using the system.',
            'code' => 'SUBSCRIPTION_PAYMENT_REQUIRED',
            'data' => $this->subscriptionService->getStatusForUser($user),
        ], 402);
    }
}
