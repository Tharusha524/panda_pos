import { emptyPurchaseForm, formatPurchasePricePerUom, formatPurchaseRs, localDateInputValue, resolvePurchaseSupplierName } from "./purchaseFormUtils";

jest.mock("./PurchaseSupplierSelectArea", () => ({
  supplierDisplayName: (s: { supplier_name?: string }) => s.supplier_name ?? "Supplier",
}));

describe("purchaseFormUtils", () => {
  test("emptyPurchaseForm defaults", () => {
    const form = emptyPurchaseForm();
    expect(form.payment_method).toBe("Cash");
    expect(form.supplier_name).toBeTruthy();
    expect(form.net_terms).toBe("30 Days");
  });

  test("localDateInputValue format", () => {
    expect(localDateInputValue(new Date("2026-01-15T00:00:00"))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("resolvePurchaseSupplierName prefers form name", () => {
    expect(
      resolvePurchaseSupplierName({ supplier_id: 1, supplier_name: "  ACME  " }, [])
    ).toBe("ACME");
  });

  test("resolvePurchaseSupplierName looks up supplier list", () => {
    expect(
      resolvePurchaseSupplierName(
        { supplier_id: 2, supplier_name: "" },
        [{ id: 2, supplier_name: "From List" } as never]
      )
    ).toBe("From List");
  });

  test("resolvePurchaseSupplierName returns empty when unresolved", () => {
    expect(resolvePurchaseSupplierName({ supplier_id: 99, supplier_name: "" }, [])).toBe("");
  });

  test("format helpers", () => {
    expect(formatPurchaseRs(10)).toBe("Rs 10.00");
    expect(formatPurchasePricePerUom(5, "Kg")).toContain("/ kg");
    expect(formatPurchasePricePerUom(5)).toContain("/ pcs");
  });
});
