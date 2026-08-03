import { emptyShipmentForm, formatShippingRs } from "./shippingFormUtils";

describe("shippingFormUtils", () => {
  test("emptyShipmentForm defaults", () => {
    const form = emptyShipmentForm();
    expect(form.status).toBe("Pending");
    expect(form.location).toBe("Main Location");
    expect(form.freight_cost).toBe(0);
  });

  test("formatShippingRs", () => {
    expect(formatShippingRs(1200)).toBe("Rs 1,200.00");
  });
});
