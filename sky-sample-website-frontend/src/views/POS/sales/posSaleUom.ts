import { formatSaleRs } from "./saleFormUtils";

export function normalizeUom(uom?: string | null): string {
  return (uom?.trim().toLowerCase() || "pcs");
}

export function formatUomLabel(uom?: string | null): string {
  return normalizeUom(uom);
}

export function isDecimalUom(uom?: string | null): boolean {
  const u = normalizeUom(uom);
  return u === "kg" || u === "g" || u === "l" || u === "ml";
}

/** +/- button step in cart based on unit. */
export function qtyStepForUom(uom?: string | null): number {
  const u = normalizeUom(uom);
  if (u === "g" || u === "ml") return 10;
  if (u === "kg" || u === "l") return 0.1;
  return 1;
}

export function formatStockQty(qty: number, uom?: string | null): string {
  const label = formatUomLabel(uom);
  const decimals = isDecimalUom(uom) ? 2 : 0;
  return `${qty.toFixed(decimals)} ${label}`;
}

export function formatPricePerUom(price: number, uom?: string | null): string {
  return `${formatSaleRs(price)} / ${formatUomLabel(uom)}`;
}

export function parsePosCatalogSearch(input: string): { term: string; qty: number | null } {
  const trimmed = input.trim();
  if (!trimmed) return { term: "", qty: null };

  for (const sep of ["*", "x", "X"]) {
    const idx = trimmed.indexOf(sep);
    if (idx <= 0) continue;
    const left = trimmed.slice(0, idx).trim();
    const right = trimmed.slice(idx + 1).trim();
    const qty = parseFloat(right);
    if (left && !Number.isNaN(qty) && qty > 0) {
      return { term: left, qty: Math.round(qty * 100) / 100 };
    }
  }

  return { term: trimmed, qty: null };
}

export function qtyInputPropsForUom(uom?: string | null): { min: number; step: string } {
  const u = normalizeUom(uom);
  if (u === "kg" || u === "l") return { min: 0, step: "0.01" };
  if (u === "g" || u === "ml") return { min: 0, step: "1" };
  return { min: 0, step: "1" };
}

/** Cart line qty: 0 or less removes the line; otherwise round to 2 decimals. */
export function parseSaleLineQty(rawQty: number): number | null {
  if (!Number.isFinite(rawQty) || rawQty <= 0) return null;
  return Math.round(rawQty * 100) / 100;
}

export function roundSaleQty(qty: number): number {
  const parsed = parseSaleLineQty(qty);
  return parsed ?? 0.01;
}
