import type { Customer } from "../../../api/customersApi";
import { customerDisplayName } from "./PosCustomerSelectArea";

export const POS_SELECTED_CUSTOMER_KEY = "posSelectedCustomer";

export interface PosSelectedCustomerSnapshot {
  id: number | null;
  name: string;
}

export function savePosSelectedCustomer(customer: Customer | null): void {
  if (customer == null) {
    sessionStorage.setItem(
      POS_SELECTED_CUSTOMER_KEY,
      JSON.stringify({ id: null, name: "" } satisfies PosSelectedCustomerSnapshot)
    );
    return;
  }
  sessionStorage.setItem(
    POS_SELECTED_CUSTOMER_KEY,
    JSON.stringify({
      id: customer.id,
      name: customerDisplayName(customer),
    } satisfies PosSelectedCustomerSnapshot)
  );
}

export function readPosSelectedCustomer(): PosSelectedCustomerSnapshot | null {
  try {
    const raw = sessionStorage.getItem(POS_SELECTED_CUSTOMER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PosSelectedCustomerSnapshot;
  } catch {
    return null;
  }
}

export function buildPosSaleUrl(customerId?: number | null): string {
  if (customerId != null) {
    return `/sales/new?customerId=${customerId}`;
  }
  return "/sales/new";
}
