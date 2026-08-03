import { createContext, useContext } from "react";
import type { PosSaleSession } from "./posSaleSessionTypes";

export const PosSaleContext = createContext<PosSaleSession | null>(null);

export function usePosSale(): PosSaleSession {
  const ctx = useContext(PosSaleContext);
  if (!ctx) {
    throw new Error("usePosSale must be used within PosSaleFormPage");
  }
  return ctx;
}
