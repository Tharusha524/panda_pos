import axios from "axios";

export type ShipmentStatus = "Pending" | "In Transit" | "Delivered";

export interface ShipmentDetailLine {
  label: string;
  value: string | number;
}

export interface Shipment {
  id: number;
  location: string;
  shipment_no: string;
  sale_id: number | null;
  sales_id: string | null;
  customer_id: number | null;
  customer_name: string | null;
  shipment_date: string;
  shipment_datetime?: string;
  destination: string | null;
  estimated_delivery_date: string | null;
  weight: number | null;
  freight_cost: number;
  invoice_cost: number;
  bsl_number: string | null;
  us_lot_number: string | null;
  status: ShipmentStatus;
  notes: string | null;
  details?: ShipmentDetailLine[];
}

export type ShipmentPayload = Omit<Shipment, "id">;

export interface ShipmentsListResponse {
  shipments: Shipment[];
  summary: {
    total_shipments: number;
    in_transit: number;
    total_freight_cost: number;
  };
  locations: string[];
  statuses: ShipmentStatus[];
}

export async function getShipments(
  location = "all",
  status = "all",
  dateFrom?: string,
  dateTo?: string
): Promise<ShipmentsListResponse> {
  const res = await axios.get("/api/shipments", {
    params: {
      ...(location && location !== "all" ? { location } : {}),
      ...(status && status !== "all" ? { status } : {}),
      ...(dateFrom ? { date_from: dateFrom } : {}),
      ...(dateTo ? { date_to: dateTo } : {}),
    },
  });
  return {
    shipments: res.data.data ?? [],
    summary: res.data.summary ?? {
      total_shipments: 0,
      in_transit: 0,
      total_freight_cost: 0,
    },
    locations: res.data.filters?.locations ?? ["Main Location"],
    statuses: res.data.filters?.statuses ?? ["Pending", "In Transit", "Delivered"],
  };
}

export async function getShipment(id: number): Promise<Shipment> {
  const res = await axios.get(`/api/shipments/${id}`);
  return res.data.data;
}

export async function getNextShipmentNo(): Promise<string> {
  const res = await axios.get("/api/shipments/next-shipment-no");
  return res.data.data.shipment_no;
}

export async function createShipment(payload: ShipmentPayload): Promise<Shipment> {
  const res = await axios.post("/api/shipments", payload);
  return res.data.data;
}

export async function updateShipment(
  id: number,
  payload: Partial<ShipmentPayload>
): Promise<Shipment> {
  const res = await axios.put(`/api/shipments/${id}`, payload);
  return res.data.data;
}

export async function deleteShipment(id: number): Promise<void> {
  await axios.delete(`/api/shipments/${id}`);
}
