import type { OfferSelectedBatch } from "../../../api/offersApi";
import type { Item, ItemBatch } from "../../../api/itemsApi";

export interface OfferCatalogRow extends Item {
  allIds: number[];
}

/** One row per item_number with batch totals across all branch rows. */
export function buildOfferCatalogRows(items: Item[]): OfferCatalogRow[] {
  const byNumber = new Map<
    string,
    { rep: Item; allIds: number[]; batchCount: number; hasBatches: boolean }
  >();

  for (const item of items) {
    const key = item.item_number?.trim();
    if (!key) continue;

    const batchCount = item.batch_count ?? 0;
    const hasBatches = Boolean(item.has_batches) || batchCount > 0;
    const existing = byNumber.get(key);

    if (!existing) {
      byNumber.set(key, {
        rep: item,
        allIds: [item.id],
        batchCount,
        hasBatches,
      });
      continue;
    }

    existing.allIds.push(item.id);
    existing.batchCount += batchCount;
    existing.hasBatches = existing.hasBatches || hasBatches;
    if (existing.rep.location !== "Main Location" && item.location === "Main Location") {
      existing.rep = item;
    }
  }

  return Array.from(byNumber.values()).map(({ rep, allIds, batchCount, hasBatches }) => ({
    ...rep,
    allIds,
    batch_count: batchCount,
    has_batches: hasBatches,
  }));
}

export function isProductSelected(
  row: OfferCatalogRow,
  selectedProductKeys: Set<string>,
  selectedBatchIds: Set<number>,
  batchesByItemNumber: Map<string, ItemBatch[]>
): boolean {
  if (selectedProductKeys.has(row.item_number)) return true;
  const batches = batchesByItemNumber.get(row.item_number) ?? [];
  return batches.some((b) => selectedBatchIds.has(b.id));
}

export function isProductIndeterminate(
  row: OfferCatalogRow,
  selectedProductKeys: Set<string>,
  selectedBatchIds: Set<number>,
  batchesByItemNumber: Map<string, ItemBatch[]>
): boolean {
  if (selectedProductKeys.has(row.item_number)) return false;
  const batches = batchesByItemNumber.get(row.item_number) ?? [];
  const selectedCount = batches.filter((b) => selectedBatchIds.has(b.id)).length;
  return selectedCount > 0 && selectedCount < batches.length;
}

export function batchToOfferSelected(
  batch: ItemBatch,
  row: OfferCatalogRow
): OfferSelectedBatch {
  return {
    id: batch.id,
    batch_number: batch.batch_number,
    location: batch.location,
    qty: batch.qty,
    purchase_price: batch.purchase_price,
    selling_price: batch.selling_price,
    expiry_date: batch.expiry_date,
    item_id: batch.item_id ?? row.id,
    item_number: row.item_number,
    description: row.description,
  };
}
