import axios from "axios";

export interface ExpenseDetailLine {
  category: string;
  description: string;
  amount: number;
  discount: number;
  paid_amount: number;
}

export interface Expense {
  id: number;
  location: string;
  expense_date: string;
  expense_datetime?: string;
  reference_no: string;
  category: string;
  description: string;
  amount: number;
  discount: number;
  paid_amount: number;
  payment_method: string;
  status: string;
  notes?: string | null;
  details?: ExpenseDetailLine[];
}

export interface ExpensesListResponse {
  expenses: Expense[];
  summary: {
    total_expenses: number;
    total_expense_amount: number;
    total_approved_amount: number;
    pending_count: number;
  };
  categories: string[];
  locations: string[];
  statuses: string[];
  payment_methods: string[];
}

export type ExpensePayload = {
  location?: string;
  expense_date?: string;
  reference_no: string;
  category: string;
  description: string;
  amount: number;
  discount?: number;
  payment_method?: string;
  status?: string;
  notes?: string | null;
};

export async function getExpenses(
  location?: string,
  dateFrom?: string,
  dateTo?: string,
  category?: string,
  status?: string,
  paymentMethod?: string
): Promise<ExpensesListResponse> {
  const params: Record<string, string> = {};
  if (location && location !== "all") params.location = location;
  if (dateFrom) params.date_from = dateFrom;
  if (dateTo) params.date_to = dateTo;
  if (category && category !== "all") params.category = category;
  if (status && status !== "all") params.status = status;
  if (paymentMethod && paymentMethod !== "all") params.payment_method = paymentMethod;

  const res = await axios.get("/api/expenses", { params });
  return {
    expenses: res.data.data,
    summary: res.data.summary ?? {
      total_expenses: 0,
      total_expense_amount: 0,
      total_approved_amount: 0,
      pending_count: 0,
    },
    categories: res.data.filters?.categories ?? [],
    locations: res.data.filters?.locations ?? ["Main Location"],
    statuses: res.data.filters?.statuses ?? ["Approved", "Pending", "Rejected"],
    payment_methods: res.data.filters?.payment_methods ?? ["Cash"],
  };
}

export async function getExpense(id: number): Promise<Expense> {
  const res = await axios.get(`/api/expenses/${id}`);
  return res.data.data;
}

export async function getNextExpenseReferenceNo(): Promise<string> {
  const res = await axios.get("/api/expenses/next-reference-no");
  return res.data.data.reference_no;
}

export async function createExpense(payload: ExpensePayload): Promise<Expense> {
  const res = await axios.post("/api/expenses", payload);
  return res.data.data;
}

export async function updateExpense(
  id: number,
  payload: Partial<ExpensePayload>
): Promise<Expense> {
  const res = await axios.put(`/api/expenses/${id}`, payload);
  return res.data.data;
}

export async function deleteExpense(id: number): Promise<void> {
  await axios.delete(`/api/expenses/${id}`);
}
