import axios from "axios";

export interface SubscriptionStatus {
  can_access: boolean;
  is_overdue: boolean;
  next_payment_date: string;
  message: string;
}

export interface BillingHistoryRow {
  id: number;
  date: string;
  card_type: string | null;
  card_number: string;
  amount: number;
  amount_display: string;
}

export interface SubscriptionDetails extends SubscriptionStatus {
  cloud_id: number;
  license_count: number;
  product_name: string;
  period_start: string;
  period_end: string;
  period_start_display: string;
  period_end_display: string;
  monthly_charge: number;
  next_payment_date_display: string;
  billing_history: BillingHistoryRow[];
}

export interface OnlinePaymentPayload {
  amount?: number;
  card_type?: string;
  card_number: string;
}

export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  const res = await axios.get("/api/subscription/status");
  return res.data.data;
}

export async function getSubscriptionDetails(): Promise<SubscriptionDetails> {
  const res = await axios.get("/api/subscription");
  return res.data.data;
}

export async function paySubscriptionOnline(
  payload: OnlinePaymentPayload
): Promise<SubscriptionDetails> {
  const res = await axios.post("/api/subscription/pay", payload);
  return res.data.data;
}
