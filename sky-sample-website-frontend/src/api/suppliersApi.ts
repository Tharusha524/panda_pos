import axios from "axios";

export interface Supplier {
  id: number;
  location: string;
  supplier_code: string;
  first_name: string;
  name: string;
  phone: string;
  phone_display?: string;
  email: string | null;
  opening_balance: number;
  net_balance: number;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  country: string | null;
}

export type SupplierPayload = Omit<Supplier, "id" | "name" | "net_balance" | "phone_display"> & {
  supplier_code?: string;
};

export interface SuppliersListResponse {
  suppliers: Supplier[];
  summary?: {
    total_suppliers: number;
    total_payables: number;
  };
  locations: string[];
}

export async function getSuppliers(location = "all"): Promise<SuppliersListResponse> {
  const res = await axios.get("/api/suppliers", {
    params: location && location !== "all" ? { location } : {},
  });
  const data = res.data.data;
  if (Array.isArray(data)) {
    return {
      suppliers: data,
      summary: res.data.summary,
      locations: res.data.filters?.locations ?? ["Main Location"],
    };
  }
  return {
    suppliers: data?.suppliers ?? [],
    summary: res.data.summary,
    locations: data?.filters?.locations ?? res.data.filters?.locations ?? ["Main Location"],
  };
}

export async function getSupplier(id: number): Promise<Supplier> {
  const res = await axios.get(`/api/suppliers/${id}`);
  return res.data.data;
}

export async function createSupplier(payload: SupplierPayload): Promise<Supplier> {
  const res = await axios.post("/api/suppliers", payload);
  return res.data.data;
}

export async function updateSupplier(
  id: number,
  payload: Partial<SupplierPayload>
): Promise<Supplier> {
  const res = await axios.put(`/api/suppliers/${id}`, payload);
  return res.data.data;
}

export async function deleteSupplier(id: number): Promise<void> {
  await axios.delete(`/api/suppliers/${id}`);
}
