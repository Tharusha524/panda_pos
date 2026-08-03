import { emptyExpenseForm, formatExpenseRs } from "./expenseFormUtils";

describe("expenseFormUtils", () => {
  test("emptyExpenseForm defaults", () => {
    const form = emptyExpenseForm();
    expect(form.payment_method).toBe("Cash");
    expect(form.status).toBe("Approved");
    expect(form.amount).toBe(0);
  });

  test("formatExpenseRs", () => {
    expect(formatExpenseRs(250)).toBe("Rs 250.00");
  });
});
