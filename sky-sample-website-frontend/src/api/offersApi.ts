import axios from "axios";

export interface ProductDiscountRules {
  buy_x_percent_off_all: {
    enabled: boolean;
    buy_quantity: number;
    product_id: number | null;
    product_name: string;
    percent_off: number;
  };
  set_percent_selected: {
    enabled: boolean;
    percent_off: number;
    product_name: string;
  };
  bargain_bin: {
    enabled: boolean;
    price: number;
  };
  buy_x_fixed_off: {
    enabled: boolean;
    buy_quantity: number;
    product_id: number | null;
    product_name: string;
    amount_off: number;
  };
  buy_x_amount_off_each: {
    enabled: boolean;
    buy_quantity: number;
    product_id: number | null;
    product_name: string;
    amount_off_each: number;
  };
}

export interface OrderDiscountRules {
  order_min_total_percent: {
    enabled: boolean;
    min_order_amount: number;
    percent_off: number;
  };
  order_promo_code_percent: {
    enabled: boolean;
    percent_off: number;
    promo_code: string;
  };
}

export type DiscountRules = ProductDiscountRules & Partial<OrderDiscountRules>;

export interface OfferSelectedItem {
  id: number;
  item_number: string;
  description: string;
  category: string | null;
  sub_category: string | null;
  selling_price: number;
}

export interface OfferSelectedBatch {
  id: number;
  batch_number: string;
  location: string | null;
  qty: number;
  purchase_price: number;
  selling_price?: number | null;
  expiry_date: string | null;
  item_id: number;
  item_number?: string | null;
  description?: string | null;
}

export type OfferPricingMode = "retail" | "wholesale" | "both";

export interface ApplicableOffer {
  id: number;
  name: string;
  discount_type: string;
  pricing_mode?: OfferPricingMode;
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

export interface Offer {
  id: number;
  name: string;
  description: string | null;
  image_path?: string | null;
  image_url?: string | null;
  created_at?: string;
  created_at_display?: string;
  offer_items?: string;
  status?: string;
  discount_type_label?: string;
  days_of_week_enabled: boolean;
  days_of_week: string[];
  expiration_enabled: boolean;
  expiration_date: string | null;
  discount_type: string;
  pricing_mode?: OfferPricingMode;
  pricing_mode_label?: string;
  discount_rules: DiscountRules;
  is_active: boolean;
  item_ids?: number[];
  item_batch_ids?: number[];
  selected_items?: OfferSelectedItem[];
  selected_batches?: OfferSelectedBatch[];
  selection_count?: number;
  selection_unit?: "order" | "product" | "batch";
  product_count?: number;
  batch_count?: number;
}

export type OfferPayload = Omit<Offer, "id" | "selected_items" | "created_at" | "created_at_display" | "offer_items" | "status" | "discount_type_label" | "image_path" | "image_url">;

export interface OffersListResponse {
  offers: Offer[];
  summary: {
    total_offers: number;
    active_offers: number;
    product_offers: number;
    order_offers: number;
  };
  discount_types: string[];
  statuses: string[];
}

export async function getOffers(
  discountType?: string,
  status?: string
): Promise<OffersListResponse> {
  const params: Record<string, string> = {};
  if (discountType && discountType !== "all") params.discount_type = discountType;
  if (status && status !== "all") params.status = status;
  const res = await axios.get("/api/offers", { params });
  return {
    offers: res.data.data ?? [],
    summary: res.data.summary ?? {
      total_offers: 0,
      active_offers: 0,
      product_offers: 0,
      order_offers: 0,
    },
    discount_types: res.data.filters?.discount_types ?? ["product", "order"],
    statuses: res.data.filters?.statuses ?? ["Active", "Inactive"],
  };
}

export async function getOffer(id: number): Promise<Offer> {
  const res = await axios.get(`/api/offers/${id}`);
  return res.data.data;
}

export async function createOffer(payload: OfferPayload): Promise<Offer> {
  const res = await axios.post("/api/offers", payload);
  return res.data.data;
}

export async function updateOffer(id: number, payload: Partial<OfferPayload>): Promise<Offer> {
  const res = await axios.put(`/api/offers/${id}`, payload);
  return res.data.data;
}

export async function deleteOffer(id: number): Promise<void> {
  await axios.delete(`/api/offers/${id}`);
}

export async function getApplicableOffers(saleDate?: string): Promise<ApplicableOffer[]> {
  const res = await axios.get("/api/offers/applicable/list", {
    params: saleDate ? { sale_date: saleDate } : undefined,
  });
  return res.data.data;
}

export interface OfferPreviewLine {
  item_id?: number | null;
  item_number?: string | null;
  item_batch_id?: number | null;
  description?: string;
  qty: number;
  unit_price: number;
  line_total: number;
  offer_discount?: number;
}

export interface OfferPreviewResult {
  offer_discount: number;
  sub_total: number;
  lines?: OfferPreviewLine[];
}

export async function previewOfferDiscount(payload: {
  offer_id: number;
  sale_date?: string;
  promo_code?: string | null;
  pricing_mode?: "retail" | "wholesale";
  lines: Array<{
    item_id?: number | null;
    item_number?: string | null;
    item_batch_id?: number | null;
    description?: string;
    qty: number;
    unit_price: number;
  }>;
}): Promise<OfferPreviewResult> {
  const res = await axios.post("/api/offers/preview", payload);
  return res.data.data;
}
