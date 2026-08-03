import { startOfDay } from "date-fns";

export const headerBtnSx = {
  textTransform: "none" as const,
  fontWeight: 600,
  borderColor: "var(--surface-border)",
  color: "text.primary",
  bgcolor: "var(--surface-bg)",
  "&:hover": { bgcolor: "var(--surface-bg-alt)", borderColor: "var(--surface-text-muted)" },
};

export const summaryCardSx = {
  flex: 1,
  minWidth: 180,
  p: 2,
  border: "1px solid var(--surface-border)",
  borderRadius: 1,
  bgcolor: "var(--surface-bg)",
};

export function defaultDateRange() {
  const today = startOfDay(new Date());
  return { dateFrom: today, dateTo: today };
}

export function formatDashboardRs(amount: number): string {
  return `Rs ${amount.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export {
  DashboardPage,
  DashboardHero,
  DashboardHeroButton,
  ModernKpiCard,
  KpiGrid,
  ModernSummaryCard,
  SummaryCardsRow,
  ModernStatTile,
  DashboardQuickLinks,
  DashboardSection,
  DashboardFilterPanel,
  ModernTableContainer,
  BalanceChip,
  modernHeaderBtnSx,
  modernPrimaryBtnSx,
} from "./ModernDashboardComponents";
