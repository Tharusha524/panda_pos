import axios from "axios";
import { z } from "zod";

// Updated schema to match backend User model
export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  password: z.string().optional(),
  phone: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  role: z.enum(["admin", "manager", "user"]).default("user"),
  status: z.enum(["active", "inactive"]).default("active"),
  email_verified_at: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type User = z.infer<typeof userSchema>;

export const passwordResetSchema = z.object({
  current_password: z.string(),
  password: z.string(),
  password_confirmation: z.string(),
});

export type PasswordReset = z.infer<typeof passwordResetSchema>;

/**
 * Login user with email and password
 */
export async function login({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const res = await axios.post("/api/auth/login", {
    email,
    password,
  });
  
  // Store token
  if (res.data?.data?.token) {
    localStorage.setItem("token", res.data.data.token);
  }
  
  // Store user data
  if (res.data?.data?.user) {
    localStorage.setItem("user", JSON.stringify(res.data.data.user));
  }
  
  return res.data;
}

/**
 * Register new user
 */
export async function registerUser({
  name,
  email,
  password,
  password_confirmation,
  phone,
  city,
}: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
  city?: string;
}) {
  const res = await axios.post("/api/auth/register", {
    name,
    email,
    password,
    password_confirmation,
    phone,
    city,
  });
  
  // Store user data on successful registration
  if (res.data?.data?.id) {
    localStorage.setItem("user", JSON.stringify(res.data.data));
  }
  
  return res.data;
}

/**
 * Change user password
 */
export async function userPasswordReset(data: PasswordReset) {
  const res = await axios.post(`/api/auth/change-password`, data);
  return res.data;
}

/**
 * Get current user profile
 */
export async function getCurrentUser() {
  const res = await axios.get("/api/auth/profile");
  
  if (res.data?.data) {
    localStorage.setItem("user", JSON.stringify(res.data.data));
  }
  
  return res.data;
}

/**
 * Get all users (paginated)
 */
export async function fetchAllUsers(perPage: number = 15) {
  const res = await axios.get(`/api/users?per_page=${perPage}`);
  return res.data;
}

/**
 * Get user by ID
 */
export async function getUserById(id: number) {
  const res = await axios.get(`/api/users/${id}`);
  return res.data;
}

/**
 * Create new user (Admin only)
 */
export async function createUser(userData: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  city?: string;
  role?: string;
  status?: string;
}) {
  const res = await axios.post("/api/users", userData);
  return res.data;
}

/**
 * Update user
 */
export async function updateUser(id: number, userData: Partial<User>) {
  const res = await axios.put(`/api/users/${id}`, userData);
  return res.data;
}

/**
 * Delete user
 */
export async function deleteUser(id: number) {
  const res = await axios.delete(`/api/users/${id}`);
  return res.data;
}

/**
 * Search users
 */
export async function searchUsers(query: string, perPage: number = 15) {
  const res = await axios.get(`/api/users/search?query=${query}&per_page=${perPage}`);
  return res.data;
}

/**
 * Reset user password (Admin only)
 */
export async function resetUserPassword(id: number, newPassword: string) {
  const res = await axios.post(`/api/users/${id}/reset-password`, {
    new_password: newPassword,
  });
  return res.data;
}

/**
 * Logout user
 */
export async function logout() {
  try {
    await axios.post("/api/auth/logout");
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    // Clear local storage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
}

/**
 * Get stored user from localStorage
 */
export function getStoredUser(): User | null {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

/**
 * Get stored token from localStorage
 */
export function getStoredToken(): string | null {
  return localStorage.getItem("token");
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem("token");
}
