/** Auto-refresh interval for transaction lists and dashboard (ms). */
export const LIVE_REFETCH_MS = 12_000;

/** Query key prefixes refreshed after POS mutations. */
export const POS_LIVE_QUERY_KEYS = [
  "pos-dashboard",
  "system-alerts",
  "sales",
  "purchases",
  "payments",
  "expenses",
  "shipments",
  "items",
  "inventory-list",
  "inventory-dashboard",
  "customers",
  "suppliers",
  "offers",
  "repairs",
  "repair-context",
] as const;
