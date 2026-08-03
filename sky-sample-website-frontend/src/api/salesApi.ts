import axios from "axios";
import type { OrderSettings } from "./Settings/orderSettingsApi";
import type { PosTaxSettings } from "./Settings/taxSettingsApi";
import type { HardwareSettings } from "./Settings/hardwareSettingsApi";
import type { CompanyPrintHeader } from "./Settings/companySettingsApi";

export type OrderStatus = "completed" | "hold" | "quotation";
export type PricingMode = "retail" | "wholesale";

/** Order settings returned by sales/POS APIs (PIN is not included). */
export type PosOrderSettings = Omit<OrderSettings, "hold_order_pin"> & {
  requires_hold_pin: boolean;
};

export interface SaleLineItem {
  id?: number;
  item_id: number | null;
  item_number: string | null;
  description: string;
  qty: number;
  unit_price: number;
  line_total: number;
  imei_serial?: string | null;
  batch_id?: string | null;
  item_batch_id?: number | null;
  secondary_uom?: string | null;
  secondary_uom_qty?: number | null;
  additional_details?: string | null;
  purchase_price?: number | null;
  sold_qty?: number;
  returned_qty?: number;
}

export interface SaleReturnQtySummary {
  sold_qty: number;
  returned_qty: number;
  remaining_qty: number;
  lines?: {
    item_number?: string | null;
    description: string;
    sold_qty: number;
    returned_qty: number;
    remaining_qty: number;
  }[];
}

export interface Sale {
  id: number;
  transaction_type: string;
  order_status?: OrderStatus;
  sales_type: string;
  pricing_mode?: PricingMode;
  location: string;
  sale_date: string;
  sale_datetime?: string;
  sales_id: string;
  customer_id: number | null;
  customer_name: string | null;
  returned_from_sale_id?: number | null;
  has_return?: boolean;
  has_partial_return?: boolean;
  return_status?: "none" | "partial" | "full";
  remaining_return_items?: SaleLineItem[];
  return_qty_summary?: SaleReturnQtySummary;
  sub_total: number;
  discount: number;
  vat_amount?: number;
  vat_rate_id?: number | null;
  service_charge?: number;
  card_payment_charge?: number;
  net_amount: number;
  offer_applied?: boolean;
  offer_id?: number | null;
  offer_promo_code?: string | null;
  offer_name?: string | null;
  payment_method: string;
  amount_received?: number | null;
  bank_id?: number | null;
  cheque_number?: string | null;
  refund_card_last4?: string | null;
  notes?: string | null;
  items?: SaleLineItem[];
  order_settings?: PosOrderSettings;
}

export interface SalesListResponse {
  sales: Sale[];
  returned_sale_ids?: number[];
  summary: {
    total_orders: number;
    total_sales_amount: number;
    total_returns_amount?: number;
    net_sales_amount?: number;
    hold_orders_count?: number;
  };
  transaction_types: string[];
  sales_types: string[];
  locations: string[];
  payment_methods: string[];
  order_settings?: PosOrderSettings;
}

export interface SalesPosApplicableOffer {
  id: number;
  name: string;
  discount_type: string;
  pricing_mode?: "retail" | "wholesale" | "both";
  pricing_mode_label?: string;
  image_url?: string | null;
  item_count: number;
  product_count?: number;
  item_ids: number[];
  item_numbers?: string[];
  item_batch_ids?: number[];
  batch_count?: number;
  restricts_batches?: boolean;
  selection_count?: number;
  selection_unit?: "order" | "product" | "batch";
  product_percent_off?: number | null;
  discount_summary?: string | null;
  requires_promo_code?: boolean;
  uses_min_order_total?: boolean;
  min_order_amount?: number;
  min_percent_off?: number;
  promo_percent_off?: number;
}

export interface SalesPosContext {
  order_settings: PosOrderSettings;
  hardware_settings: HardwareSettings;
  print_context: {
    hardware_settings: HardwareSettings;
    company_header: CompanyPrintHeader;
    resolved_header: CompanyPrintHeader & { source?: string };
  };
  next_sales_id: string;
  filters: {
    transaction_types: string[];
    sales_types: string[];
    locations: string[];
    payment_methods: string[];
  };
  applicable_offers?: SalesPosApplicableOffer[];
  tax_settings?: PosTaxSettings;
}

export interface SaleReceiptLine {
  item_number?: string | null;
  description: string;
  qty: number;
  unit_price: number;
  line_total: number;
  uom?: string | null;
}

export interface SaleReceiptLabels {
  receipt_title: string;
  sales_id: string;
  date: string;
  location: string;
  customer: string;
  item_no: string;
  description: string;
  qty: string;
  uom: string;
  unit_price: string;
  total: string;
  sub_total: string;
  discount: string;
  service_charge: string;
  card_charge: string;
  net_amount: string;
  payment: string;
  received: string;
  change: string;
  thank_you: string;
}

export interface SaleReceiptApiPayload {
  sale: {
    sales_id: string;
    sale_date: string;
    location: string;
    payment_method: string;
    customer_name?: string | null;
    sub_total: number;
    discount: number;
    service_charge?: number;
    card_payment_charge?: number;
    net_amount: number;
    amount_received?: number | null;
    cheque_number?: string | null;
    lines: SaleReceiptLine[];
    show_barcode?: boolean;
    barcode_value?: string | null;
    discount_label?: string | null;
  };
  header: CompanyPrintHeader & { source?: string };
  hardware_settings: HardwareSettings;
  print_options: {
    printing_paper_size: string;
    sales_receipt_printout_style: string;
    letterhead_top_margin_cm: string;
    allow_auto_print: boolean;
    allow_dual_language_print: boolean;
    logo_url: string | null;
    allow_logo_on_sales_receipt: boolean;
  };
  labels: SaleReceiptLabels;
}

export interface PosItemSearchResult {
  items: Array<Record<string, unknown>>;
  parsed_qty: number | null;
  search_style: string;
  order_settings: PosOrderSettings;
}

export type SalePayload = {
  transaction_type?: string;
  order_status?: OrderStatus;
  sales_type?: string;
  pricing_mode?: PricingMode;
  location?: string;
  sale_date?: string;
  sales_id: string;
  customer_id?: number | null;
  customer_name?: string | null;
  returned_from_sale_id?: number | null;
  sub_total?: number;
  discount?: number;
  vat_amount?: number;
  vat_rate_id?: number | null;
  service_charge?: number;
  net_amount?: number;
  offer_applied?: boolean;
  offer_id?: number | null;
  offer_promo_code?: string | null;
  promo_code?: string | null;
  payment_method?: string;
  amount_received?: number | null;
  bank_id?: number | null;
  cheque_number?: string | null;
  refund_card_last4?: string | null;
  hold_pin?: string;
  notes?: string | null;
  items?: SaleLineItem[];
};

export async function getSales(
  transactionType?: string,
  location?: string,
  dateFrom?: string,
  dateTo?: string,
  orderStatus?: OrderStatus | "all",
  customerId?: number | null
): Promise<SalesListResponse> {
  const res = await axios.get("/api/sales", {
    params: {
      ...(transactionType && transactionType !== "all"
        ? { transaction_type: transactionType }
        : {}),
      ...(location && location !== "all" ? { location } : {}),
      ...(orderStatus && orderStatus !== "all" ? { order_status: orderStatus } : {}),
      ...(dateFrom ? { date_from: dateFrom } : {}),
      ...(dateTo ? { date_to: dateTo } : {}),
      ...(customerId ? { customer_id: customerId } : {}),
    },
  });
  return {
    sales: res.data.data,
    returned_sale_ids: res.data.returned_sale_ids ?? [],
    summary: res.data.summary ?? {
      total_orders: 0,
      total_sales_amount: 0,
      total_returns_amount: 0,
      net_sales_amount: 0,
      hold_orders_count: 0,
    },
    transaction_types: res.data.filters?.transaction_types ?? ["1001"],
    sales_types: res.data.filters?.sales_types ?? ["Retail"],
    locations: res.data.filters?.locations ?? ["Main Location"],
    payment_methods: res.data.filters?.payment_methods ?? ["Cash"],
    order_settings: res.data.order_settings,
  };
}

export async function getSalesPosContext(): Promise<SalesPosContext> {
  const res = await axios.get("/api/sales/pos-context");
  return res.data.data;
}

export async function getHoldOrders(location?: string): Promise<{
  hold_orders: Sale[];
  order_settings: PosOrderSettings;
}> {
  const res = await axios.get("/api/sales/hold-orders", {
    params: location && location !== "all" ? { location } : {},
  });
  return res.data.data;
}

export async function completeHoldOrder(
  id: number,
  payload?: Partial<SalePayload>
): Promise<{ sale: Sale; receipt?: SaleReceiptApiPayload }> {
  const res = await axios.post(`/api/sales/${id}/complete-hold`, payload ?? {});
  return { sale: res.data.data, receipt: res.data.receipt };
}

export async function verifyRefundCard(cardLast4: string): Promise<void> {
  await axios.post("/api/sales/verify-refund-card", { card_last4: cardLast4 });
}

export async function searchPosItems(
  q: string,
  location?: string
): Promise<PosItemSearchResult> {
  const res = await axios.get("/api/items/pos-search", {
    params: { q, ...(location ? { location } : {}) },
  });
  return res.data.data;
}

export async function getSale(id: number): Promise<Sale> {
  const res = await axios.get(`/api/sales/${id}`);
  return res.data.data;
}

export async function getNextSalesId(): Promise<string> {
  const res = await axios.get("/api/sales/next-sales-id");
  return res.data.data.sales_id;
}

export async function createSale(
  payload: SalePayload
): Promise<{ sale: Sale; receipt?: SaleReceiptApiPayload }> {
  const res = await axios.post("/api/sales", payload);
  return { sale: res.data.data, receipt: res.data.receipt };
}

export async function getSaleReceipt(
  id: number,
  language?: string
): Promise<SaleReceiptApiPayload> {
  const res = await axios.get(`/api/sales/${id}/receipt`, {
    params: language ? { language } : {},
  });
  return res.data.data;
}

export async function updateSale(id: number, payload: Partial<SalePayload>): Promise<Sale> {
  const res = await axios.put(`/api/sales/${id}`, payload);
  return res.data.data;
}

export async function deleteSale(id: number, holdPin?: string): Promise<void> {
  await axios.delete(`/api/sales/${id}`, {
    data: holdPin ? { hold_pin: holdPin } : undefined,
  });
}
