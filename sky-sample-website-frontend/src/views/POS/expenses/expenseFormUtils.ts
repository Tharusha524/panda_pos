import type { ExpensePayload } from "../../../api/expensesApi";

export const EXPENSES_BASE = "/expenses";

export function emptyExpenseForm(): ExpensePayload {
  return {
    location: "Main Location",
    expense_date: new Date().toISOString().slice(0, 10),
    reference_no: "",
    category: "Other",
    description: "",
    amount: 0,
    discount: 0,
    payment_method: "Cash",
    status: "Approved",
    notes: "",
  };
}

export function formatExpenseRs(amount: number): string {
  return `Rs ${amount.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
