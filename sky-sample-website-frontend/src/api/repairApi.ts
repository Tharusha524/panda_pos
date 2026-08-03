import axios from "axios";

export interface RepairItem {
  id: number;
  item_number: string;
  description: string;
  category: string | null;
  sub_category?: string | null;
  location: string;
  qty: number;
  purchase_price: number;
  last_purchase_price: number;
  selling_price: number;
  unit_cost?: number;
  inventory_value?: number;
  uom?: string;
  is_active: boolean;
}

export interface RepairDashboardResponse {
  items: RepairItem[];
  summary: {
    total_items: number;
    total_qty: number;
    total_value: number;
  };
  locations: string[];
  selected_location: string;
}

export interface RepairTransferContext {
  from_location: string;
  to_location?: string;
  to_locations: string[];
  from_locations?: string[];
}

export interface RepairTransferLine {
  item_id: number;
  item_number: string;
  description: string;
  qty: number;
}

export async function getRepairDashboard(location?: string): Promise<RepairDashboardResponse> {
  const res = await axios.get("/api/repairs", {
    params: location && location !== "all" ? { location } : {},
  });
  return {
    items: res.data.data ?? [],
    summary: res.data.summary ?? { total_items: 0, total_qty: 0, total_value: 0 },
    locations: res.data.filters?.locations ?? ["Repair", "Main Location"],
    selected_location: res.data.selected_location ?? "Repair",
  };
}

export async function searchRepairItems(
  search: string,
  fromLocation: string
): Promise<RepairItem[]> {
  const res = await axios.get("/api/repairs/search", {
    params: { q: search, from_location: fromLocation },
  });
  return res.data.data ?? [];
}

export async function getRepairTransferContext(
  type: "send" | "receive"
): Promise<RepairTransferContext> {
  const res = await axios.get("/api/repairs/context", { params: { type } });
  return res.data.data;
}

export async function executeRepairTransfer(payload: {
  transfer_type: "send" | "receive";
  from_location: string;
  to_location: string;
  lines: { item_id: number; qty: number }[];
}): Promise<void> {
  await axios.post("/api/repairs/transfer", payload);
}
