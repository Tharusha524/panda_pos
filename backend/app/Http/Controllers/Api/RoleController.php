<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PermissionService;
use App\Services\RoleService;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    public function __construct(
        private RoleService $roleService,
        private PermissionService $permissionService,
    ) {
    }

    public function index(Request $request)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $this->roleService->getAll(),
                'permission_catalog' => $this->permissionService->availablePermissions(),
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
            if (!$this->permissionService->canManageUsers($request->user())) {
                return response()->json(['success' => false, 'message' => 'Permission denied.'], 403);
            }

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'slug' => 'nullable|string|max:255|unique:roles,slug',
                'description' => 'nullable|string',
                'permissions' => 'nullable|array',
                'permissions.*' => 'string|max:100',
                'is_active' => 'nullable|boolean',
            ]);

            $role = $this->roleService->create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Role created successfully',
                'data' => $role,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function show(int $id)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $this->roleService->getById($id),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 404);
        }
    }

    public function update(Request $request, int $id)
    {
        try {
            if (!$this->permissionService->canManageUsers($request->user())) {
                return response()->json(['success' => false, 'message' => 'Permission denied.'], 403);
            }

            $validated = $request->validate([
                'name' => 'nullable|string|max:255',
                'slug' => 'nullable|string|max:255|unique:roles,slug,' . $id,
                'description' => 'nullable|string',
                'permissions' => 'nullable|array',
                'permissions.*' => 'string|max:100',
                'is_active' => 'nullable|boolean',
            ]);

            $role = $this->roleService->update($id, $validated);

            return response()->json([
                'success' => true,
                'message' => 'Role updated successfully',
                'data' => $role,
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
            if (!$this->permissionService->canManageUsers($request->user())) {
                return response()->json(['success' => false, 'message' => 'Permission denied.'], 403);
            }

            $this->roleService->delete($id);

            return response()->json([
                'success' => true,
                'message' => 'Role deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
