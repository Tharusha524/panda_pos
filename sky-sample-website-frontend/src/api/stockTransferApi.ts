import axios from "axios";

export interface StockTransferItem {
  id: number;
  item_number: string;
  description: string;
  location: string;
  qty: number;
  /** Current qty at the "to" location, when searched with a to_location. */
  to_qty?: number | null;
  selling_price: number;
  uom?: string;
}

export interface StockTransferContext {
  locations: string[];
}

export async function getStockTransferContext(): Promise<StockTransferContext> {
  const res = await axios.get("/api/stock-transfers/context");
  return res.data.data ?? { locations: ["Main Location"] };
}

export async function searchStockTransferItems(
  search: string,
  fromLocation: string,
  toLocation?: string
): Promise<StockTransferItem[]> {
  const res = await axios.get("/api/stock-transfers/search", {
    params: { q: search, from_location: fromLocation, to_location: toLocation },
  });
  return res.data.data ?? [];
}

export interface StockTransferResultLine {
  item_number: string;
  description: string;
  qty: number;
  from_before: number;
  from_after: number;
  to_before: number;
  to_after: number;
}

export interface StockTransferResult {
  transfer_id: number;
  from_location: string;
  to_location: string;
  transfer_date: string;
  lines: StockTransferResultLine[];
}

export async function executeStockTransfer(payload: {
  from_location: string;
  to_location: string;
  transfer_date?: string;
  notes?: string;
  lines: { item_id: number; qty: number }[];
}): Promise<StockTransferResult> {
  const res = await axios.post("/api/stock-transfers", payload);
  return res.data.data;
}
