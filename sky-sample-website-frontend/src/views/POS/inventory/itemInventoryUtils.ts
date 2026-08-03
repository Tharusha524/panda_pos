import type { ChipProps } from "@mui/material";
import type { Item } from "../../../api/itemsApi";
import { formatStockQty } from "../sales/posSaleUom";

export type ExpiryStatus = "none" | "ok" | "expiring_soon" | "expired";

export function formatItemQty(qty: number, uom?: string | null): string {
  return formatStockQty(Number(qty ?? 0), uom);
}

/** Physical qty on hand (never below zero for display). */
export function stockQtyOnHand(qty: number): number {
  return Math.max(0, Number(qty ?? 0));
}

/** Sellable / real stock for inventory and POS (excludes expired batch qty). */
export function itemSellableQty(
  item: Pick<Item, "qty" | "sellable_qty" | "expired_stock_qty">
): number {
  if (item.sellable_qty != null && !Number.isNaN(item.sellable_qty)) {
    return Math.max(0, Number(item.sellable_qty));
  }
  const total = stockQtyOnHand(item.qty ?? 0);
  const expired = Math.max(0, Number(item.expired_stock_qty ?? 0));
  return Math.max(0, Math.round((total - expired) * 100) / 100);
}

export function itemExpiredStockQty(
  item: Pick<Item, "expired_stock_qty" | "has_expired_stock">
): number {
  return Math.max(0, Number(item.expired_stock_qty ?? 0));
}

/** How much was sold beyond available stock (when qty in DB is negative). */
export function stockOversoldQty(qty: number): number {
  const value = Number(qty ?? 0);
  return value < 0 ? Math.abs(value) : 0;
}

export function isStockOversold(qty: number): boolean {
  return Number(qty ?? 0) < -0.0001;
}

/** Parse YYYY-MM-DD in local calendar (avoids timezone shifting expiry by one day). */
export function parseExpiryDateOnly(dateStr: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr.trim());
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (!y || m < 1 || m > 12 || d < 1 || d > 31) return null;
  return new Date(y, m - 1, d);
}

export function daysUntilExpiry(dateStr: string): number | null {
  const exp = parseExpiryDateOnly(dateStr);
  if (!exp) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((exp.getTime() - today.getTime()) / 86400000);
}

export function formatExpiryDate(date: string | null | undefined): string {
  if (!date) return "—";
  const parsed = parseExpiryDateOnly(date);
  if (!parsed) return date;
  return parsed.toLocaleDateString("en-LK", { year: "numeric", month: "short", day: "numeric" });
}


export function resolveItemExpiry(
  item: Pick<Item, "nearest_expiry_date" | "expiry_date" | "expiry_status" | "expiry_days_remaining">,
  alertDays = 7
): { status: ExpiryStatus; date: string | null; daysRemaining: number | null } {
  const date = item.nearest_expiry_date ?? item.expiry_date ?? null;
  if (!date) {
    return { status: "none", date: null, daysRemaining: null };
  }

  const daysRemaining = daysUntilExpiry(date);
  if (daysRemaining == null) {
    return {
      status: item.expiry_status && item.expiry_status !== "none" ? item.expiry_status : "none",
      date,
      daysRemaining: item.expiry_days_remaining ?? null,
    };
  }

  if (daysRemaining < 0) {
    return { status: "expired", date, daysRemaining };
  }
  if (daysRemaining <= alertDays) {
    return { status: "expiring_soon", date, daysRemaining };
  }
  return { status: "ok", date, daysRemaining };
}

export function isItemExpired(
  item: Pick<Item, "nearest_expiry_date" | "expiry_date" | "expiry_status" | "expiry_days_remaining">,
  alertDays?: number
): boolean {
  return resolveItemExpiry(item, alertDays).status === "expired";
}

export function isItemExpiringSoon(
  item: Pick<Item, "nearest_expiry_date" | "expiry_date" | "expiry_status" | "expiry_days_remaining">,
  alertDays?: number
): boolean {
  return resolveItemExpiry(item, alertDays).status === "expiring_soon";
}

export function expiryFieldsForBranchRow(item: Item): Pick<
  Item,
  "expiry_date" | "nearest_expiry_date" | "expiry_status" | "expiry_days_remaining"
> {
  const resolved = resolveItemExpiry(item);
  return {
    expiry_date: item.expiry_date ?? resolved.date,
    nearest_expiry_date: resolved.date,
    expiry_status: resolved.status,
    expiry_days_remaining: resolved.daysRemaining,
  };
}

export function expiryFieldsForSaleBranch(group: Item[], saleLocation: string): Pick<
  Item,
  "expiry_date" | "nearest_expiry_date" | "expiry_status" | "expiry_days_remaining"
> {
  const branchRow =
    group.find((i) => i.location === saleLocation && Number(i.qty ?? 0) > 0) ??
    group.find((i) => i.location === saleLocation) ??
    group.find((i) => Number(i.qty ?? 0) > 0) ??
    group[0];
  return expiryFieldsForBranchRow(branchRow);
}

export function isBatchExpired(batch: { expiry_date?: string | null }): boolean {
  if (!batch.expiry_date) return false;
  const days = daysUntilExpiry(batch.expiry_date);
  return days != null && days < 0;
}

/** Sum qty in expired batches (manual write-off target). */
export function expiredBatchQtyTotal(
  batches: Array<{ qty: number; expiry_date?: string | null }>
): number {
  return batches
    .filter((b) => b.qty > 0 && isBatchExpired(b))
    .reduce((sum, b) => sum + Number(b.qty ?? 0), 0);
}

/** Nearest non-expired batch expiry (shown after write-off). */
export function nextSellableBatchExpiry(
  batches: Array<{ qty: number; expiry_date?: string | null }>
): string | null {
  const dated = batches
    .filter((b) => b.qty > 0 && b.expiry_date && !isBatchExpired(b))
    .map((b) => b.expiry_date as string)
    .sort((a, b) => a.localeCompare(b));
  return dated[0] ?? null;
}

export type WriteOffBatchCategory = "expired" | "valid_expiry" | "normal";

export function writeOffBatchCategory(
  batch: { expiry_date?: string | null },
  alertDays = 7
): WriteOffBatchCategory {
  if (!batch.expiry_date) return "normal";
  if (isBatchExpired(batch)) return "expired";
  const days = daysUntilExpiry(batch.expiry_date);
  if (days != null && days <= alertDays) return "valid_expiry";
  return "valid_expiry";
}

export function groupBatchesForWriteOff<T extends { qty: number; expiry_date?: string | null }>(
  batches: T[],
  alertDays = 7
): { expired: T[]; validExpiry: T[]; normal: T[] } {
  const expired: T[] = [];
  const validExpiry: T[] = [];
  const normal: T[] = [];
  for (const batch of batches) {
    if (Number(batch.qty ?? 0) <= 0) continue;
    const cat = writeOffBatchCategory(batch, alertDays);
    if (cat === "expired") expired.push(batch);
    else if (batch.expiry_date) validExpiry.push(batch);
    else normal.push(batch);
  }
  const byExpiry = (a: T, b: T) =>
    (a.expiry_date ?? "").localeCompare(b.expiry_date ?? "");
  expired.sort(byExpiry);
  validExpiry.sort(byExpiry);
  return { expired, validExpiry, normal };
}

export function unbatchedStockQty(
  totalQty: number,
  batches: Array<{ qty: number }>
): number {
  const batched = batches.reduce((sum, b) => sum + Number(b.qty ?? 0), 0);
  return Math.max(0, Math.round((Number(totalQty ?? 0) - batched) * 100) / 100);
}

export function batchQtyTotal(batches: Array<{ qty: number }>): number {
  return batches.reduce((sum, b) => sum + Number(b.qty ?? 0), 0);
}

export type ExpiryFilter = "all" | "expired" | "expiring_soon";

export function filterItemsByExpiry<T extends Pick<Item, "nearest_expiry_date" | "expiry_date" | "expiry_status" | "expiry_days_remaining">>(
  items: T[],
  filter: ExpiryFilter
): T[] {
  if (filter === "all") return items;
  return items.filter((item) => {
    const status = resolveItemExpiry(item).status;
    return filter === "expired" ? status === "expired" : status === "expiring_soon";
  });
}

export function expiryChipColor(status?: ExpiryStatus | null): ChipProps["color"] {
  switch (status) {
    case "expired":
      return "error";
    case "expiring_soon":
      return "warning";
    case "ok":
      return "success";
    default:
      return "default";
  }
}

export function expiryChipLabel(
  item: Pick<Item, "nearest_expiry_date" | "expiry_date" | "expiry_status" | "expiry_days_remaining">
): string {
  const resolved = resolveItemExpiry(item);
  const date = resolved.date;
  if (!date || resolved.status === "none") return "No expiry";
  const formatted = formatExpiryDate(date);
  if (resolved.status === "expired") return `Expired ${formatted}`;
  if (resolved.status === "expiring_soon" && resolved.daysRemaining != null) {
    const days = resolved.daysRemaining;
    return days === 0 ? `Today · ${formatted}` : `${formatted} (${days}d)`;
  }
  if (resolved.status === "ok" && resolved.daysRemaining != null) {
    return `${formatted} (${resolved.daysRemaining}d)`;
  }
  return formatted;
}
