import axios from "axios";

export interface ExpenseCategory {
  id: number;
  name: string;
}

export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
  const res = await axios.get("/api/expenses/categories");
  return res.data.data;
}

export async function createExpenseCategory(name: string): Promise<ExpenseCategory> {
  const res = await axios.post("/api/expenses/categories", { name });
  return res.data.data;
}

export async function updateExpenseCategory(
  id: number,
  name: string
): Promise<ExpenseCategory> {
  const res = await axios.put(`/api/expenses/categories/${id}`, { name });
  return res.data.data;
}

export async function deleteExpenseCategory(id: number): Promise<void> {
  await axios.delete(`/api/expenses/categories/${id}`);
}
