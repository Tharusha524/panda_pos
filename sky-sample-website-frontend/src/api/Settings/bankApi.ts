import axios from "axios";

export interface Bank {
  id: number;
  company_id: number;
  bank_code: string;
  name: string;
  address: string;
  is_active: boolean;
}

export type BankPayload = {
  bank_code?: string;
  name: string;
  address?: string;
  is_active?: boolean;
};

export async function fetchBanks(): Promise<Bank[]> {
  const res = await axios.get("/api/banks");
  return res.data.data;
}

export async function createBank(payload: BankPayload): Promise<Bank> {
  const res = await axios.post("/api/banks", payload);
  return res.data.data;
}

export async function updateBank(
  id: number,
  payload: Partial<BankPayload>
): Promise<Bank> {
  const res = await axios.put(`/api/banks/${id}`, payload);
  return res.data.data;
}

export async function deleteBank(id: number): Promise<void> {
  await axios.delete(`/api/banks/${id}`);
}
