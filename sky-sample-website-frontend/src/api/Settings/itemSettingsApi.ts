import axios from "axios";

export interface ItemSettings {
  id: number;
  allow_auto_number: boolean;
  allow_item_discount: boolean;
  allow_wholesale_price: boolean;
  allow_upload_item_image: boolean;
  allow_variant_in_add_item: boolean;
  allow_quick_add_item_in_sales_screen: boolean;
  allow_favorite_items_on_sales_screen: boolean;
  allow_editing_purchase_price_in_inventory_dashboard: boolean;
  allow_total_price_entry_on_sales_screen: boolean;
  uom_options?: string[];
}

export type ItemSettingsPayload = Partial<Omit<ItemSettings, "id">>;

export async function getItemSettings(): Promise<ItemSettings> {
  const res = await axios.get("/api/settings/item");
  return res.data.data;
}

export async function updateItemSettings(
  payload: ItemSettingsPayload
): Promise<ItemSettings> {
  const res = await axios.put("/api/settings/item", payload);
  return res.data.data;
}
