import { emptyPaymentForm, formatPaymentRs } from "./paymentFormUtils";

describe("paymentFormUtils", () => {
  test("emptyPaymentForm defaults", () => {
    const form = emptyPaymentForm();
    expect(form.payment_method).toBe("Cash");
    expect(form.paid_amount).toBe(0);
    expect(form.location).toBe("Main Location");
  });

  test("formatPaymentRs", () => {
    expect(formatPaymentRs(99.5)).toBe("Rs 99.50");
  });
});
