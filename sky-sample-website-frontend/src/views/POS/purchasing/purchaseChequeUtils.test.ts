import { buildPurchaseChequeNotes, resolveBankName } from "./purchaseChequeUtils";

describe("purchaseChequeUtils", () => {
  test("resolveBankName finds bank by id", () => {
    const banks = [
      { id: 1, name: "BOC" },
      { id: 2, name: "HNB" },
    ] as Parameters<typeof resolveBankName>[0];

    expect(resolveBankName(banks, 2)).toBe("HNB");
    expect(resolveBankName(banks, null)).toBe("");
    expect(resolveBankName(banks, 99)).toBe("");
  });

  test("buildPurchaseChequeNotes combines cheque and notes", () => {
    expect(buildPurchaseChequeNotes("12345", "BOC")).toBe("Cheque 12345 — BOC");
    expect(buildPurchaseChequeNotes("12345", "BOC", "Urgent")).toBe(
      "Cheque 12345 — BOC\nUrgent"
    );
  });
});
