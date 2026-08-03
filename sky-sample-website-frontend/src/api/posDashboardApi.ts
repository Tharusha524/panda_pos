import axios from "axios";

export interface PosDashboardMetrics {
  today_sales_amount: number;
  today_sales_count: number;
  month_sales_amount: number;
  today_purchases_amount: number;
  today_purchases_count: number;
  today_expenses_amount: number;
  today_payments_amount: number;
  hold_orders_count: number;
  active_items: number;
  low_stock_count: number;
  customers_count: number;
  debtor_count: number;
  total_receivables: number;
  shipments_today: number;
}

export interface PosSalesChartPoint {
  date: string;
  label: string;
  sales_amount: number;
  orders: number;
}

export interface PosRecentTransaction {
  type: "sale" | "return" | "purchase" | "payment" | "expense";
  id: number;
  reference: string | null;
  party: string | null;
  amount: number;
  date: string | null;
  status: string;
  payment_method: string | null;
  created_at: string | null;
}

export interface PosDashboardOverview {
  generated_at: string;
  metrics: PosDashboardMetrics;
  sales_chart: PosSalesChartPoint[];
  recent_transactions: PosRecentTransaction[];
}

export async function getPosDashboard(): Promise<PosDashboardOverview> {
  const res = await axios.get("/api/pos/dashboard");
  return res.data.data;
}
