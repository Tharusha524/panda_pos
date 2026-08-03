import { emptySaleForm, formatSaleRs, localDateInputValue } from "./saleFormUtils";

describe("saleFormUtils", () => {
  test("localDateInputValue returns YYYY-MM-DD", () => {
    const value = localDateInputValue(new Date("2026-07-07T12:00:00"));
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("emptySaleForm has POS defaults", () => {
    const form = emptySaleForm();
    expect(form.payment_method).toBe("Cash");
    expect(form.location).toBe("Main Location");
    expect(form.net_amount).toBe(0);
  });

  test("formatSaleRs formats LKR", () => {
    expect(formatSaleRs(1500)).toContain("Rs");
    expect(formatSaleRs(1500)).toContain("1,500.00");
  });
});
