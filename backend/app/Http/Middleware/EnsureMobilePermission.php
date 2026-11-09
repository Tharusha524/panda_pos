<?php

namespace App\Http\Middleware;

use App\Services\PermissionService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Usage: ->middleware('mobile.can:mobile.customers.delete') — several keys
 * mean any one is enough. Only requests from the mobile app (X-Client-App:
 * pos-mobile) are checked, so the website is never affected.
 */
class EnsureMobilePermission
{
    public function __construct(private PermissionService $permissionService)
    {
    }

    public function handle(Request $request, Closure $next, string ...$keys): Response
    {
        $user = $request->user();

        if (
            !$user
            || !$this->permissionService->isMobileRequest($request)
            || $this->permissionService->mobileCan($user, $keys)
        ) {
            return $next($request);
        }

        return response()->json([
            'success' => false,
            'message' => PermissionService::MOBILE_DENIED_MESSAGE,
            'code' => 'MOBILE_PERMISSION_DENIED',
        ], 403);
    }
}
