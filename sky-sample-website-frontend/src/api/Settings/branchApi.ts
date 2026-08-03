import axios from "axios";

export interface Branch {
  id: number;
  company_id: number;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  is_active: boolean;
}

export type BranchPayload = {
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  is_active?: boolean;
};

export async function fetchBranches(): Promise<Branch[]> {
  const res = await axios.get("/api/branches");
  return res.data.data;
}

export async function createBranch(payload: BranchPayload): Promise<Branch> {
  const res = await axios.post("/api/branches", payload);
  return res.data.data;
}

export async function updateBranch(
  id: number,
  payload: Partial<BranchPayload>
): Promise<Branch> {
  const res = await axios.put(`/api/branches/${id}`, payload);
  return res.data.data;
}

export async function deleteBranch(id: number): Promise<void> {
  await axios.delete(`/api/branches/${id}`);
}
