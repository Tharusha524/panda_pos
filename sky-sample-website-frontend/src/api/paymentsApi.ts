import axios from "axios";

export interface PaymentDetailLine {
  item_number?: string | null;
  description?: string | null;
  qty: number;
  unit_price: number;
  discount: number;
  net_price: number;
  amount: number;
}

export interface Payment {
  id: number;
  source_type?: string | null;
  source_id?: number | null;
  payment_type: string;
  location: string;
  payment_date: string;
  payment_datetime?: string;
  sales_no: string;
  receipt_type: string;
  payment_method: string;
  discount: number;
  paid_amount: number;
  notes?: string | null;
  direction?: string;
  source_label?: string;
  details?: PaymentDetailLine[];
}

export interface PaymentsListResponse {
  payments: Payment[];
  summary: {
    total_payment_amount: number;
    total_received?: number;
    total_paid_out?: number;
    payment_count?: number;
  };
  payment_types: string[];
  payment_methods: string[];
  receipt_types: string[];
  locations: string[];
}

export type PaymentPayload = {
  payment_type?: string;
  location?: string;
  payment_date?: string;
  sales_no: string;
  receipt_type?: string;
  payment_method?: string;
  discount?: number;
  paid_amount?: number;
  notes?: string | null;
};

export async function getPayments(
  paymentMethod?: string,
  paymentType?: string,
  location?: string,
  dateFrom?: string,
  dateTo?: string
): Promise<PaymentsListResponse> {
  const res = await axios.get("/api/payments", {
    params: {
      ...(paymentMethod && paymentMethod !== "all" ? { payment_method: paymentMethod } : {}),
      ...(paymentType && paymentType !== "all" ? { payment_type: paymentType } : {}),
      ...(location && location !== "all" ? { location } : {}),
      ...(dateFrom ? { date_from: dateFrom } : {}),
      ...(dateTo ? { date_to: dateTo } : {}),
    },
  });
  return {
    payments: res.data.data,
    summary: res.data.summary ?? {
      total_payment_amount: 0,
      total_received: 0,
      total_paid_out: 0,
      payment_count: 0,
    },
    payment_types: res.data.filters?.payment_types ?? ["1008"],
    payment_methods: res.data.filters?.payment_methods ?? ["Cash"],
    receipt_types: res.data.filters?.receipt_types ?? ["Sale"],
    locations: res.data.filters?.locations ?? ["Main Location"],
  };
}

export async function getPayment(id: number): Promise<Payment> {
  const res = await axios.get(`/api/payments/${id}`);
  return res.data.data;
}

export async function getNextSalesNo(): Promise<string> {
  const res = await axios.get("/api/payments/next-sales-no");
  return res.data.data.sales_no;
}

export async function createPayment(payload: PaymentPayload): Promise<Payment> {
  const res = await axios.post("/api/payments", payload);
  return res.data.data;
}

export async function updatePayment(
  id: number,
  payload: Partial<PaymentPayload>
): Promise<Payment> {
  const res = await axios.put(`/api/payments/${id}`, payload);
  return res.data.data;
}

export async function deletePayment(id: number): Promise<void> {
  await axios.delete(`/api/payments/${id}`);
}
