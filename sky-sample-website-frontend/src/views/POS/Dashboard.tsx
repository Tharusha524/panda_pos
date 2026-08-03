import React, { useMemo } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  alpha,
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PaymentIcon from "@mui/icons-material/Payment";
import InventoryIcon from "@mui/icons-material/Inventory";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import PeopleIcon from "@mui/icons-material/People";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { Link } from "react-router";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getPosDashboard, type PosRecentTransaction } from "../../api/posDashboardApi";
import { useLiveQuery } from "../../hooks/useLiveQuery";
import { LIVE_REFETCH_MS } from "../../constants/liveQuery";
import {
  DashboardHero,
  DashboardHeroButton,
  DashboardPage,
  DashboardQuickLinks,
  DashboardSection,
  KpiGrid,
  ModernKpiCard,
  ModernStatTile,
} from "./shared/ModernDashboardComponents";

function formatRs(amount: number): string {
  return `Rs ${amount.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const TYPE_LABELS: Record<PosRecentTransaction["type"], string> = {
  sale: "Sale",
  return: "Return",
  purchase: "Purchase",
  payment: "Payment",
  expense: "Expense",
};

const TYPE_COLORS: Record<PosRecentTransaction["type"], string> = {
  sale: "#2563eb",
  return: "#d97706",
  purchase: "#7c3aed",
  payment: "#059669",
  expense: "#dc2626",
};

const DEFAULT_TX_COLOR = "#64748b";

function getTxType(tx: PosRecentTransaction): PosRecentTransaction["type"] {
  const known: PosRecentTransaction["type"][] = [
    "sale",
    "return",
    "purchase",
    "payment",
    "expense",
  ];
  if (tx.type && known.includes(tx.type)) {
    return tx.type;
  }
  return "sale";
}

const Dashboard: React.FC = () => {
  const { data, isLoading, isFetching, dataUpdatedAt } = useLiveQuery({
    queryKey: ["pos-dashboard"],
    queryFn: getPosDashboard,
  });

  const m = data?.metrics;
  const chartData = data?.sales_chart ?? [];
  const recent = data?.recent_transactions ?? [];

  const lastUpdated = useMemo(() => {
    if (dataUpdatedAt) {
      return new Date(dataUpdatedAt).toLocaleTimeString();
    }
    return data?.generated_at?.slice(11, 19) ?? "—";
  }, [dataUpdatedAt, data?.generated_at]);

  if (isLoading && !data) {
    return (
      <Box sx={{ p: 4, display: "flex", justifyContent: "center", minHeight: 320 }}>
        <CircularProgress sx={{ color: "var(--pallet-blue)" }} />
      </Box>
    );
  }

  return (
    <DashboardPage>
      <DashboardHero
        title="POS Dashboard"
        subtitle="Live overview of sales, purchases, payments, inventory, and customer credit"
        isLive
        isFetching={isFetching}
        lastUpdated={lastUpdated}
        actions={
          <Box component={Link} to="/sales/new" sx={{ textDecoration: "none" }}>
            <DashboardHeroButton>New sale</DashboardHeroButton>
          </Box>
        }
      />

      <KpiGrid columns={{ xs: 1, sm: 2, md: 3, xl: 3 }}>
        <ModernKpiCard
          title="Today's sales"
          value={formatRs(m?.today_sales_amount ?? 0)}
          subtitle={`${m?.today_sales_count ?? 0} orders`}
          icon={<ShoppingCartIcon />}
          accent="#2563eb"
          to="/sales"
        />
        <ModernKpiCard
          title="Month sales"
          value={formatRs(m?.month_sales_amount ?? 0)}
          subtitle="This month"
          icon={<TrendingUpIcon />}
          accent="#0d9488"
          to="/sales"
        />
        <ModernKpiCard
          title="Today's purchases"
          value={formatRs(m?.today_purchases_amount ?? 0)}
          subtitle={`${m?.today_purchases_count ?? 0} invoices`}
          icon={<ShoppingBagIcon />}
          accent="#7c3aed"
          to="/purchasing"
        />
        <ModernKpiCard
          title="Today's payments"
          value={formatRs(m?.today_payments_amount ?? 0)}
          subtitle={`Expenses ${formatRs(m?.today_expenses_amount ?? 0)}`}
          icon={<PaymentIcon />}
          accent="#059669"
          to="/payments"
        />
        <ModernKpiCard
          title="Credit balance"
          value={formatRs(m?.total_receivables ?? 0)}
          subtitle={`${m?.debtor_count ?? 0} debtors`}
          icon={<AccountBalanceWalletIcon />}
          accent="#dc2626"
          to="/customers"
        />
        <ModernKpiCard
          title="Customers"
          value={String(m?.customers_count ?? 0)}
          subtitle={`${m?.active_items ?? 0} active items`}
          icon={<PeopleIcon />}
          accent="#0284c7"
          to="/customers"
        />
      </KpiGrid>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={3}>
          <ModernStatTile label="Hold orders" value={m?.hold_orders_count ?? 0} accent="#6366f1" to="/sales" />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <ModernStatTile
            label="Low stock"
            value={m?.low_stock_count ?? 0}
            warning={(m?.low_stock_count ?? 0) > 0}
            to="/inventory"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <ModernStatTile
            label="Shipments today"
            value={m?.shipments_today ?? 0}
            accent="#0891b2"
            to="/shipping"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <Box sx={{ display: "flex", gap: 1, height: "100%", alignItems: "stretch" }}>
            <Box
              sx={{
                flex: 1,
                p: 1.5,
                borderRadius: 3,
                border: "1px dashed",
                borderColor: alpha("#f59e0b", 0.4),
                bgcolor: alpha("#f59e0b", 0.05),
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <WarningAmberIcon sx={{ color: "warning.main", fontSize: 20 }} />
              <Typography variant="caption" color="text.secondary">
                {(m?.low_stock_count ?? 0) > 0 ? "Review low stock items" : "Stock levels OK"}
              </Typography>
            </Box>
            <Box
              sx={{
                flex: 1,
                p: 1.5,
                borderRadius: 3,
                border: "1px dashed",
                borderColor: alpha("#6366f1", 0.35),
                bgcolor: alpha("#6366f1", 0.05),
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <PauseCircleOutlineIcon sx={{ color: "#6366f1", fontSize: 20 }} />
              <Typography variant="caption" color="text.secondary">
                {(m?.hold_orders_count ?? 0) > 0 ? `${m?.hold_orders_count} on hold` : "No hold orders"}
              </Typography>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12}>
          <DashboardQuickLinks
            links={[
              { label: "Sales", to: "/sales" },
              { label: "Purchases", to: "/purchasing" },
              { label: "Payments", to: "/payments" },
              { label: "Expenses", to: "/expenses" },
              { label: "Inventory", to: "/inventory" },
              { label: "Customers", to: "/customers" },
              { label: "Shipping", to: "/shipping" },
            ]}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={7}>
          <DashboardSection title="Sales — last 7 days">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}`} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--surface-border)",
                    boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
                  }}
                  formatter={(value: number) => [formatRs(value), "Sales"]}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.date
                      ? new Date(payload[0].payload.date).toLocaleDateString()
                      : ""
                  }
                />
                <Area
                  type="monotone"
                  dataKey="sales_amount"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fill="url(#salesGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: "block" }}>
              Auto-refreshes every {LIVE_REFETCH_MS / 1000}s
            </Typography>
          </DashboardSection>
        </Grid>

        <Grid item xs={12} lg={5}>
          <DashboardSection title="Recent transactions" icon={<ReceiptLongIcon color="primary" />}>
            <TableContainer sx={{ maxHeight: 320 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)", borderBottom: "1px solid var(--surface-border)" }}>
                      Type
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)", borderBottom: "1px solid var(--surface-border)" }}>
                      Ref
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)", borderBottom: "1px solid var(--surface-border)" }}
                    >
                      Amount
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recent.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 5, color: "text.secondary" }}>
                        No transactions yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    recent.map((tx, idx) => {
                      const txType = getTxType(tx);
                      const color = TYPE_COLORS[txType] ?? DEFAULT_TX_COLOR;
                      return (
                        <TableRow
                          key={`${txType}-${tx.id}-${idx}`}
                          hover
                          sx={{ "&:last-child td": { borderBottom: 0 } }}
                        >
                          <TableCell>
                            <Chip
                              label={TYPE_LABELS[txType] ?? txType}
                              size="small"
                              sx={{
                                bgcolor: alpha(color, 0.1),
                                color,
                                fontWeight: 700,
                                fontSize: "0.68rem",
                                height: 24,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 140, fontWeight: 600 }}>
                              {tx.reference || "—"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {tx.party || tx.date}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={700}>
                              {formatRs(tx.amount)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </DashboardSection>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: "flex", alignItems: "center", gap: 1, opacity: 0.65 }}>
        <InventoryIcon fontSize="small" />
        <LocalShippingIcon fontSize="small" />
        <Typography variant="caption">
          Data from your company&apos;s live POS records · no manual refresh needed
        </Typography>
      </Box>
    </DashboardPage>
  );
};

export default Dashboard;
