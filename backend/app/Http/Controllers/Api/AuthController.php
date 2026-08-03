<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\UserService;
use App\Services\ActivityLogService;
use App\Services\SubscriptionService;
use App\Services\PermissionService;
use App\Services\CompanySettingService;
use App\Services\OtpService;
use App\Support\UserSchema;
use App\Models\Company;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function __construct(
        private UserService $userService,
        private ActivityLogService $activityLogService,
        private SubscriptionService $subscriptionService,
        private PermissionService $permissionService,
        private CompanySettingService $companySettingService,
        private OtpService $otpService,
    ) {
    }

    /**
     * Register a new user
     */
    public function register(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users',
                'password' => 'required|string|min:8|confirmed',
                'phone' => 'nullable|string|max:20',
                'city' => 'nullable|string|max:255',
            ]);

            $user = $this->userService->register($validated);
            if (UserSchema::hasCompanyIdColumn() && !UserSchema::companyIdFor($user)) {
                $this->companySettingService->provisionOwnedCompanyForUser($user->fresh());
            }
            $this->activityLogService->logRegistration($user->id, $validated);

            return response()->json([
                'success' => true,
                'message' => 'User registered successfully',
                'data' => $user,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Login user
     */
    public function login(Request $request)
    {
        try {
            $validated = $request->validate([
                'email' => 'required|email',
                'password' => 'required|string',
            ]);

            $user = $this->userService->login($validated['email'], $validated['password']);

            try {
                $this->activityLogService->logLogin(
                    $user->id,
                    $user->email,
                    $request->ip(),
                    $request->userAgent()
                );
            } catch (\Throwable $e) {
                report($e);
            }

            $token = $user->createToken('POS-APP')->plainTextToken;

            $user->load('roleModel');

            $company = null;
            $subscription = null;
            try {
                $subscription = $this->subscriptionService->getStatusForUser($user);
            } catch (\Throwable) {
                // subscription tables may be missing on older DBs
            }
            if (UserSchema::hasCompanyIdColumn()) {
                try {
                    $company = $this->companySettingService->getCompanyForUser($user);
                } catch (\Throwable) {
                    // company provisioning failed
                }
            } else {
                $company = Company::where('user_id', $user->id)->first();
            }

            $formattedUser = null;
            try {
                $formattedUser = $this->permissionService->formatUserForApi($user);
            } catch (\Throwable) {
                // still return token if profile formatting fails on older DBs
            }

            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'data' => [
                    'user' => $formattedUser,
                    'company' => $company
                        ? $this->companySettingService->formatCompany($company)
                        : null,
                    'token' => $token,
                    'subscription' => $subscription,
                ],
            ], 200);
        } catch (QueryException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Database schema is out of date. On the server run: php artisan migrate --force',
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 401);
        }
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        try {
            $userId = $request->user()->id;
            $this->activityLogService->logLogout($userId);
            
            $request->user()->currentAccessToken()->delete();

            return response()->json([
                'success' => true,
                'message' => 'Logout successful',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get current user profile
     */
    public function profile(Request $request)
    {
        $user = $request->user();
        $user->load('roleModel');

        return response()->json([
            'success' => true,
            'data' => $this->permissionService->formatUserForApi($user),
        ], 200);
    }

    /**
     * Upload (replace) the current user's profile image
     */
    public function uploadProfileImage(Request $request)
    {
        try {
            $validated = $request->validate([
                'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            ]);

            $this->userService->uploadProfileImage($request->user()->id, $validated['image']);

            return response()->json([
                'success' => true,
                'message' => 'Profile image updated successfully',
                'data' => $this->permissionService->formatUserForApi($request->user()->fresh()),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Remove the current user's profile image
     */
    public function deleteProfileImage(Request $request)
    {
        try {
            $this->userService->deleteProfileImage($request->user()->id);

            return response()->json([
                'success' => true,
                'message' => 'Profile image removed',
                'data' => $this->permissionService->formatUserForApi($request->user()->fresh()),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Login history with IP addresses (company admins see all staff logins).
     */
    public function loginHistory(Request $request)
    {
        try {
            $perPage = min(100, max(5, (int) $request->query('per_page', 25)));
            $page = max(1, (int) $request->query('page', 1));
            $filterUserId = $request->query('user_id');
            $filterUserId = $filterUserId !== null && $filterUserId !== ''
                ? (int) $filterUserId
                : null;

            $data = $this->activityLogService->getLoginHistoryForUser(
                $request->user(),
                $perPage,
                $filterUserId,
                $page
            );

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

    /**
     * Change password
     */
    public function changePassword(Request $request)
    {
        try {
            $validated = $request->validate([
                'old_password' => 'required|string',
                'new_password' => 'required|string|min:8|confirmed',
            ]);

            $this->userService->changePassword(
                $request->user()->id,
                $validated['old_password'],
                $validated['new_password']
            );

            return response()->json([
                'success' => true,
                'message' => 'Password changed successfully',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Forgot password — step 1: email a one-time code (public).
     * Always responds success, even for an unknown email, to avoid leaking
     * which addresses are registered.
     */
    public function forgotPassword(Request $request)
    {
        try {
            $validated = $request->validate([
                'email' => 'required|email',
            ]);

            $user = User::where('email', $validated['email'])->first();
            if ($user) {
                $this->otpService->issue('password_reset', $user->email, $user->id, $user->name);
            }

            return response()->json([
                'success' => true,
                'message' => 'If that email is registered, a code has been sent to it.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Forgot password — step 2: verify the code (public).
     */
    public function verifyPasswordResetOtp(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'otp' => 'required|string',
        ]);

        $verified = $this->otpService->verify('password_reset', $validated['email'], $validated['otp']);

        if (!$verified) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired OTP.',
            ], 422);
        }

        return response()->json(['success' => true]);
    }

    /**
     * Forgot password — step 3: set the new password (public).
     * Requires a code already verified in step 2 for this email.
     */
    public function resetPasswordWithOtp(Request $request)
    {
        try {
            $validated = $request->validate([
                'email' => 'required|email',
                'password' => 'required|string|min:8',
            ]);

            if (!$this->otpService->consumeIfVerified('password_reset', $validated['email'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Please verify your OTP again.',
                ], 422);
            }

            $user = User::where('email', $validated['email'])->first();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found.',
                ], 404);
            }

            $user->update(['password' => $validated['password']]);
            $user->tokens()->delete();

            return response()->json([
                'success' => true,
                'message' => 'Password reset successful.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Change email — step 1: email a one-time code to the CURRENT account
     * email (authenticated; always uses the logged-in user's own email,
     * ignoring any email supplied by the client).
     */
    public function requestEmailChangeOtp(Request $request)
    {
        $user = $request->user();
        $this->otpService->issue('email_change', $user->email, $user->id, $user->name);

        return response()->json([
            'success' => true,
            'message' => 'OTP sent to your current email.',
        ]);
    }

    /**
     * Change email — step 2: verify the code (authenticated).
     */
    public function verifyEmailChangeOtp(Request $request)
    {
        $validated = $request->validate([
            'otp' => 'required|string',
        ]);

        $user = $request->user();
        $verified = $this->otpService->verify('email_change', $user->email, $validated['otp']);

        if (!$verified) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired OTP.',
            ], 422);
        }

        return response()->json(['success' => true]);
    }

    /**
     * Change email — step 3: apply the new email (authenticated).
     * Requires a code already verified in step 2 for this user's current email.
     * Revokes all tokens afterward since the account identity changed.
     */
    public function confirmEmailChange(Request $request)
    {
        try {
            $user = $request->user();

            $validated = $request->validate([
                'newEmail' => 'required|email|unique:users,email,' . $user->id,
            ]);

            if (!$this->otpService->consumeIfVerified('email_change', $user->email)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Please verify your OTP again.',
                ], 422);
            }

            $user->update(['email' => $validated['newEmail']]);
            $user->tokens()->delete();

            return response()->json([
                'success' => true,
                'message' => 'Email updated successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
