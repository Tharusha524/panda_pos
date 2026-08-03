import type { Item } from "../../../api/itemsApi";
import {
  findCatalogItem,
  formatAfterStock,
  formatAvailableStock,
  formatBuyingStock,
  purchaseAfterForLine,
  purchaseAvailableForLine,
  purchaseAvailableStock,
  purchaseCartQtyForItem,
  purchasePaymentEffectLabel,
  purchaseStockAfter,
  roundStock,
} from "./purchaseStockUtils";

describe("purchaseStockUtils", () => {
  const item = { id: 1, qty: 10, sellable_qty: 8, uom: "pcs" } as Item;

  test("roundStock and purchaseStockAfter", () => {
    expect(roundStock(1.006)).toBe(1.01);
    expect(purchaseStockAfter(5, 2)).toBe(7);
    expect(purchaseCartQtyForItem([], 1)).toBe(0);
  });

  test("line stock helpers", () => {
    const line = { item_id: 1, qty: 2 } as Parameters<typeof purchaseAvailableForLine>[1];
    expect(purchaseAvailableForLine([item], line)).toBe(8);
    expect(purchaseAfterForLine([item], line)).toBe(10);
    expect(purchaseAvailableStock(item)).toBe(8);
    expect(findCatalogItem([item], null)).toBeUndefined();
    expect(purchaseAvailableForLine([], line)).toBe(0);
  });

  test("format stock strings", () => {
    expect(formatAvailableStock(item)).toContain("8");
    expect(formatBuyingStock(2, "kg")).toContain("kg");
    expect(formatAfterStock(5, 2, "pcs")).toContain("7");
  });

  test("purchasePaymentEffectLabel for all methods", () => {
    expect(purchasePaymentEffectLabel("credit")).toContain("supplier payable");
    expect(purchasePaymentEffectLabel("cheque")).toContain("Cheque");
    expect(purchasePaymentEffectLabel("bank_transfer")).toContain("Bank transfer");
    expect(purchasePaymentEffectLabel("bank transfer")).toContain("Bank transfer");
    expect(purchasePaymentEffectLabel("card")).toContain("Card");
    expect(purchasePaymentEffectLabel("Cash")).toContain("Cash");
    expect(purchasePaymentEffectLabel(null)).toContain("Cash");
  });
});
