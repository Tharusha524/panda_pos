import { useCallback } from "react";
import useCurrentUser from "./useCurrentUser";

export type PosAccessKey =
  | "pos.dashboard"
  | "pos.sales"
  | "pos.payments"
  | "pos.expenses"
  | "pos.customers"
  | "pos.items"
  | "pos.inventory"
  | "pos.purchasing"
  | "pos.suppliers"
  | "pos.shipping"
  | "pos.offers"
  | "pos.repair"
  | "pos.reports"
  | "pos.settings"
  | "users.manage";

export function usePosAccess() {
  const { user, status } = useCurrentUser();
  const posAccess = (user as { pos_access?: Record<string, boolean> } | undefined)?.pos_access ?? {};
  const isAdmin = Boolean((user as { is_admin?: boolean } | undefined)?.is_admin);
  const canManageUsers = Boolean(
    (user as { can_manage_users?: boolean } | undefined)?.can_manage_users ?? isAdmin
  );

  const can = useCallback(
    (key: PosAccessKey): boolean => {
      if (isAdmin) return true;
      return Boolean(posAccess[key]);
    },
    [isAdmin, posAccess]
  );

  return { user, status, posAccess, isAdmin, canManageUsers, can };
}

export default usePosAccess;
