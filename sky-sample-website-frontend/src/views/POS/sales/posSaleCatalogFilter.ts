import type { Item, ItemCategory } from "../../../api/itemsApi";
import { filterCatalogSearch } from "../shared/CatalogBrowseGrid";
import type { PosSubCategoryTab } from "./PosSubCategoryTabs";

export type PosCategoryTab = "all" | "favourite" | number;

export function subCategoriesForPosTab(
  tab: PosCategoryTab,
  categories: ItemCategory[]
): { id: number; name: string }[] {
  if (typeof tab === "number") {
    const cat = categories.find((c) => c.id === tab);
    return cat?.sub_categories ?? [];
  }
  if (tab === "all") {
    const seen = new Set<number>();
    const subs: { id: number; name: string }[] = [];
    for (const cat of categories) {
      for (const sub of cat.sub_categories) {
        if (!seen.has(sub.id)) {
          seen.add(sub.id);
          subs.push(sub);
        }
      }
    }
    return subs.sort((a, b) => a.name.localeCompare(b.name));
  }
  return [];
}

export function filterPosCatalogItems(
  items: Item[],
  tab: PosCategoryTab,
  categories: ItemCategory[],
  search: string,
  subTab: PosSubCategoryTab = "all"
): Item[] {
  let rows = items;

  if (tab === "favourite") {
    rows = rows.filter((i) => i.is_favourite);
  } else if (typeof tab === "number") {
    const cat = categories.find((c) => c.id === tab);
    if (cat) {
      rows = rows.filter(
        (i) => i.item_category_id === cat.id || i.category === cat.name
      );
    } else {
      rows = [];
    }
  }

  if (subTab !== "all") {
    const subs = subCategoriesForPosTab(tab, categories);
    const sub = subs.find((s) => s.id === subTab);
    if (sub) {
      rows = rows.filter(
        (i) =>
          i.item_sub_category_id === sub.id ||
          (i.sub_category?.toLowerCase() === sub.name.toLowerCase())
      );
    } else {
      rows = rows.filter((i) => i.item_sub_category_id === subTab);
    }
  }

  const q = search.trim();
  if (q) {
    rows = rows.filter((i) =>
      filterCatalogSearch(
        search,
        i.item_number,
        i.description,
        i.category,
        i.sub_category,
        i.sku,
        i.item_code
      )
    );
  }

  return rows;
}
