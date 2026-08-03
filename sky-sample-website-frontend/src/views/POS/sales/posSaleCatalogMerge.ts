import type { Item } from "../../../api/itemsApi";
import type { SaleLineDraft } from "./SaleLineItemsSection";
import { expiryFieldsForSaleBranch, itemSellableQty } from "../inventory/itemInventoryUtils";

export interface MergedPosCatalog {
  displayItems: Item[];
  variantsByItemNumber: Map<string, Item[]>;
}

function itemNumberKey(item: Item): string {
  return (item.item_number || String(item.id)).trim().toLowerCase();
}

/**
 * One catalog row per item number; qty is summed across all branches.
 * Pricing/metadata prefers the sale branch row when it exists.
 */
export function mergePosCatalogAcrossBranches(
  items: Item[],
  saleLocation: string
): MergedPosCatalog {
  const variantsByItemNumber = new Map<string, Item[]>();

  for (const item of items) {
    const key = itemNumberKey(item);
    const list = variantsByItemNumber.get(key) ?? [];
    list.push(item);
    variantsByItemNumber.set(key, list);
  }

  const displayItems: Item[] = [];

  for (const group of variantsByItemNumber.values()) {
    const preferred =
      group.find((i) => i.location === saleLocation && i.image_url) ??
      group.find((i) => i.image_url) ??
      group.find((i) => i.location === saleLocation) ??
      group[0];
    const totalQty = group.reduce((sum, i) => sum + Number(i.qty ?? 0), 0);
    const totalSellable = group.reduce((sum, i) => sum + itemSellableQty(i), 0);
    const totalExpired = group.reduce(
      (sum, i) => sum + Math.max(0, Number(i.expired_stock_qty ?? 0)),
      0
    );
    const imageSource = group.find((i) => i.image_url || i.image_path) ?? preferred;

    displayItems.push({
      ...preferred,
      qty: totalQty,
      sellable_qty: Math.round(totalSellable * 100) / 100,
      expired_stock_qty: Math.round(totalExpired * 100) / 100,
      image_url: imageSource.image_url ?? null,
      image_path: imageSource.image_path ?? null,
      ...expiryFieldsForSaleBranch(group, saleLocation),
    });
  }

  displayItems.sort((a, b) =>
    a.item_number.localeCompare(b.item_number, undefined, { numeric: true })
  );

  return { displayItems, variantsByItemNumber };
}

/**
 * Inventory row for cart / stock deduction.
 * Prefers preferred sale branch when it has stock; otherwise any branch with qty (highest first).
 */
export function resolveCartItemForSale(
  displayItem: Item,
  variantsByItemNumber: Map<string, Item[]>,
  preferredLocation: string
): Item {
  const key = itemNumberKey(displayItem);
  const group = variantsByItemNumber.get(key) ?? [displayItem];

  const atPreferredWithStock = group.find(
    (i) => i.location === preferredLocation && itemSellableQty(i) > 0
  );
  if (atPreferredWithStock) return atPreferredWithStock;

  const withStock = [...group]
    .filter((i) => itemSellableQty(i) > 0)
    .sort((a, b) => itemSellableQty(b) - itemSellableQty(a));
  if (withStock.length > 0) return withStock[0];

  return group.find((i) => i.location === preferredLocation) ?? group[0];
}

export function cartQtyForItem(lines: SaleLineDraft[], itemId: number): number {
  return lines
    .filter((l) => l.item_id === itemId)
    .reduce((sum, l) => sum + l.qty, 0);
}

export function availableStockForCartItem(cartItem: Item): number {
  return itemSellableQty(cartItem);
}

/** Sale location header: branch that supplies most cart lines (inventory location). */
export function resolveSaleLocationFromLines(
  lineItemIds: number[],
  rawCatalogItems: Item[],
  fallback: string
): string {
  if (lineItemIds.length === 0) return fallback;

  const counts = new Map<string, number>();
  for (const id of lineItemIds) {
    const loc = rawCatalogItems.find((i) => i.id === id)?.location;
    if (loc) counts.set(loc, (counts.get(loc) ?? 0) + 1);
  }
  if (counts.size === 0) return fallback;

  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

export function branchCountForDisplayItem(
  displayItem: Item,
  variantsByItemNumber: Map<string, Item[]>
): number {
  const key = itemNumberKey(displayItem);
  const group = variantsByItemNumber.get(key) ?? [displayItem];
  return new Set(group.map((i) => i.location).filter(Boolean)).size;
}
