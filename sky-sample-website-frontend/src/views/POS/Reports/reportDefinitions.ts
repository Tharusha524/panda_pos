import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import InventoryIcon from "@mui/icons-material/Inventory";
import PeopleIcon from "@mui/icons-material/People";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import type { SvgIconComponent } from "@mui/icons-material";

export interface ReportDefinition {
  key: string;
  title: string;
  description: string;
}

export interface ReportCategory {
  id: string;
  title: string;
  description: string;
  icon: SvgIconComponent;
  reports: ReportDefinition[];
}

export const REPORT_CATEGORIES: ReportCategory[] = [
  {
    id: "sales",
    title: "Sales",
    description: "Sales, returns, payments, and category performance",
    icon: PointOfSaleIcon,
    reports: [
      { key: "sales-summary", title: "Sales Summary", description: "Sales list with expandable line-item details" },
      { key: "sales-details", title: "Sales Details", description: "All completed sales in the period" },
      { key: "sales-return-summary", title: "Sales Return Summary", description: "Return totals by day" },
      { key: "sales-return-details", title: "Sales Return Details", description: "Individual return transactions" },
      { key: "customer-payment", title: "Customer Payment", description: "Customer payment receipts" },
      { key: "sales-by-category", title: "Sales by Category", description: "Revenue grouped by item category" },
      { key: "customer-net-sales", title: "Customer Net Sales", description: "Net sales per customer" },
    ],
  },
  {
    id: "expense",
    title: "Expense",
    description: "Operating expenses",
    icon: ReceiptLongIcon,
    reports: [
      { key: "expense-summary", title: "Expense Summary", description: "Expenses by category" },
    ],
  },
  {
    id: "item",
    title: "Item",
    description: "Inventory and stock reports",
    icon: InventoryIcon,
    reports: [
      { key: "reorder-items", title: "Reorder Items", description: "Items at or below reorder level" },
      { key: "expiry-items", title: "Expiry Items", description: "Items nearing or past expiry" },
      { key: "item-list", title: "Item List", description: "Full item catalog" },
      { key: "inventory-in-out", title: "Inventory In / Out", description: "Stock movements in the period" },
      { key: "write-off-summary", title: "Write-off Summary", description: "Inventory write-offs" },
      { key: "write-off-details", title: "Write-off Details", description: "Write-off line details" },
      { key: "inventory-summary", title: "Inventory Summary", description: "Current stock and value" },
      { key: "og-tog-details", title: "OG / TOG Details", description: "OG and TOG tracking" },
      { key: "inventory-adjustment", title: "Inventory Adjustment", description: "Manual stock adjustments" },
      { key: "inventory-category", title: "Inventory by Category", description: "Stock grouped by category" },
      { key: "repair-item-summary", title: "Repair Item Summary", description: "Repair-related items" },
      { key: "non-moving-items", title: "Non Moving Items", description: "Items with no sales in period" },
      { key: "deleted-inventory-summary", title: "Deleted Inventory Summary", description: "Removed inventory from audit log" },
    ],
  },
  {
    id: "customer",
    title: "Customer",
    description: "Customer balances and activity",
    icon: PeopleIcon,
    reports: [
      { key: "customer-list", title: "Customer List", description: "All customers" },
      { key: "customer-outstanding", title: "Customer Outstanding", description: "Customers with balance due" },
      { key: "customer-cheque-details", title: "Customer Cheque Details", description: "Cheque payments from customers" },
      { key: "customer-aging", title: "Customer Aging", description: "Receivables aging buckets" },
      { key: "customer-summary", title: "Customer Summary", description: "Customer count and balances" },
      { key: "customer-activity", title: "Customer Activity", description: "Sales activity per customer" },
    ],
  },
  {
    id: "supplier",
    title: "Supplier",
    description: "Supplier master and activity",
    icon: LocalShippingIcon,
    reports: [
      { key: "supplier-detail", title: "Supplier Detail", description: "Supplier directory" },
      { key: "supplier-activity", title: "Supplier Activity", description: "Purchases per supplier" },
    ],
  },
  {
    id: "purchase",
    title: "Purchase",
    description: "Purchasing and supplier payments",
    icon: ShoppingCartIcon,
    reports: [
      { key: "supplier-purchase", title: "Supplier Purchase", description: "Purchases by supplier" },
      { key: "purchase-details", title: "Purchase Details", description: "All purchase invoices" },
      { key: "purchase-return", title: "Purchase Return", description: "Purchase returns" },
      { key: "purchase-order", title: "Purchase Order", description: "Open purchase orders" },
      { key: "supplier-payment", title: "Supplier Payment", description: "Payments to suppliers" },
      { key: "supplier-cheque-payment-details", title: "Supplier Cheque Payment", description: "Cheque payments to suppliers" },
    ],
  },
  {
    id: "finance",
    title: "Finance",
    description: "Profit, cash, and end-of-day",
    icon: AccountBalanceIcon,
    reports: [
      { key: "cash-in-hand", title: "Cash in Hand", description: "Estimated cash position" },
      { key: "sold-items-profit", title: "Sold Items Profit", description: "Profit on sold items" },
      { key: "income-expenses", title: "Income & Expenses", description: "Net income overview" },
      { key: "inventory-costing", title: "Inventory Costing", description: "Inventory at cost" },
      { key: "end-of-day", title: "End of Day", description: "Daily closing summary" },
    ],
  },
  {
    id: "audit",
    title: "Audit",
    description: "System audit and transactions",
    icon: FactCheckIcon,
    reports: [
      { key: "audit-report", title: "Audit Report", description: "User activity log" },
      { key: "transaction-summary", title: "Transaction Summary", description: "Counts by transaction type" },
    ],
  },
];

export function findReport(categoryId: string, reportKey: string): ReportDefinition | undefined {
  const category = REPORT_CATEGORIES.find((c) => c.id === categoryId);
  return category?.reports.find((r) => r.key === reportKey);
}

export function findCategory(categoryId: string): ReportCategory | undefined {
  return REPORT_CATEGORIES.find((c) => c.id === categoryId);
}
