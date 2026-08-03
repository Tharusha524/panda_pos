import type { QueryClient } from "@tanstack/react-query";

/** Refresh POS screens after settings that affect sales, items, or receipts. */
export function invalidatePosRuntimeSettings(queryClient: QueryClient): void {
  const keys = [
    "sales-pos-context",
    "offers-applicable",
    "order-settings",
    "item-settings",
    "hardware-settings",
    "tax-settings",
    "inventory-settings",
    "items",
    "inventory-list",
    "sales-pos-items",
  ] as const;

  for (const key of keys) {
    queryClient.invalidateQueries({ queryKey: [key] });
  }
}
