import axios from "axios";

export interface ReportColumn {
  key: string;
  label: string;
}

export interface ReportSummaryItem {
  label: string;
  value: string | number;
}

export interface ReportFilters {
  date_from: string;
  date_to: string;
  branch_id: number | null;
  branch_name: string;
}

export interface SalesSummaryLineItem {
  item_number: string | null;
  description: string | null;
  qty: number;
  unit_price: number;
  discount: number;
  net_price: number;
  amount: number;
}

export interface SalesSummarySale {
  id: number;
  date: string;
  sales_id: string | null;
  customer: string;
  location: string | null;
  transaction_label: string;
  sub_total: number;
  discount: number;
  net_amount: number;
  payment_method: string | null;
  items: SalesSummaryLineItem[];
}

export interface ReportData {
  title: string;
  generated_at: string;
  filters: ReportFilters;
  summary: ReportSummaryItem[];
  columns: ReportColumn[];
  rows: Record<string, string | number | null>[];
  note?: string | null;
  layout?: "table" | "sales_summary";
  sales?: SalesSummarySale[];
}

export interface FetchReportParams {
  dateFrom: string;
  dateTo: string;
  /** Branch/location name (e.g. "Main Location") or null for all branches */
  location?: string | null;
  branchId?: string | number | null;
}

export async function fetchReport(
  reportKey: string,
  params: FetchReportParams
): Promise<ReportData> {
  const res = await axios.get(`/api/reports/${reportKey}`, {
    params: {
      date_from: params.dateFrom,
      date_to: params.dateTo,
      location: params.location && params.location !== "all" ? params.location : undefined,
      branch_id:
        params.branchId && params.branchId !== "all" ? params.branchId : undefined,
    },
  });
  return res.data.data;
}

export async function fetchReportKeys(): Promise<string[]> {
  const res = await axios.get("/api/reports");
  return res.data.data;
}
