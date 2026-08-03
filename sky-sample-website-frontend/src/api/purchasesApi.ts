import axios from "axios";

export interface PurchaseLineItem {
  id?: number;
  item_id: number | null;
  item_number: string | null;
  description: string;
  qty: number;
  unit_price: number;
  line_total: number;
  expiry_date?: string | null;
  item_batch_id?: number | null;
  purchased_qty?: number;
  returned_qty?: number;
}

export interface PurchaseDetailLine {
  item_number?: string | null;
  description?: string;
  qty: number;
  unit_price: number;
  discount?: number;
  net_price?: number;
  amount: number;
}

export interface PurchaseReturnQtySummary {
  purchased_qty: number;
  returned_qty: number;
  remaining_qty: number;
  lines?: {
    item_number?: string | null;
    description: string;
    purchased_qty: number;
    returned_qty: number;
    remaining_qty: number;
  }[];
}

export interface Purchase {
  id: number;
  purchase_type: string;
  location: string;
  purchase_date: string;
  purchase_datetime?: string;
  invoice_id: string;
  supplier_id: number | null;
  supplier_name: string;
  returned_from_purchase_id?: number | null;
  has_return?: boolean;
  has_partial_return?: boolean;
  return_status?: "none" | "partial" | "full";
  remaining_return_items?: PurchaseLineItem[];
  return_qty_summary?: PurchaseReturnQtySummary;
  sub_total: number;
  discount: number;
  amount: number;
  payment_method?: string;
  bank_id?: number | null;
  cheque_number?: string | null;
  net_terms: string | null;
  notes?: string | null;
  items?: PurchaseLineItem[];
  details?: PurchaseDetailLine[];
}

export interface PurchasesListResponse {
  purchases: Purchase[];
  returned_purchase_ids?: number[];
  summary: {
    total_purchases: number;
    total_purchase_amount: number;
  };
  purchase_types: string[];
  locations: string[];
  payment_methods?: string[];
}

export type PurchasePayload = {
  purchase_type?: string;
  location?: string;
  purchase_date?: string;
  invoice_id: string;
  supplier_id?: number | null;
  supplier_name?: string;
  sub_total?: number;
  discount?: number;
  amount?: number;
  net_terms?: string | null;
  payment_method?: string;
  bank_id?: number | null;
  cheque_number?: string | null;
  notes?: string | null;
  returned_from_purchase_id?: number | null;
  items?: PurchaseLineItem[];
};

export async function getPurchases(
  purchaseType?: string,
  location?: string,
  dateFrom?: string,
  dateTo?: string
): Promise<PurchasesListResponse> {
  const res = await axios.get("/api/purchases", {
    params: {
      ...(purchaseType && purchaseType !== "all" ? { purchase_type: purchaseType } : {}),
      ...(location && location !== "all" ? { location } : {}),
      ...(dateFrom ? { date_from: dateFrom } : {}),
      ...(dateTo ? { date_to: dateTo } : {}),
    },
  });
  return {
    purchases: res.data.data,
    returned_purchase_ids: res.data.returned_purchase_ids ?? [],
    summary: res.data.summary ?? { total_purchases: 0, total_purchase_amount: 0 },
    purchase_types: res.data.filters?.purchase_types ?? ["1001"],
    locations: res.data.filters?.locations ?? ["Main Location"],
    payment_methods: res.data.payment_methods ?? ["Cash", "Card", "Cheque", "Bank Transfer", "Online"],
  };
}

export async function getPurchase(id: number): Promise<Purchase> {
  const res = await axios.get(`/api/purchases/${id}`);
  return res.data.data;
}

export async function getNextInvoiceId(): Promise<string> {
  const res = await axios.get("/api/purchases/next-invoice-id");
  return res.data.data.invoice_id;
}

export async function createPurchase(payload: PurchasePayload): Promise<Purchase> {
  const res = await axios.post("/api/purchases", payload);
  return res.data.data;
}

export async function updatePurchase(
  id: number,
  payload: Partial<PurchasePayload>
): Promise<Purchase> {
  const res = await axios.put(`/api/purchases/${id}`, payload);
  return res.data.data;
}

export async function deletePurchase(id: number): Promise<void> {
  await axios.delete(`/api/purchases/${id}`);
}
