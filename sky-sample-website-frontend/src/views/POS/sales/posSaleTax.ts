import type { Item } from "../../../api/itemsApi";
import type { PosTaxSettings, VatRate } from "../../../api/Settings/taxSettingsApi";
import { formatVatRateLabel } from "../../../api/Settings/taxSettingsApi";

export interface SaleVatBreakdown {
  vatAmount: number;
  taxableAmount: number;
  vatRateId: number | null;
  vatLabel: string;
  applied: boolean;
}

function rateForItem(item: Item, rates: VatRate[], defaultRate: VatRate | null): VatRate | null {
  if (item.vat_rate_id != null) {
    return rates.find((r) => r.id === item.vat_rate_id) ?? defaultRate;
  }
  return defaultRate;
}

/** Exclusive VAT on taxable amount (after discounts, before VAT). */
export function calculateSaleVat(
  taxableAmount: number,
  tax: PosTaxSettings | undefined,
  catalogItems: Item[],
  lineItemIds: number[]
): SaleVatBreakdown {
  const empty: SaleVatBreakdown = {
    vatAmount: 0,
    taxableAmount: Math.max(0, taxableAmount),
    vatRateId: null,
    vatLabel: "",
    applied: false,
  };

  if (!tax?.allow_vat || tax.vat_type === "none" || taxableAmount <= 0) {
    return empty;
  }

  const defaultRate = tax.default_vat_rate ?? null;
  if (!defaultRate && tax.vat_rates.length === 0) {
    return empty;
  }

  if (tax.vat_type === "exclusive") {
    const lines = lineItemIds
      .map((id) => catalogItems.find((i) => i.id === id))
      .filter((i): i is Item => Boolean(i));

    if (lines.length === 0) {
      const rate = defaultRate ?? tax.vat_rates[0] ?? null;
      if (!rate) return empty;
      const vatAmount = Math.round(taxableAmount * (rate.vat_rate / 100) * 100) / 100;
      return {
        vatAmount,
        taxableAmount,
        vatRateId: rate.id,
        vatLabel: formatVatRateLabel(rate),
        applied: true,
      };
    }

    let vatTotal = 0;
    let primaryRate: VatRate | null = null;
    const share = taxableAmount / lines.length;

    for (const item of lines) {
      const rate = rateForItem(item, tax.vat_rates, defaultRate);
      if (!rate) continue;
      if (!primaryRate) primaryRate = rate;
      vatTotal += share * (rate.vat_rate / 100);
    }

    vatTotal = Math.round(vatTotal * 100) / 100;
    const rate = primaryRate ?? defaultRate;
    return {
      vatAmount: vatTotal,
      taxableAmount,
      vatRateId: rate?.id ?? null,
      vatLabel: rate ? formatVatRateLabel(rate) : "VAT",
      applied: vatTotal > 0 || Boolean(rate),
    };
  }

  return empty;
}

export function grandTotalWithVat(taxableAmount: number, vatAmount: number): number {
  return Math.round((taxableAmount + vatAmount) * 100) / 100;
}
