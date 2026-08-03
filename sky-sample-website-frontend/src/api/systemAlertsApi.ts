import axios from "axios";

export type SystemAlertSeverity = "error" | "warning" | "info";

export interface SystemAlertItem {
  id: number;
  item_number: string;
  description: string;
  location: string;
  qty: number;
  uom: string;
  nearest_expiry_date?: string | null;
  reorder_qty?: number;
}

export interface SystemAlert {
  id: string;
  severity: SystemAlertSeverity;
  title: string;
  message: string;
  count: number;
  link: string;
  items: SystemAlertItem[];
}

export interface SystemAlertsSummary {
  total_items: number;
  low_stock_count: number;
  oversold_count: number;
  expired_count: number;
  expiring_soon_count: number;
  hold_orders_count: number;
}

export interface SystemAlertsResponse {
  generated_at: string;
  total_count: number;
  alert_count: number;
  summary: SystemAlertsSummary;
  alert_settings: {
    expiry_alert_period_days: number;
    cheque_alert_period_days: number;
  };
  alerts: SystemAlert[];
}

export async function getSystemAlerts(): Promise<SystemAlertsResponse> {
  const res = await axios.get("/api/notifications/alerts");
  return res.data.data;
}
