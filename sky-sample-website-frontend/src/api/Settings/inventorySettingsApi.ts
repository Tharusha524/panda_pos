import axios from "axios";

export type CostingMethod = "FIFO" | "LIFO";

export interface InventorySettings {
  id: number;
  manage_multiple_locations: boolean;
  costing_method: CostingMethod;
  allow_tog: boolean;
  allow_request_for_quotation: boolean;
  allow_inventory_location_filter: boolean;
}

export type InventorySettingsPayload = Partial<Omit<InventorySettings, "id">>;

export async function getInventorySettings(): Promise<InventorySettings> {
  const res = await axios.get("/api/settings/inventory");
  return res.data.data;
}

export async function updateInventorySettings(
  payload: InventorySettingsPayload
): Promise<InventorySettings> {
  const res = await axios.put("/api/settings/inventory", payload);
  return res.data.data;
}
