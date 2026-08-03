import { Box, Chip } from "@mui/material";
import type { ChipProps } from "@mui/material";
import type { ReactNode } from "react";
import type { Item } from "../../../api/itemsApi";
import {
  expiryChipColor,
  expiryChipLabel,
  formatExpiryDate,
  formatItemQty,
  resolveItemExpiry,
  type ExpiryStatus,
} from "./itemInventoryUtils";

type ExpiryItem = Pick<
  Item,
  | "nearest_expiry_date"
  | "expiry_date"
  | "main_expiry_date"
  | "nearest_batch_expiry_date"
  | "nearest_batch_expiry_qty"
  | "unbatched_qty"
  | "uom"
  | "expiry_status"
  | "expiry_days_remaining"
>;

function expiryStatusForDate(date: string | null | undefined): ExpiryStatus {
  if (!date) return "none";
  const resolved = resolveItemExpiry({
    nearest_expiry_date: date,
    expiry_date: date,
    expiry_status: "ok",
    expiry_days_remaining: null,
  });
  return resolved.status;
}

function chipLabelForDate(
  date: string,
  prefix: string,
  qty?: number | null,
  uom?: string | null
): string {
  const resolved = resolveItemExpiry({
    nearest_expiry_date: date,
    expiry_date: date,
    expiry_status: "ok",
    expiry_days_remaining: null,
  });
  const formatted = formatExpiryDate(date);
  let base: string;
  if (resolved.status === "expired") base = `${prefix} expired ${formatted}`;
  else if (resolved.status === "expiring_soon" && resolved.daysRemaining != null) {
    const days = resolved.daysRemaining;
    base =
      days === 0 ? `${prefix} today · ${formatted}` : `${prefix} ${formatted} (${days}d)`;
  } else if (resolved.status === "ok" && resolved.daysRemaining != null) {
    base = `${prefix} ${formatted} (${resolved.daysRemaining}d)`;
  } else {
    base = `${prefix} ${formatted}`;
  }

  if (qty != null && qty > 0) {
    return `${base} · ${formatItemQty(qty, uom)}`;
  }

  return base;
}

function SingleExpiryChip({
  item,
  size,
}: {
  item: ExpiryItem;
  size?: ChipProps["size"];
}) {
  const resolved = resolveItemExpiry(item);
  if (!resolved.date || resolved.status === "none") {
    return null;
  }

  return (
    <Chip
      size={size}
      label={expiryChipLabel(item)}
      color={expiryChipColor(resolved.status as ExpiryStatus)}
      variant={resolved.status === "ok" ? "outlined" : "filled"}
    />
  );
}

export function ItemExpiryChip({
  item,
  size = "small",
}: {
  item: ExpiryItem;
  size?: ChipProps["size"];
}) {
  const mainQty = Number(item.unbatched_qty ?? 0);
  const batchQty = Number(item.nearest_batch_expiry_qty ?? 0);
  const mainExpiry =
    mainQty > 0.001 ? item.main_expiry_date ?? item.expiry_date ?? null : null;
  const batchExpiry = item.nearest_batch_expiry_date ?? null;

  const rows: ReactNode[] = [];

  if (mainExpiry && mainQty > 0.001) {
    const mainStatus = expiryStatusForDate(mainExpiry);
    rows.push(
      <Chip
        key="main"
        size={size}
        label={chipLabelForDate(mainExpiry, "Main", mainQty, item.uom)}
        color={expiryChipColor(mainStatus)}
        variant={mainStatus === "ok" ? "outlined" : "filled"}
      />
    );
  }

  if (batchExpiry && batchQty > 0.001) {
    const batchStatus = expiryStatusForDate(batchExpiry);
    rows.push(
      <Chip
        key="batch"
        size={size}
        label={chipLabelForDate(batchExpiry, "Batch", batchQty, item.uom)}
        color={expiryChipColor(batchStatus)}
        variant={batchStatus === "ok" ? "outlined" : "filled"}
      />
    );
  }

  if (rows.length > 0) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.35 }}>
        {rows}
      </Box>
    );
  }

  return <SingleExpiryChip item={item} size={size} />;
}
