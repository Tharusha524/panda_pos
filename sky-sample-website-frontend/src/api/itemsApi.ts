import axios from "axios";
import type { ItemSettings } from "./Settings/itemSettingsApi";

export type DiscountType = "percent" | "amount";

export type ExpiryStatus = "none" | "ok" | "expiring_soon" | "expired";

export type ItemSettingsSnapshot = Omit<ItemSettings, "id">;

export interface Item {
  id: number;
  item_number: string;
  image_path?: string | null;
  image_url?: string | null;
  auto_generate_item_number?: boolean;
  description: string;
  category: string | null;
  sub_category: string | null;
  item_category_id?: number | null;
  item_sub_category_id?: number | null;
  vat_rate_id?: number | null;
  product_type: string | null;
  location: string;
  selling_price: number;
  wholesale_price?: number;
  purchase_price?: number;
  default_discount?: number;
  default_discount_type?: DiscountType;
  max_discount?: number;
  has_multiple_options?: boolean;
  item_details?: string | null;
  track_with_inventory?: boolean;
  qty?: number;
  /** Qty available to sell (excludes expired batch stock until written off). */
  sellable_qty?: number;
  /** Qty in expired batches still on hand — write off to remove. */
  expired_stock_qty?: number;
  reorder_qty?: number;
  uom?: string;
  expiry_date?: string | null;
  nearest_expiry_date?: string | null;
  /** Main (unbatched) stock expiry when unbatched qty > 0. */
  main_expiry_date?: string | null;
  /** Nearest in-stock batch expiry (FEFO). */
  nearest_batch_expiry_date?: string | null;
  /** Qty in batches at nearest_batch_expiry_date. */
  nearest_batch_expiry_qty?: number;
  unbatched_qty?: number;
  expiry_status?: ExpiryStatus;
  expiry_days_remaining?: number | null;
  /** True when a batch with past expiry still has stock on hand. */
  has_expired_stock?: boolean;
  item_code?: string | null;
  supplier_item_code?: string | null;
  sku?: string | null;
  is_favourite?: boolean;
  is_active: boolean;
  status: string;
  margin_percent?: number;
  markup_percent?: number;
  profit?: number;
  bid?: number;
  last_purchase_price?: number;
  costing_method?: CostingMethod;
  unit_cost?: number;
  inventory_value?: number;
  /** Qty sold beyond on-hand stock (when qty is negative in DB). */
  oversold_qty?: number;
  has_batches?: boolean;
  batch_count?: number;
}

export type CostingMethod = "FIFO" | "LIFO";

export interface InventorySettingsSnapshot {
  manage_multiple_locations: boolean;
  costing_method: CostingMethod;
  allow_tog: boolean;
  allow_request_for_quotation: boolean;
  allow_inventory_location_filter: boolean;
}

export interface ItemSubCategoryRef {
  id: number;
  name: string;
}

export interface ItemCategory {
  id: number;
  name: string;
  product_type?: string | null;
  sub_categories: ItemSubCategoryRef[];
}

export interface ItemSubCategoryCreated {
  id: number;
  name: string;
  item_category_id: number;
  parent_category_name?: string;
}

export interface ItemsSummary {
  total_items: number;
  total_inventory_value: number;
  low_stock_count: number;
  oversold_count?: number;
  active_items: number;
  expired_count?: number;
  expiring_soon_count?: number;
}

export interface ItemsAlertSettingsSnapshot {
  id: number;
  expiry_alert_period_days: number;
  cheque_alert_period_days: number;
}

export interface ItemsListResponse {
  items: Item[];
  summary?: ItemsSummary;
  product_types: string[];
  locations: string[];
  inventory_settings?: InventorySettingsSnapshot;
  item_settings?: ItemSettingsSnapshot;
  alert_settings?: ItemsAlertSettingsSnapshot;
}

export type ItemPayload = Omit<
  Item,
  "id" | "status" | "margin_percent" | "markup_percent" | "profit" | "bid" | "last_purchase_price"
>;

export async function getItems(
  productType?: string,
  location?: string,
  options?: { forPosSale?: boolean }
): Promise<ItemsListResponse> {
  const res = await axios.get("/api/items", {
    params: {
      ...(productType && productType !== "all" ? { product_type: productType } : {}),
      ...(location && location !== "all" ? { location } : {}),
      ...(options?.forPosSale ? { for_pos_sale: true } : {}),
    },
  });
  return {
    items: res.data.data,
    summary: res.data.summary ?? undefined,
    product_types: res.data.filters?.product_types ?? [],
    locations: res.data.filters?.locations ?? ["Main Location"],
    inventory_settings: res.data.inventory_settings,
    item_settings: res.data.item_settings,
    alert_settings: res.data.alert_settings ?? undefined,
  };
}

export async function updateItemPurchasePrice(
  id: number,
  purchasePrice: number
): Promise<Item> {
  const res = await axios.patch(`/api/items/${id}/purchase-price`, {
    purchase_price: purchasePrice,
  });
  return res.data.data;
}

export async function uploadItemImage(id: number, file: File): Promise<Item> {
  const formData = new FormData();
  formData.append("image", file);
  const res = await axios.post(`/api/items/${id}/image`, formData);
  return res.data.data;
}

export async function getItem(id: number): Promise<Item> {
  const res = await axios.get(`/api/items/${id}`);
  return res.data.data;
}

export async function getNextItemNumber(): Promise<string> {
  const res = await axios.get("/api/items/next-number");
  return res.data.data.item_number;
}

export async function createItem(payload: ItemPayload): Promise<Item> {
  const res = await axios.post("/api/items", payload);
  return res.data.data;
}

export async function updateItem(id: number, payload: Partial<ItemPayload>): Promise<Item> {
  const res = await axios.put(`/api/items/${id}`, payload);
  return res.data.data;
}

export async function deleteItem(id: number): Promise<void> {
  await axios.delete(`/api/items/${id}`);
}

export async function getItemCategories(): Promise<ItemCategory[]> {
  const res = await axios.get("/api/items/categories");
  return res.data.data;
}

export async function getItemCategoriesByLocation(location?: string): Promise<ItemCategory[]> {
  const res = await axios.get("/api/items/categories", {
    params: {
      ...(location && location !== "all" ? { location } : {}),
    },
  });
  return res.data.data;
}

export async function createItemCategory(
  name: string,
  productType?: string
): Promise<ItemCategory> {
  const res = await axios.post("/api/items/categories", {
    name,
    product_type: productType,
  });
  return res.data.data;
}

export async function createItemSubCategory(
  name: string,
  parentCategoryId: number
): Promise<ItemSubCategoryCreated> {
  const res = await axios.post("/api/items/subcategories", {
    name,
    parent_category_id: parentCategoryId,
  });
  return res.data.data;
}

export async function updateItemCategory(
  id: number,
  payload: { name: string; product_type?: string | null }
): Promise<ItemCategory> {
  const res = await axios.put(`/api/items/categories/${id}`, payload);
  return res.data.data;
}

export async function deleteItemCategory(id: number): Promise<void> {
  await axios.delete(`/api/items/categories/${id}`);
}

export async function updateItemSubCategory(
  id: number,
  payload: { name: string; parent_category_id: number }
): Promise<ItemSubCategoryCreated> {
  const res = await axios.put(`/api/items/subcategories/${id}`, payload);
  return res.data.data;
}

export async function deleteItemSubCategory(id: number): Promise<void> {
  await axios.delete(`/api/items/subcategories/${id}`);
}

export interface InventoryHistoryRow {
  source: string;
  movement_type: string;
  reference_label?: string | null;
  reference_id?: number | null;
  location?: string | null;
  qty_before?: number;
  qty_change: number;
  qty_after?: number;
  unit_cost?: number;
  notes?: string | null;
  created_at?: string | null;
}

export interface ItemCostView {
  item: Item;
  costing: {
    costing_method: string;
    bid: number;
    unit_cost: number;
    last_purchase_price: number;
    purchase_price: number;
    selling_price: number;
    qty_on_hand: number;
    inventory_value: number;
    margin_percent: number;
    markup_percent: number;
    profit_per_unit: number;
  };
}

export interface ItemBatch {
  id: number;
  batch_number: string;
  location: string | null;
  qty: number;
  purchase_price: number;
  selling_price?: number | null;
  expiry_date: string | null;
  notes: string | null;
  created_at: string | null;
  item_id?: number;
}

export interface ItemInventoryVariantRow {
  id: number;
  location: string | null;
  qty: number;
  batch_qty: number;
  unbatched_qty: number;
  purchase_price: number;
  selling_price: number;
  expiry_date: string | null;
  nearest_expiry_date: string | null;
  is_current: boolean;
}

export interface ItemInventoryBreakdown {
  item: Item;
  totals: {
    total_qty: number;
    total_batch_qty: number;
    total_unbatched_qty: number;
    variant_count: number;
    batch_count: number;
  };
  variants: ItemInventoryVariantRow[];
  batches: ItemBatch[];
}

export interface ItemAdditionalChargeRow {
  id?: number;
  name: string;
  amount: number;
  charge_type: "fixed" | "percent";
  is_active: boolean;
}

export async function getItemHistory(id: number): Promise<{ item: Item; history: InventoryHistoryRow[] }> {
  const res = await axios.get(`/api/items/${id}/history`);
  return res.data.data;
}

export async function getItemCostView(id: number): Promise<ItemCostView> {
  const res = await axios.get(`/api/items/${id}/cost-view`);
  return res.data.data;
}

export async function adjustItemInventory(
  id: number,
  payload: { new_qty?: number; qty_change?: number; notes?: string }
): Promise<Item> {
  const res = await axios.post(`/api/items/${id}/adjust`, payload);
  return res.data.data;
}

export interface WriteOffBatchLine {
  item_batch_id: number;
  qty: number;
}

export async function writeOffItemInventory(
  id: number,
  payload: { qty?: number; main_qty?: number; notes?: string; batches?: WriteOffBatchLine[] }
): Promise<Item> {
  const res = await axios.post(`/api/items/${id}/write-off`, payload);
  return res.data.data;
}

export async function getItemBatches(id: number): Promise<{ item: Item; batches: ItemBatch[] }> {
  const res = await axios.get(`/api/items/${id}/batches`);
  return res.data.data;
}

export async function getItemInventoryBreakdown(id: number): Promise<ItemInventoryBreakdown> {
  const res = await axios.get(`/api/items/${id}/inventory-breakdown`);
  return res.data.data;
}

export async function createItemBatch(
  id: number,
  payload: Partial<ItemBatch>
): Promise<{ batch: ItemBatch; item: Item; merged?: boolean; message?: string }> {
  const res = await axios.post(`/api/items/${id}/batches`, payload);
  return {
    ...res.data.data,
    message: res.data.message,
  };
}

export async function updateItemBatch(
  itemId: number,
  batchId: number,
  payload: Partial<ItemBatch>
): Promise<{ batch: ItemBatch; item: Item }> {
  const res = await axios.put(`/api/items/${itemId}/batches/${batchId}`, payload);
  return res.data.data;
}

export async function deleteItemBatch(
  itemId: number,
  batchId: number
): Promise<{ item: Item }> {
  const res = await axios.delete(`/api/items/${itemId}/batches/${batchId}`);
  return res.data.data;
}

export async function getItemAdditionalCharges(
  id: number
): Promise<{ item_id: number; charges: ItemAdditionalChargeRow[] }> {
  const res = await axios.get(`/api/items/${id}/additional-charges`);
  return res.data.data;
}

export async function saveItemAdditionalCharges(
  id: number,
  charges: ItemAdditionalChargeRow[]
): Promise<{ item_id: number; charges: ItemAdditionalChargeRow[] }> {
  const res = await axios.put(`/api/items/${id}/additional-charges`, { charges });
  return res.data.data;
}
