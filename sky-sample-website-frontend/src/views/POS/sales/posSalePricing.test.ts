import {
  applySalesTypeToLines,
  getPosItemUnitPrice,
  isWholesaleSalesType,
  pricingModeFromSalesType,
  saleUnitPriceLabel,
  wholeStockPrice,
} from "./posSalePricing";

describe("posSalePricing", () => {
  const item = {
    id: 1,
    selling_price: 100,
    wholesale_price: 80,
  } as Parameters<typeof getPosItemUnitPrice>[0];

  test("wholesale detection and pricing mode", () => {
    expect(isWholesaleSalesType("Wholesale")).toBe(true);
    expect(isWholesaleSalesType("Retail")).toBe(false);
    expect(pricingModeFromSalesType("Wholesale")).toBe("wholesale");
    expect(pricingModeFromSalesType("Retail")).toBe("retail");
  });

  test("getPosItemUnitPrice by sales type", () => {
    expect(getPosItemUnitPrice(item, "Retail")).toBe(100);
    expect(getPosItemUnitPrice(item, "Wholesale")).toBe(80);
    expect(saleUnitPriceLabel("Wholesale")).toBe("Wholesale price");
  });

  test("wholeStockPrice", () => {
    expect(wholeStockPrice(10, 5)).toBe(50);
    expect(wholeStockPrice(10, 0)).toBeNull();
    expect(wholeStockPrice(-1, 5)).toBeNull();
  });

  test("applySalesTypeToLines recalculates totals", () => {
    const lines = [
      {
        key: "1",
        item_id: 1,
        qty: 2,
        unit_price: 0,
        line_total: 0,
        item_batch_id: null,
      },
    ] as Parameters<typeof applySalesTypeToLines>[0];
    const updated = applySalesTypeToLines(lines, [item], "Retail");
    expect(updated[0].unit_price).toBe(100);
    expect(updated[0].line_total).toBe(200);
  });

  test("applySalesTypeToLines uses batch selling price for retail batch lines", () => {
    const lines = [
      {
        key: "1",
        item_id: 1,
        qty: 1,
        unit_price: 0,
        line_total: 0,
        item_batch_id: 9,
        batch_selling_price: 95,
      },
    ] as Parameters<typeof applySalesTypeToLines>[0];
    const updated = applySalesTypeToLines(lines, [item], "Retail");
    expect(updated[0].unit_price).toBe(95);
  });
});
