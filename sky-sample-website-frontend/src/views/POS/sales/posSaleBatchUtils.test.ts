import type { Item, ItemBatch } from "../../../api/itemsApi";
import {
  availableBatchesAtBranch,
  batchSellingPrice,
  cartLineBatchKey,
  maxQtyForCartLine,
  normalizeBranchLocation,
  unitPriceForBatchSale,
} from "./posSaleBatchUtils";

describe("posSaleBatchUtils", () => {
  const item = { id: 1, selling_price: 100, wholesale_price: 80 } as Item;

  test("normalizeBranchLocation and cartLineBatchKey", () => {
    expect(normalizeBranchLocation("")).toBe("Main Location");
    expect(cartLineBatchKey(1, 5)).toBe("1:5");
  });

  test("availableBatchesAtBranch sorts batches without expiry by id", () => {
    const batches = [
      { id: 5, location: "Main Location", qty: 1, expiry_date: null },
      { id: 2, location: "Main Location", qty: 1, expiry_date: null },
    ] as ItemBatch[];
    expect(availableBatchesAtBranch(batches, "Main Location").map((b) => b.id)).toEqual([2, 5]);
  });

  test("availableBatchesAtBranch puts dated batches before undated", () => {
    const batches = [
      { id: 1, location: "Main Location", qty: 1, expiry_date: null },
      { id: 2, location: "Main Location", qty: 1, expiry_date: "2026-12-01" },
    ] as ItemBatch[];
    expect(availableBatchesAtBranch(batches, "Main Location")[0].id).toBe(2);
  });

  test("availableBatchesAtBranch sorts by expiry", () => {
    const batches = [
      { id: 1, location: "Main Location", qty: 5, expiry_date: "2026-12-01" },
      { id: 2, location: "Main Location", qty: 3, expiry_date: "2026-10-01" },
      { id: 3, location: "Main Location", qty: 1, expiry_date: null },
      { id: 4, location: "Main Location", qty: 2, expiry_date: "2026-11-01" },
    ] as ItemBatch[];
    const result = availableBatchesAtBranch(batches, "Main Location");
    expect(result[0].id).toBe(2);
    expect(result[result.length - 1].id).toBe(3);
  });

  test("availableBatchesAtBranch can include expired", () => {
    const batches = [
      { id: 1, location: "Main Location", qty: 1, expiry_date: "2020-01-01" },
    ] as ItemBatch[];
    expect(availableBatchesAtBranch(batches, "Main Location")).toHaveLength(0);
    expect(availableBatchesAtBranch(batches, "Main Location", { includeExpired: true })).toHaveLength(1);
  });

  test("batchSellingPrice and unitPriceForBatchSale", () => {
    const batch = { selling_price: 90 } as ItemBatch;
    expect(batchSellingPrice(batch, item)).toBe(90);
    expect(unitPriceForBatchSale(item, "Retail", batch)).toBe(90);
    expect(unitPriceForBatchSale(item, "Wholesale", batch)).toBe(80);
    expect(unitPriceForBatchSale(item, "Retail", null)).toBe(100);
  });

  test("maxQtyForCartLine respects batch stock", () => {
    const lines = [
      { key: "a", item_batch_id: 9, batch_stock_qty: 10, qty: 4 },
      { key: "b", item_batch_id: 9, batch_stock_qty: 10, qty: 3 },
    ] as Parameters<typeof maxQtyForCartLine>[1];
    expect(maxQtyForCartLine(lines[0], lines, 100)).toBe(7);
    expect(maxQtyForCartLine(lines[1], lines, 100)).toBe(6);
    expect(maxQtyForCartLine({ key: "c", qty: 1 } as never, [], 50)).toBe(50);
  });
});
