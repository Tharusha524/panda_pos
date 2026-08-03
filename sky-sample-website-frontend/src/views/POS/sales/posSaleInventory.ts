import type { Item } from "../../../api/itemsApi";
import { itemSellableQty } from "../inventory/itemInventoryUtils";

/** Items that use branch stock counts for POS sales */
export function isInventoryTrackedItem(item: Item): boolean {
  return item.track_with_inventory !== false;
}

export function getItemStockQty(item: Item): number {
  return itemSellableQty(item);
}

export function isItemOutOfStock(item: Item): boolean {
  if (!isInventoryTrackedItem(item)) return false;
  return getItemStockQty(item) <= 0;
}

/** Active inventory-tracked items for the POS product picker */
export function filterPosSaleCatalogItems(items: Item[]): Item[] {
  return items.filter((item) => item.is_active && isInventoryTrackedItem(item));
}

export function canIncreaseCartQty(
  item: Item,
  currentCartQty: number,
  addQty = 1,
  maxQty?: number,
  allowNegativeInventory = false
): boolean {
  return canSetCartQty(item, currentCartQty + addQty, maxQty, allowNegativeInventory);
}

export function canSetCartQty(
  item: Item,
  newQty: number,
  maxQty?: number,
  allowNegativeInventory = false
): boolean {
  if (newQty < 0.01) return false;
  if (!isInventoryTrackedItem(item)) return true;
  if (allowNegativeInventory) return true;
  const limit = maxQty ?? Math.max(0, getItemStockQty(item));
  return newQty <= limit + 0.001;
}
