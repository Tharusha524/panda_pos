import type { ShipmentPayload } from "../../../api/shippingApi";

export const SHIPPING_BASE = "/shipping";

export function emptyShipmentForm(): ShipmentPayload {
  const today = new Date().toISOString().slice(0, 10);
  return {
    location: "Main Location",
    shipment_no: "",
    sale_id: null,
    sales_id: null,
    customer_id: null,
    customer_name: null,
    shipment_date: today,
    destination: null,
    estimated_delivery_date: null,
    weight: null,
    freight_cost: 0,
    invoice_cost: 0,
    bsl_number: null,
    us_lot_number: null,
    status: "Pending",
    notes: null,
  };
}

export function formatShippingRs(amount: number): string {
  return `Rs ${amount.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
