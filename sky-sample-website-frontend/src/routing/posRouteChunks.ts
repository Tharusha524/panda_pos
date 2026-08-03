/** Shared dynamic imports for POS routes — used by React.lazy and prefetch. */

export const loadPosDashboard = () => import("../views/POS/Dashboard");
export const loadPosSales = () => import("../views/POS/Sales");
export const loadPosPayments = () => import("../views/POS/Payments");
export const loadPosExpenses = () => import("../views/POS/Expenses");
export const loadPosCustomers = () => import("../views/POS/Customers");
export const loadPosItems = () => import("../views/POS/Items");
export const loadPosInventory = () => import("../views/POS/Inventory");
export const loadPosPurchasing = () => import("../views/POS/Purchasing");
export const loadPosSuppliers = () => import("../views/POS/Suppliers");
export const loadPosShipping = () => import("../views/POS/Shipping");
export const loadPosOffers = () => import("../views/POS/Offers");
export const loadPosRepair = () => import("../views/POS/Repair");
export const loadPosReports = () => import("../views/POS/Reports/index");
export const loadPosSettings = () => import("../views/POS/Settings/index");

const POS_ROUTE_LOADERS: Array<{ prefix: string; load: () => Promise<unknown> }> = [
  { prefix: "/dashboard", load: loadPosDashboard },
  { prefix: "/sales", load: loadPosSales },
  { prefix: "/payments", load: loadPosPayments },
  { prefix: "/expenses", load: loadPosExpenses },
  { prefix: "/customers", load: loadPosCustomers },
  { prefix: "/items", load: loadPosItems },
  { prefix: "/inventory", load: loadPosInventory },
  { prefix: "/purchasing", load: loadPosPurchasing },
  { prefix: "/suppliers", load: loadPosSuppliers },
  { prefix: "/shipping", load: loadPosShipping },
  { prefix: "/offers", load: loadPosOffers },
  { prefix: "/repair", load: loadPosRepair },
  { prefix: "/reports", load: loadPosReports },
  { prefix: "/settings", load: loadPosSettings },
];

/** Prefetch the POS page chunk for a sidebar path (hover / focus). */
export function prefetchPosRouteForPath(pathname: string): void {
  const entry = POS_ROUTE_LOADERS.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  if (entry) {
    void entry.load();
  }
}

/** Warm all POS route chunks after login so sidebar navigation feels instant. */
export function prefetchAllPosRoutes(): void {
  POS_ROUTE_LOADERS.forEach(({ load }) => {
    void load();
  });
}
