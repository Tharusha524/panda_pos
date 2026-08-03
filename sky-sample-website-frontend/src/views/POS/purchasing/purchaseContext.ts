import { createContext, useContext } from "react";
import type { PurchaseSession } from "./purchaseSessionTypes";

export const PurchaseContext = createContext<PurchaseSession | null>(null);

export function usePurchaseSession(): PurchaseSession {
  const ctx = useContext(PurchaseContext);
  if (!ctx) {
    throw new Error("usePurchaseSession must be used within PurchaseNewFormPage");
  }
  return ctx;
}
