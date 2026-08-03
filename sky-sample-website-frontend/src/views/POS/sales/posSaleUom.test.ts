import {
  formatPricePerUom,
  formatStockQty,
  formatUomLabel,
  isDecimalUom,
  normalizeUom,
  parsePosCatalogSearch,
  parseSaleLineQty,
  qtyInputPropsForUom,
  qtyStepForUom,
  roundSaleQty,
} from "./posSaleUom";

describe("posSaleUom", () => {
  test("normalizeUom defaults to pcs", () => {
    expect(normalizeUom(null)).toBe("pcs");
    expect(formatUomLabel(" KG ")).toBe("kg");
  });

  test("decimal uom helpers", () => {
    expect(isDecimalUom("kg")).toBe(true);
    expect(isDecimalUom("pcs")).toBe(false);
    expect(qtyStepForUom("g")).toBe(10);
    expect(qtyStepForUom("kg")).toBe(0.1);
    expect(qtyStepForUom("pcs")).toBe(1);
  });

  test("formatStockQty and price per uom", () => {
    expect(formatStockQty(3, "pcs")).toBe("3 pcs");
    expect(formatStockQty(1.5, "kg")).toBe("1.50 kg");
    expect(formatPricePerUom(100, "kg")).toContain("Rs");
  });

  test("parsePosCatalogSearch", () => {
    expect(parsePosCatalogSearch("")).toEqual({ term: "", qty: null });
    expect(parsePosCatalogSearch("rice*5")).toEqual({ term: "rice", qty: 5 });
    expect(parsePosCatalogSearch("rice x 2.5")).toEqual({ term: "rice", qty: 2.5 });
    expect(parsePosCatalogSearch("plain")).toEqual({ term: "plain", qty: null });
  });

  test("qty input props and line qty parsing", () => {
    expect(qtyInputPropsForUom("kg")).toEqual({ min: 0, step: "0.01" });
    expect(qtyInputPropsForUom("ml")).toEqual({ min: 0, step: "1" });
    expect(parseSaleLineQty(0)).toBeNull();
    expect(parseSaleLineQty(1.234)).toBe(1.23);
    expect(roundSaleQty(0)).toBe(0.01);
  });
});
