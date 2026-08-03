/** Default units when item settings have not loaded yet. */
export const DEFAULT_UOM_OPTIONS = ["pcs", "kg", "g", "l", "ml", "box", "pack", "dozen"] as const;

export function normalizeUomInput(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, "");
}

export function isValidUomCode(value: string): boolean {
  return /^[a-z0-9._-]{1,20}$/.test(value);
}
