export const DEFAULT_TRANSACTION_TYPE = "1001";

export const TRANSACTION_TYPE_RETURN = "1002";

export function isReturnTransaction(transactionType?: string | number | null): boolean {
  return String(transactionType ?? "").trim() === TRANSACTION_TYPE_RETURN;
}

export const SALES_TYPES = ["Retail", "Wholesale", "Credit Sale", "Cash Sale"];

const TRANSACTION_LABELS: Record<string, string> = {
  "1001": "Sale",
  "1002": "Return",
  "1003": "Quotation",
};

export function transactionTypeLabel(code: string): string {
  return TRANSACTION_LABELS[code] ?? code;
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  completed: "Completed",
  hold: "Hold",
  quotation: "Quotation",
};

export function orderStatusLabel(status?: string): string {
  if (!status) return "Completed";
  return ORDER_STATUS_LABELS[status] ?? status;
}

export function saleDashboardStatusLabel(sale: {
  order_status?: string;
  transaction_type?: string;
}): string {
  if (isReturnTransaction(sale.transaction_type)) {
    return "Return";
  }
  return orderStatusLabel(sale.order_status);
}

export function canReturnSale(sale: {
  order_status?: string;
  transaction_type?: string;
  has_return?: boolean;
  remaining_return_items?: { qty: number }[];
}): boolean {
  const status = sale.order_status ?? "completed";
  if (status !== "completed" || isReturnTransaction(sale.transaction_type) || sale.has_return === true) {
    return false;
  }
  if (sale.remaining_return_items) {
    return sale.remaining_return_items.some((line) => Number(line.qty) > 0);
  }
  return true;
}

export function saleReturnStatusLabel(sale: {
  has_return?: boolean;
  has_partial_return?: boolean;
}): string | null {
  if (sale.has_return) return "Returned";
  if (sale.has_partial_return) return "Partial return";
  return null;
}
