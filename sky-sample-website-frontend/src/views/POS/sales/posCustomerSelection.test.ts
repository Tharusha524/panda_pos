import {
  buildPosSaleUrl,
  POS_SELECTED_CUSTOMER_KEY,
  readPosSelectedCustomer,
  savePosSelectedCustomer,
} from "./posCustomerSelection";

describe("posCustomerSelection", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  test("buildPosSaleUrl with and without customer", () => {
    expect(buildPosSaleUrl()).toBe("/sales/new");
    expect(buildPosSaleUrl(42)).toBe("/sales/new?customerId=42");
  });

  test("save and read selected customer", () => {
    savePosSelectedCustomer({
      id: 5,
      customer_name: "John Doe",
    } as Parameters<typeof savePosSelectedCustomer>[0]);

    const snapshot = readPosSelectedCustomer();
    expect(snapshot?.id).toBe(5);
    expect(snapshot?.name).toBe("John Doe");
    expect(sessionStorage.getItem(POS_SELECTED_CUSTOMER_KEY)).toBeTruthy();
  });

  test("clear customer snapshot", () => {
    savePosSelectedCustomer(null);
    expect(readPosSelectedCustomer()?.id).toBeNull();
  });

  test("readPosSelectedCustomer returns null when missing", () => {
    expect(readPosSelectedCustomer()).toBeNull();
  });

  test("readPosSelectedCustomer returns null on invalid json", () => {
    sessionStorage.setItem(POS_SELECTED_CUSTOMER_KEY, "{bad");
    expect(readPosSelectedCustomer()).toBeNull();
  });
});
