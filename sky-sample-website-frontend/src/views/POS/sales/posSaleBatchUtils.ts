import type { Item, ItemBatch } from "../../../api/itemsApi";
import type { SaleLineDraft } from "./SaleLineItemsSection";
import { isBatchExpired } from "../inventory/itemInventoryUtils";
import { getPosItemUnitPrice, type PosSalesPriceMode } from "./posSalePricing";

export const MAIN_LOCATION = "Main Location";

export function normalizeBranchLocation(location: string | null | undefined): string {
  const value = (location ?? "").trim();
  return value !== "" ? value : MAIN_LOCATION;
}

/** Batches with stock at the sale branch, nearest expiry first (FEFO). Excludes expired unless allowed. */
export function availableBatchesAtBranch(
  batches: ItemBatch[],
  branchLocation: string,
  options?: { includeExpired?: boolean }
): ItemBatch[] {
  const branch = normalizeBranchLocation(branchLocation);
  const includeExpired = options?.includeExpired ?? false;

  return batches
    .filter((b) => {
      const batchLoc = normalizeBranchLocation(b.location ?? branch);
      if (batchLoc !== branch || b.qty <= 0) return false;
      if (!includeExpired && isBatchExpired(b)) return false;
      return true;
    })
    .sort((a, b) => {
      if (!a.expiry_date && !b.expiry_date) {
        return a.id - b.id;
      }
      if (!a.expiry_date) {
        return 1;
      }
      if (!b.expiry_date) {
        return -1;
      }
      return a.expiry_date.localeCompare(b.expiry_date) || a.id - b.id;
    });
}

export function cartLineBatchKey(itemId: number, itemBatchId?: number | null): string {
  return `${itemId}:${itemBatchId ?? "auto"}`;
}

export function batchSellingPrice(batch: ItemBatch, item: Item): number {
  return batch.selling_price ?? item.selling_price ?? item.wholesale_price ?? 0;
}

export function unitPriceForBatchSale(
  item: Item,
  salesType: PosSalesPriceMode,
  batch?: ItemBatch | null
): number {
  if (!batch) {
    return getPosItemUnitPrice(item, salesType);
  }
  if (salesType === "Wholesale") {
    return getPosItemUnitPrice(item, salesType);
  }
  return batchSellingPrice(batch, item);
}

export function maxQtyForCartLine(
  line: SaleLineDraft,
  lines: SaleLineDraft[],
  itemTotalStock: number
): number {
  if (line.item_batch_id != null && line.batch_stock_qty != null) {
    const usedByOtherLines = lines
      .filter((l) => l.key !== line.key && l.item_batch_id === line.item_batch_id)
      .reduce((sum, l) => sum + l.qty, 0);
    return Math.max(0, line.batch_stock_qty - usedByOtherLines);
  }
  return itemTotalStock;
}
