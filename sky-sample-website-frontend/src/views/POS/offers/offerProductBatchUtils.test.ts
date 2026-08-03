import type { Item, ItemBatch } from "../../../api/itemsApi";
import {
  batchToOfferSelected,
  buildOfferCatalogRows,
  isProductIndeterminate,
  isProductSelected,
} from "./offerProductBatchUtils";

describe("offerProductBatchUtils", () => {
  const items = [
    { id: 1, item_number: "A001", location: "Branch", batch_count: 1, has_batches: true },
    { id: 2, item_number: "A001", location: "Main Location", batch_count: 2, has_batches: true },
    { id: 3, item_number: "B002", location: "Main Location", batch_count: 0, has_batches: false },
  ] as Item[];

  test("buildOfferCatalogRows merges by item_number", () => {
    const rows = buildOfferCatalogRows([
      ...items,
      { id: 9, item_number: "  ", location: "Main Location" } as Item,
    ]);
    expect(rows).toHaveLength(2);
    const a = rows.find((r) => r.item_number === "A001");
    expect(a?.allIds).toEqual([1, 2]);
    expect(a?.batch_count).toBe(3);
    expect(a?.location).toBe("Main Location");
  });

  test("isProductSelected checks product key or batch ids", () => {
    const row = buildOfferCatalogRows(items)[0];
    const batches = new Map<string, ItemBatch[]>([
      ["A001", [{ id: 99, item_number: "A001" } as unknown as ItemBatch]],
    ]);
    expect(isProductSelected(row, new Set(["A001"]), new Set(), batches)).toBe(true);
    expect(isProductSelected(row, new Set(), new Set([99]), batches)).toBe(true);
    expect(isProductSelected(row, new Set(), new Set(), batches)).toBe(false);
  });

  test("isProductIndeterminate when partial batches selected", () => {
    const row = buildOfferCatalogRows(items)[0];
    const batches = new Map<string, ItemBatch[]>([
      [
        "A001",
        [
          { id: 1 } as ItemBatch,
          { id: 2 } as ItemBatch,
        ],
      ],
    ]);
    expect(isProductIndeterminate(row, new Set(), new Set([1]), batches)).toBe(true);
    expect(isProductIndeterminate(row, new Set(["A001"]), new Set([1]), batches)).toBe(false);
  });

  test("batchToOfferSelected maps fields", () => {
    const row = buildOfferCatalogRows(items)[0];
    const batch = {
      id: 5,
      batch_number: "B1",
      location: "Main Location",
      qty: 10,
      purchase_price: 1,
      selling_price: 2,
      expiry_date: "2026-12-01",
      item_id: 2,
    } as ItemBatch;
    expect(batchToOfferSelected(batch, row)).toMatchObject({
      id: 5,
      item_number: "A001",
      item_id: 2,
    });
  });
});
