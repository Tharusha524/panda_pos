export const NET_TERMS_OPTIONS = [
  "Cash",
  "7 Days",
  "15 Days",
  "30 Days",
  "45 Days",
  "60 Days",
  "90 Days",
];

export const PURCHASE_TYPE_PURCHASE = "1001";

export const PURCHASE_TYPE_RETURN = "1002";

export const PURCHASE_TYPE_ORDER = "1003";

export const DEFAULT_PURCHASE_TYPE = PURCHASE_TYPE_PURCHASE;

const PURCHASE_TYPE_LABELS: Record<string, string> = {
  "1001": "Purchase",
  "1002": "Return",
  "1003": "Purchase Order",
};

export function purchaseTypeLabel(code: string): string {
  return PURCHASE_TYPE_LABELS[code] ?? code;
}

export function isReturnPurchase(purchaseType?: string | null): boolean {
  return String(purchaseType ?? "").trim() === PURCHASE_TYPE_RETURN;
}

export function canReturnPurchase(purchase: {
  purchase_type?: string;
  has_return?: boolean;
  remaining_return_items?: { qty: number }[];
}): boolean {
  if (isReturnPurchase(purchase.purchase_type) || purchase.has_return === true) {
    return false;
  }
  if (purchase.remaining_return_items) {
    return purchase.remaining_return_items.some((line) => Number(line.qty) > 0);
  }
  return true;
}

export function purchaseReturnStatusLabel(purchase: {
  has_return?: boolean;
  has_partial_return?: boolean;
}): string | null {
  if (purchase.has_return) return "Returned";
  if (purchase.has_partial_return) return "Partial return";
  return null;
}

export const WALK_IN_SUPPLIER_LABEL = "Walk-in supplier";
