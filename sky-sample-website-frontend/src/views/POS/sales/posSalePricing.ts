import type { Item } from "../../../api/itemsApi";
import type { PricingMode } from "../../../api/salesApi";
import type { SaleLineDraft } from "./SaleLineItemsSection";

export type PosSalesPriceMode = "Retail" | "Wholesale";

export function isWholesaleSalesType(salesType: string | undefined): boolean {
  return (salesType ?? "").toLowerCase().includes("wholesale");
}

export function pricingModeFromSalesType(salesType: string | undefined): PricingMode {
  return isWholesaleSalesType(salesType) ? "wholesale" : "retail";
}

export function getPosItemUnitPrice(item: Item, salesType: PosSalesPriceMode): number {
  if (salesType === "Wholesale") {
    return item.wholesale_price ?? item.selling_price ?? 0;
  }
  return item.selling_price ?? item.wholesale_price ?? 0;
}

export function saleUnitPriceLabel(salesType: PosSalesPriceMode): string {
  return salesType === "Wholesale" ? "Wholesale price" : "Retail price";
}

/** Total selling value for all stock on hand (unit price × stock qty). */
export function wholeStockPrice(unitPrice: number, stockQty?: number | null): number | null {
  if (stockQty == null || stockQty <= 0 || unitPrice < 0) {
    return null;
  }
  return Math.round(unitPrice * stockQty * 100) / 100;
}

/** Unit price for an existing cart line when switching retail / wholesale. */
function unitPriceForCartLine(
  item: Item,
  salesType: PosSalesPriceMode,
  line: SaleLineDraft
): number {
  if (salesType === "Wholesale" || line.item_batch_id == null) {
    return getPosItemUnitPrice(item, salesType);
  }
  return line.batch_selling_price ?? item.selling_price ?? item.wholesale_price ?? 0;
}

export function applySalesTypeToLines(
  lines: SaleLineDraft[],
  catalogItems: Item[],
  salesType: PosSalesPriceMode
): SaleLineDraft[] {
  return lines.map((line) => {
    const item = catalogItems.find((i) => i.id === line.item_id);
    let unitPrice = line.unit_price;
    if (item) {
      unitPrice = unitPriceForCartLine(item, salesType, line);
    }
    return {
      ...line,
      unit_price: unitPrice,
      line_total: Math.round(line.qty * unitPrice * 100) / 100,
    };
  });
}
