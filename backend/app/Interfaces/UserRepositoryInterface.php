<?php

namespace App\Interfaces;

interface UserRepositoryInterface
{
    /**
     * Get all users
     */
    public function getAll(int $perPage = 15);

    /**
     * Users belonging to the same company (for admin employee list)
     */
    public function getAllForCompany(int $companyId, int $perPage = 15);

    /**
     * Get user by ID
     */
    public function getById(int $id);

    /**
     * Get user by email
     */
    public function getByEmail(string $email);

    /**
     * Create a new user
     */
    public function create(array $data);

    /**
     * Update user
     */
    public function update(int $id, array $data);

    /**
     * Delete user
     */
    public function delete(int $id);

    /**
     * Search users
     */
    public function search(string $query, int $perPage = 15);

    /**
     * Check if email exists
     */
    public function emailExists(string $email, int $exceptId = null);
}
