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

export interface MobilePermissionItem {
  key: string;
  label: string;
  requires?: string;
}

export interface MobilePermissionTab {
  key: string;
  label: string;
  note?: string;
  groups: { label: string; items: MobilePermissionItem[] }[];
}

/** Marks a role whose Mobile App section has been saved; without it the role keeps full mobile access. */
export const MOBILE_CONFIGURED = "mobile.configured";

export const isMobilePermission = (permission: string) => permission.startsWith("mobile.");

export const allMobileKeys = (catalog: MobilePermissionTab[]): string[] =>
  catalog.flatMap((tab) => [
    tab.key,
    ...tab.groups.flatMap((g) => g.items.map((i) => i.key)),
  ]);

export async function fetchMobilePermissionCatalog(): Promise<MobilePermissionTab[]> {
  const res = await axios.get("/api/roles");
  return res.data.mobile_permission_catalog ?? [];
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
