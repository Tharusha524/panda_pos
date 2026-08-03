import type { Item } from "../../../api/itemsApi";
import type { PurchaseLineDraft } from "./PurchaseLineItemsSection";
import { itemSellableQty } from "../inventory/itemInventoryUtils";
import { formatStockQty } from "../sales/posSaleUom";

/** Real sellable stock at branch (excludes expired batch qty). */
export function purchaseAvailableStock(item: Item): number {
  return itemSellableQty(item);
}

export function purchaseCartQtyForItem(
  lines: PurchaseLineDraft[],
  itemId: number
): number {
  return lines.find((l) => l.item_id === itemId)?.qty ?? 0;
}

export function purchaseStockAfter(
  available: number,
  buyingQty: number
): number {
  return roundStock(available + buyingQty);
}

export function roundStock(qty: number): number {
  return Math.round(qty * 100) / 100;
}

export function findCatalogItem(
  catalogItems: Item[],
  itemId: number | null | undefined
): Item | undefined {
  if (itemId == null) return undefined;
  return catalogItems.find((i) => i.id === itemId);
}

export function purchaseAvailableForLine(
  catalogItems: Item[],
  line: PurchaseLineDraft
): number {
  const item = findCatalogItem(catalogItems, line.item_id);
  return item ? purchaseAvailableStock(item) : 0;
}

export function purchaseAfterForLine(
  catalogItems: Item[],
  line: PurchaseLineDraft
): number {
  return purchaseStockAfter(purchaseAvailableForLine(catalogItems, line), line.qty);
}

export function formatAvailableStock(item: Item): string {
  return formatStockQty(purchaseAvailableStock(item), item.uom);
}

export function formatBuyingStock(qty: number, uom?: string | null): string {
  return formatStockQty(qty, uom);
}

export function formatAfterStock(
  available: number,
  buyingQty: number,
  uom?: string | null
): string {
  return formatStockQty(purchaseStockAfter(available, buyingQty), uom);
}

export function purchasePaymentEffectLabel(method?: string | null, isReturn = false): string {
  const m = (method ?? "Cash").toLowerCase();
  if (isReturn) {
    if (m === "credit") {
      return "Supplier payable reduced and stock decreases when saved.";
    }
    if (m === "cheque") {
      return "Cheque refund recorded — bank balance increases when saved.";
    }
    if (m === "bank_transfer" || m === "bank transfer" || m === "online") {
      return "Bank refund recorded — bank balance increases when saved.";
    }
    if (m === "card") {
      return "Card refund recorded — money back when saved.";
    }
    return "Cash refund recorded — cash balance increases when saved.";
  }
  if (m === "credit") {
    return "Amount recorded as supplier payable (credit). Stock still increases now.";
  }
  if (m === "cheque") {
    return "Cheque payment recorded — bank balance reduced when saved.";
  }
  if (m === "bank_transfer" || m === "bank transfer") {
    return "Bank transfer recorded — bank balance reduced when saved.";
  }
  if (m === "card") {
    return "Card payment recorded — money out when saved.";
  }
  return "Cash payment recorded — cash balance reduced when saved.";
}
