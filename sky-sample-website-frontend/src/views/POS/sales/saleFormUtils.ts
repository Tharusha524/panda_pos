import type { SalePayload } from "../../../api/salesApi";
import { DEFAULT_TRANSACTION_TYPE } from "./saleConstants";

export const SALES_BASE = "/sales";

export function localDateInputValue(date = new Date()): string {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export function emptySaleForm(): SalePayload {
  return {
    transaction_type: DEFAULT_TRANSACTION_TYPE,
    sales_type: "Retail",
    location: "Main Location",
    sale_date: localDateInputValue(),
    sales_id: "",
    customer_id: null,
    customer_name: "",
    sub_total: 0,
    discount: 0,
    service_charge: 0,
    net_amount: 0,
    offer_id: null,
    offer_promo_code: null,
    payment_method: "Cash",
    notes: "",
  };
}

export function formatSaleRs(amount: number): string {
  return `Rs ${amount.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
