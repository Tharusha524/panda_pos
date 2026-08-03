import axios from "axios";

export interface SettingsUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  role: string;
  status: string;
  role_model?: {
    id: number;
    name: string;
    slug: string;
  } | null;
  roleModel?: {
    id: number;
    name: string;
    slug: string;
  } | null;
}

export type CreateSettingsUserPayload = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  city?: string;
  role?: string;
  status?: string;
};

export type UpdateSettingsUserPayload = {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  city?: string;
  role?: string;
  status?: string;
};

function extractUsersList(payload: unknown): SettingsUser[] {
  if (Array.isArray(payload)) {
    return payload as SettingsUser[];
  }
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    Array.isArray((payload as { data: SettingsUser[] }).data)
  ) {
    return (payload as { data: SettingsUser[] }).data;
  }
  return [];
}

export async function fetchSettingsUsers(perPage = 100): Promise<SettingsUser[]> {
  const res = await axios.get(`/api/users?per_page=${perPage}`);
  const payload = res.data?.data ?? res.data;
  return extractUsersList(payload);
}

export async function getSettingsUserById(id: number): Promise<SettingsUser> {
  const res = await axios.get(`/api/users/${id}`);
  return res.data.data;
}

export async function createSettingsUser(
  payload: CreateSettingsUserPayload
): Promise<SettingsUser> {
  const res = await axios.post("/api/users", payload);
  return res.data.data;
}

export async function updateSettingsUser(
  id: number,
  payload: UpdateSettingsUserPayload
): Promise<SettingsUser> {
  const res = await axios.put(`/api/users/${id}`, payload);
  return res.data.data;
}

export async function deleteSettingsUser(id: number): Promise<void> {
  await axios.delete(`/api/users/${id}`);
}

export function getRoleLabel(user: SettingsUser): string {
  return user.role_model?.name ?? user.roleModel?.name ?? user.role ?? "—";
}

export function getRoleSlug(user: SettingsUser): string {
  return user.role_model?.slug ?? user.roleModel?.slug ?? user.role ?? "user";
}
