import {
  batchQtyTotal,
  expiryChipColor,
  expiryChipLabel,
  expiryFieldsForBranchRow,
  expiryFieldsForSaleBranch,
  expiredBatchQtyTotal,
  filterItemsByExpiry,
  formatExpiryDate,
  formatItemQty,
  groupBatchesForWriteOff,
  isBatchExpired,
  isItemExpired,
  isItemExpiringSoon,
  isStockOversold,
  itemExpiredStockQty,
  itemSellableQty,
  nextSellableBatchExpiry,
  parseExpiryDateOnly,
  resolveItemExpiry,
  stockOversoldQty,
  stockQtyOnHand,
  unbatchedStockQty,
  writeOffBatchCategory,
} from "./itemInventoryUtils";

describe("itemInventoryUtils", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-07-07T12:00:00"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("stock helpers", () => {
    expect(stockQtyOnHand(-5)).toBe(0);
    expect(itemSellableQty({ qty: 100, sellable_qty: null, expired_stock_qty: 20 })).toBe(80);
    expect(itemExpiredStockQty({ expired_stock_qty: 3, has_expired_stock: true })).toBe(3);
    expect(stockOversoldQty(-3)).toBe(3);
    expect(isStockOversold(-1)).toBe(true);
  });

  test("parseExpiryDateOnly and formatExpiryDate", () => {
    expect(parseExpiryDateOnly("2026-07-15")?.getDate()).toBe(15);
    expect(formatExpiryDate(null)).toBe("—");
    expect(formatExpiryDate("2026-07-15")).toContain("2026");
  });

  test("resolveItemExpiry statuses", () => {
    const expired = resolveItemExpiry({ nearest_expiry_date: "2026-01-01" });
    expect(expired.status).toBe("expired");

    const soon = resolveItemExpiry({ nearest_expiry_date: "2026-07-10" });
    expect(soon.status).toBe("expiring_soon");

    const ok = resolveItemExpiry({ nearest_expiry_date: "2026-12-01" });
    expect(ok.status).toBe("ok");

    expect(resolveItemExpiry({})).toEqual({
      status: "none",
      date: null,
      daysRemaining: null,
    });
  });

  test("isItemExpired and isItemExpiringSoon", () => {
    expect(isItemExpired({ nearest_expiry_date: "2026-01-01" })).toBe(true);
    expect(isItemExpiringSoon({ nearest_expiry_date: "2026-07-10" })).toBe(true);
  });

  test("batch expiry helpers", () => {
    expect(isBatchExpired({ expiry_date: "2026-01-01" })).toBe(true);
    expect(expiredBatchQtyTotal([{ qty: 5, expiry_date: "2026-01-01" }])).toBe(5);
    expect(nextSellableBatchExpiry([{ qty: 1, expiry_date: "2026-12-01" }])).toBe("2026-12-01");
    expect(writeOffBatchCategory({ expiry_date: "2026-01-01" })).toBe("expired");
    expect(writeOffBatchCategory({})).toBe("normal");
  });

  test("groupBatchesForWriteOff and qty totals", () => {
    const grouped = groupBatchesForWriteOff([
      { qty: 1, expiry_date: "2026-01-01" },
      { qty: 2, expiry_date: "2026-12-01" },
      { qty: 3 },
    ]);
    expect(grouped.expired).toHaveLength(1);
    expect(grouped.validExpiry).toHaveLength(1);
    expect(grouped.normal).toHaveLength(1);
    expect(batchQtyTotal([{ qty: 2 }, { qty: 3 }])).toBe(5);
    expect(unbatchedStockQty(10, [{ qty: 4 }])).toBe(6);
  });

  test("expiry fields and filters", () => {
    const item = {
      nearest_expiry_date: "2026-12-01",
      expiry_date: null,
      expiry_status: "ok" as const,
      expiry_days_remaining: 100,
      location: "Main Location",
      qty: 5,
    };
    expect(expiryFieldsForBranchRow(item as never).expiry_status).toBe("ok");
    expect(
      expiryFieldsForSaleBranch(
        [
          item as never,
          { ...item, location: "Branch", qty: 0 } as never,
        ],
        "Main Location"
      ).nearest_expiry_date
    ).toBe("2026-12-01");

    const items = [
      { nearest_expiry_date: "2026-01-01" },
      { nearest_expiry_date: "2026-07-10" },
      {},
    ] as never[];
    expect(filterItemsByExpiry(items, "all")).toHaveLength(3);
    expect(filterItemsByExpiry(items, "expired")).toHaveLength(1);
    expect(filterItemsByExpiry(items, "expiring_soon")).toHaveLength(1);
  });

  test("expiryChipLabel variants", () => {
    expect(expiryChipLabel({})).toBe("No expiry");
    expect(expiryChipLabel({ nearest_expiry_date: "2026-01-01" })).toContain("Expired");
    expect(expiryChipLabel({ nearest_expiry_date: "2026-12-01" })).toContain("d)");
    expect(expiryChipLabel({ nearest_expiry_date: "2026-07-07" })).toContain("Today");
    expect(expiryChipColor("expired")).toBe("error");
    expect(expiryChipColor("expiring_soon")).toBe("warning");
    expect(expiryChipColor("ok")).toBe("success");
    expect(expiryChipColor("unknown" as never)).toBe("default");
    expect(
      expiryChipLabel({
        nearest_expiry_date: "bad",
        expiry_status: "expiring_soon",
        expiry_days_remaining: null,
      })
    ).toContain("bad");
  });

  test("formatItemQty and resolveItemExpiry fallback", () => {
    expect(formatItemQty(2, "pcs")).toContain("2");
    const fallback = resolveItemExpiry({
      nearest_expiry_date: "bad-date",
      expiry_status: "expired",
      expiry_days_remaining: 1,
    });
    expect(fallback.status).toBe("expired");
  });

  test("expiryFieldsForSaleBranch falls back through group rows", () => {
    const fields = expiryFieldsForSaleBranch(
      [{ nearest_expiry_date: "2026-12-01", location: "Other", qty: 0 } as never],
      "Missing Branch"
    );
    expect(fields.nearest_expiry_date).toBe("2026-12-01");
  });

  test("batch sort and next expiry edge cases", () => {
    expect(nextSellableBatchExpiry([{ qty: 1, expiry_date: "2020-01-01" }])).toBeNull();
    expect(
      nextSellableBatchExpiry([
        { qty: 1, expiry_date: "2026-12-01" },
        { qty: 1, expiry_date: "2026-10-01" },
      ])
    ).toBe("2026-10-01");
    const grouped = groupBatchesForWriteOff([
      { qty: 1, expiry_date: "2026-02-01" },
      { qty: 1, expiry_date: "2026-01-01" },
    ]);
    expect(grouped.expired[0].expiry_date).toBe("2026-01-01");
    expect(groupBatchesForWriteOff([{ qty: 0, expiry_date: "2026-01-01" }]).expired).toHaveLength(0);
  });
});
