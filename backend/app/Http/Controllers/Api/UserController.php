<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ActivityLogService;
use App\Services\CompanySettingService;
use App\Services\PermissionService;
use App\Services\UserService;
use App\Support\UserSchema;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    public function __construct(
        private UserService $userService,
        private ActivityLogService $activityLogService,
        private PermissionService $permissionService,
        private CompanySettingService $companySettingService,
    ) {
    }

    public function index(Request $request)
    {
        try {
            $this->assertCanManageUsers($request);

            $perPage = (int) $request->query('per_page', 15);
            $company = $this->companySettingService->getCompanyForUser($request->user());
            $paginator = $this->userService->getUsersForCompany((int) $company->id, $perPage);
            $paginator->getCollection()->transform(
                fn ($user) => $this->permissionService->formatUserForApi($user)
            );

            return response()->json([
                'success' => true,
                'data' => $paginator,
            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e);
        }
    }

    public function show(Request $request, $id)
    {
        try {
            $this->assertCanManageUsers($request);
            $company = $this->companySettingService->getCompanyForUser($request->user());
            $user = $this->userService->getUserByIdForCompany((int) $id, (int) $company->id);

            return response()->json([
                'success' => true,
                'data' => $this->permissionService->formatUserForApi($user),
            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e, 404);
        }
    }

    public function store(Request $request)
    {
        try {
            $this->assertCanManageUsers($request);

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users',
                'password' => 'required|string|min:8',
                'phone' => 'nullable|string|max:20',
                'city' => 'nullable|string|max:255',
                'role' => 'nullable|string|exists:roles,slug',
                'status' => 'nullable|string|in:active,inactive',
            ]);

            $company = $this->companySettingService->getCompanyForUser($request->user());
            $user = $this->userService->register([
                ...$validated,
                'company_id' => $company->id,
                'role' => $validated['role'] ?? 'staff',
            ]);
            $user = $user->fresh();
            if (
                UserSchema::hasCompanyIdColumn()
                && (int) $user->company_id !== (int) $company->id
            ) {
                $user->update(['company_id' => $company->id]);
            }
            $this->activityLogService->logUserCreation($user->id, $this->stripSensitive($validated));

            return response()->json([
                'success' => true,
                'message' => 'Employee account created. They can log in with their email and password.',
                'data' => $this->permissionService->formatUserForApi($user),
            ], 201);
        } catch (\Exception $e) {
            return $this->errorResponse($e);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $this->assertCanManageUsers($request);

            $validated = $request->validate([
                'name' => 'nullable|string|max:255',
                'email' => 'nullable|email|unique:users,email,'.$id,
                'password' => 'nullable|string|min:8',
                'phone' => 'nullable|string|max:20',
                'city' => 'nullable|string|max:255',
                'role' => 'nullable|string|exists:roles,slug',
                'status' => 'nullable|string|in:active,inactive',
            ]);

            $validated = array_filter($validated, fn ($value) => $value !== null && $value !== '');

            $company = $this->companySettingService->getCompanyForUser($request->user());
            $oldUser = $this->userService->getUserByIdForCompany((int) $id, (int) $company->id);
            $oldData = $this->stripSensitive($oldUser->toArray());

            $user = $this->userService->updateUser((int) $id, $validated);
            $this->activityLogService->logUserUpdate((int) $id, $oldData, $this->stripSensitive($validated));

            return response()->json([
                'success' => true,
                'message' => 'User updated successfully',
                'data' => $this->permissionService->formatUserForApi($user),
            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e);
        }
    }

    public function destroy(Request $request, $id)
    {
        try {
            $this->assertCanManageUsers($request);

            if ((int) $id === (int) $request->user()->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You cannot delete your own account.',
                ], 400);
            }

            $company = $this->companySettingService->getCompanyForUser($request->user());
            $user = $this->userService->getUserByIdForCompany((int) $id, (int) $company->id);
            $this->userService->deleteUser((int) $id);
            $this->activityLogService->logUserDeletion((int) $id, $user->name);

            return response()->json([
                'success' => true,
                'message' => 'User deleted successfully',
            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e, 404);
        }
    }

    public function search(Request $request)
    {
        try {
            $this->assertCanManageUsers($request);

            $validated = $request->validate([
                'query' => 'required|string|min:1',
                'per_page' => 'nullable|integer|min:1',
            ]);

            $perPage = $validated['per_page'] ?? 15;
            $company = $this->companySettingService->getCompanyForUser($request->user());
            $users = $this->userService->searchUsersForCompany(
                $validated['query'],
                (int) $company->id,
                $perPage
            );

            return response()->json([
                'success' => true,
                'data' => $users,
            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e);
        }
    }

    public function resetPassword(Request $request, $id)
    {
        try {
            $this->assertCanManageUsers($request);

            $validated = $request->validate([
                'new_password' => 'required|string|min:8',
            ]);

            $company = $this->companySettingService->getCompanyForUser($request->user());
            $this->userService->getUserByIdForCompany((int) $id, (int) $company->id);
            $this->activityLogService->logPasswordReset((int) $id, Auth::id());

            $user = $this->userService->resetPassword((int) $id, $validated['new_password']);

            return response()->json([
                'success' => true,
                'message' => 'Password reset successfully',
                'data' => $this->permissionService->formatUserForApi($user),
            ], 200);
        } catch (\Exception $e) {
            return $this->errorResponse($e);
        }
    }

    private function assertCanManageUsers(Request $request): void
    {
        if (!$this->permissionService->canManageUsers($request->user())) {
            throw new \Exception('You do not have permission to manage users.');
        }
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function stripSensitive(array $data): array
    {
        unset($data['password'], $data['new_password'], $data['old_password']);

        return $data;
    }

    private function errorResponse(\Exception $e, int $status = 400)
    {
        return response()->json([
            'success' => false,
            'message' => $e->getMessage(),
        ], $status);
    }
}
