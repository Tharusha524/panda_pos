<?php

namespace App\Services;

use App\Models\Role;
use Exception;
use Illuminate\Support\Str;

class RoleService
{
    public function getAll()
    {
        return Role::withCount('users')->orderBy('name')->get();
    }

    public function getById(int $id): Role
    {
        $role = Role::find($id);
        if (!$role) {
            throw new Exception('Role not found');
        }
        return $role;
    }

    public function getBySlug(string $slug): ?Role
    {
        return Role::where('slug', $slug)->first();
    }

    public function create(array $data): Role
    {
        $slug = $data['slug'] ?? Str::slug($data['name']);

        if (Role::where('slug', $slug)->exists()) {
            throw new Exception('Role slug already exists');
        }

        return Role::create([
            'name' => $data['name'],
            'slug' => $slug,
            'description' => $data['description'] ?? null,
            'permissions' => $data['permissions'] ?? [],
            'is_active' => $data['is_active'] ?? true,
        ]);
    }

    public function update(int $id, array $data): Role
    {
        $role = $this->getById($id);

        if (isset($data['slug']) && $data['slug'] !== $role->slug) {
            if (Role::where('slug', $data['slug'])->where('id', '!=', $id)->exists()) {
                throw new Exception('Role slug already exists');
            }
        }

        $payload = [];
        if (array_key_exists('name', $data)) {
            $payload['name'] = $data['name'];
        }
        if (array_key_exists('slug', $data)) {
            $payload['slug'] = $data['slug'];
        }
        if (array_key_exists('description', $data)) {
            $payload['description'] = $data['description'];
        }
        if (array_key_exists('permissions', $data)) {
            $payload['permissions'] = $data['permissions'];
        }
        if (array_key_exists('is_active', $data)) {
            $payload['is_active'] = (bool) $data['is_active'];
        }
        if ($payload !== []) {
            $role->update($payload);
        }

        return $role->fresh();
    }

    public function delete(int $id): void
    {
        $role = $this->getById($id);

        if ($role->users()->exists()) {
            throw new Exception('Cannot delete role assigned to users');
        }

        $role->delete();
    }
}
