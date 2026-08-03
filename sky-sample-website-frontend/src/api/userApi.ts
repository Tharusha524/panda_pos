import axios from "axios";
import { z } from "zod";
import {
  clearAuthStorage,
  getStoredToken,
  getStoredUserRaw,
  isAuthenticated as isSessionAuthenticated,
  purgeLegacyLocalAuth,
  setStoredToken,
  setStoredUserRaw,
} from "../utils/authSession";

const profileFileSchema = z.object({
  gsutil_uri: z.string().optional(),
  imageUrl: z.string().optional(),
  fileName: z.string().optional(),
});

// Updated schema to match backend User model
export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  password: z.string().optional(),
  phone: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  role: z.string().default("user"),
  role_id: z.number().nullable().optional(),
  roleModel: z
    .object({
      id: z.number(),
      name: z.string(),
      slug: z.string().optional(),
      permissions: z.array(z.string()).optional(),
    })
    .nullable()
    .optional(),
  status: z.enum(["active", "inactive"]).default("active"),
  email_verified_at: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  permissionObject: z.record(z.string(), z.boolean()).optional(),
  pos_access: z.record(z.string(), z.boolean()).optional(),
  permissions: z.array(z.string()).optional(),
  is_admin: z.boolean().optional(),
  can_manage_users: z.boolean().optional(),
  profileImage: z.array(profileFileSchema).optional(),
  availability: z.boolean().optional(),
  // Legacy Administration module fields (optional)
  mobile: z.string().optional(),
  department: z.string().optional(),
  jobPosition: z.string().optional(),
  gender: z.string().optional(),
  assignedFactory: z.array(z.string()).optional(),
  responsibleSection: z.array(z.string()).optional(),
  userType: z
    .object({
      id: z.number().optional(),
      userType: z.string(),
    })
    .optional(),
  userLevel: z
    .object({
      id: z.number().optional(),
      levelName: z.string(),
    })
    .optional(),
});

export type User = z.infer<typeof userSchema>;

// Lightweight type for access management roles used across the frontend
export type UserRole = {
  id: number;
  userType: string;
  description?: string;
  permissions?: Record<string, boolean>;
  permissionObject?: Record<string, boolean>;
};

export type UserLevel = {
  id: number;
  levelName: string;
};

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
  
  if (res.data?.data?.token) {
    setStoredToken(res.data.data.token);
  }

  if (res.data?.data?.user) {
    setStoredUserRaw(JSON.stringify(res.data.data.user));
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
  
  if (res.data?.data?.id) {
    setStoredUserRaw(JSON.stringify(res.data.data));
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
  // If there's no token, return the locally stored user to avoid unnecessary network calls
  const token = getStoredToken();
  if (!token) {
    return null;
  }

  try {
    const res = await axios.get("/api/auth/profile");

    const serverUser = res?.data?.data ?? res?.data;

    if (serverUser) {
      setStoredUserRaw(JSON.stringify(serverUser));
    }

    return serverUser;
  } catch (error: unknown) {
    const err = error as { status?: number; response?: { status?: number } };
    const status = err?.status ?? err?.response?.status;
    if (status === 401) {
      clearAuthStorage();
      return null;
    }
    throw error;
  }
}

/**
 * Get all users (paginated)
 */
export async function fetchAllUsers(perPage: number = 15): Promise<User[]> {
  const res = await axios.get(`/api/users?per_page=${perPage}`);
  const payload = res.data?.data ?? res.data;
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && Array.isArray(payload.data)) {
    return payload.data;
  }
  return [];
}

export async function fetchAllAssigneeLevel(): Promise<UserLevel[]> {
  return [];
}

export async function updateUserType(data: Record<string, unknown>): Promise<unknown> {
  const userId = data.id as number | undefined;
  if (userId) {
    return updateUser(userId, data as Partial<User>);
  }
  return data;
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
    clearAuthStorage();
  }
}

/**
 * Get stored user from localStorage
 */
export function getStoredUser(): User | null {
  purgeLegacyLocalAuth();
  const user = getStoredUserRaw();
  return user ? JSON.parse(user) : null;
}

/**
 * Forgot password — step 1: request an OTP be emailed to this address.
 */
export async function forgotPassword(data: { email: string }) {
  const res = await axios.post("/api/auth/forgot-password", data);
  return res.data;
}

/**
 * Forgot password — step 2: verify the OTP.
 */
export async function otpVerification(data: {
  email: string;
  otp: string;
  id?: number;
}) {
  const res = await axios.post("/api/auth/verify-otp", {
    email: data.email,
    otp: data.otp,
  });
  return res.data;
}

/**
 * Forgot password — step 3: set the new password (requires step 2 verified).
 */
export async function resetPassword(data: { email: string; password?: string }) {
  const res = await axios.post("/api/auth/reset-password", data);
  return res.data;
}

/**
 * Change email — step 1: request an OTP be emailed to the current account
 * email. Always acts on the authenticated user; any email/id passed in is
 * ignored (kept in the signature only for the dialog's form state).
 */
export async function resetProfileEmail(data: {
  email: string;
  currentEmail?: string;
  id?: number;
}) {
  const res = await axios.post("/api/auth/profile/email/request-otp", {});
  return res.data;
}

/**
 * Change email — step 2: verify the OTP.
 */
export async function resetProfileEmailVerification(data: {
  email: string;
  otp: string;
  id?: number;
}) {
  const res = await axios.post("/api/auth/profile/email/verify-otp", {
    otp: data.otp,
  });
  return res.data;
}

/**
 * Change email — step 3: apply the new email (requires step 2 verified).
 */
export async function resetProfileEmailConfirm(data: {
  email: string;
  newEmail: string;
  id?: number;
}) {
  const res = await axios.post("/api/auth/profile/email/confirm", {
    newEmail: data.newEmail,
  });
  return res.data;
}

/**
 * Update the current user's profile image
 */
export async function updateUserProfileImage(data: { id: number; imageFile: File }) {
  const formData = new FormData();
  formData.append("image", data.imageFile);
  const res = await axios.post("/api/auth/profile/image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export { getStoredToken } from "../utils/authSession";

/**
 * Check if user is authenticated (session only — not persisted across browser restarts).
 */
export function isAuthenticated(): boolean {
  return isSessionAuthenticated();
}

export interface LoginHistoryRow {
  id: number;
  user_id: number | null;
  user_name: string | null;
  user_email: string | null;
  ip_address: string | null;
  user_agent: string | null;
  description: string | null;
  logged_at: string | null;
}

export interface LoginHistoryResponse {
  logs: LoginHistoryRow[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  can_view_all: boolean;
}

export async function getLoginHistory(params?: {
  page?: number;
  per_page?: number;
  user_id?: number;
}): Promise<LoginHistoryResponse> {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.per_page) search.set("per_page", String(params.per_page));
  if (params?.user_id) search.set("user_id", String(params.user_id));
  const qs = search.toString();
  const res = await axios.get(`/api/auth/login-history${qs ? `?${qs}` : ""}`);
  const payload = res.data?.data;
  if (!payload || !Array.isArray(payload.logs)) {
    throw new Error(res.data?.message ?? "Invalid login history response");
  }
  return payload;
}