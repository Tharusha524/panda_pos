import type { PaymentPayload } from "../../../api/paymentsApi";
import { DEFAULT_PAYMENT_TYPE } from "./paymentConstants";

export const PAYMENTS_BASE = "/payments";

export function emptyPaymentForm(): PaymentPayload {
  return {
    payment_type: DEFAULT_PAYMENT_TYPE,
    location: "Main Location",
    payment_date: new Date().toISOString().slice(0, 10),
    sales_no: "",
    receipt_type: "Sale",
    payment_method: "Cash",
    discount: 0,
    paid_amount: 0,
    notes: "",
  };
}

export function formatPaymentRs(amount: number): string {
  return `Rs ${amount.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
