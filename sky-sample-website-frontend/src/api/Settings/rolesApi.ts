import axios from "axios";

export interface Role {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  permissions: string[];
  is_active: boolean;
  users_count?: number;
  created_at?: string;
  updated_at?: string;
}

export type RolePayload = {
  name: string;
  slug?: string;
  description?: string;
  permissions?: string[];
  is_active?: boolean;
};

export async function fetchRoles(): Promise<Role[]> {
  const res = await axios.get("/api/roles");
  return res.data.data;
}

export async function createRole(payload: RolePayload): Promise<Role> {
  const res = await axios.post("/api/roles", payload);
  return res.data.data;
}

export async function updateRole(id: number, payload: Partial<RolePayload>): Promise<Role> {
  const res = await axios.put(`/api/roles/${id}`, payload);
  return res.data.data;
}

export async function deleteRole(id: number): Promise<void> {
  await axios.delete(`/api/roles/${id}`);
}

export const AVAILABLE_PERMISSIONS = [
  "sales.view",
  "sales.create",
  "inventory.view",
  "inventory.edit",
  "customers.view",
  "payments.create",
  "purchasing.view",
  "shipping.view",
  "offers.view",
  "repair.view",
  "reports.view",
  "settings.view",
  "users.view",
];
