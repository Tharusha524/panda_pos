import type { CompanyPrintHeader } from "../../../api/Settings/companySettingsApi";
import { getCompanyPrintHeader } from "../../../api/Settings/companySettingsApi";
import type { HardwareSettings } from "../../../api/Settings/hardwareSettingsApi";
import { getHardwareSettings } from "../../../api/Settings/hardwareSettingsApi";
import type { Purchase, PurchaseLineItem } from "../../../api/purchasesApi";
import { getPurchase } from "../../../api/purchasesApi";
import type { SaleReceiptLabels } from "../../../api/salesApi";
import { printSaleReceipt, type SaleReceiptData } from "../sales/saleReceiptPrint";
import { WALK_IN_SUPPLIER_LABEL } from "./purchaseConstants";

type PurchasePrintLine = {
  item_number: string | null;
  description: string;
  qty: number;
  unit_price: number;
  line_total: number;
};

const PURCHASE_RECEIPT_LABELS: Partial<SaleReceiptLabels> = {
  receipt_title: "PURCHASE INVOICE",
  sales_id: "Invoice No",
  customer: "Supplier",
  thank_you: "Thank you for your business",
};

function normalizePurchaseLines(purchase: Purchase): PurchasePrintLine[] {
  if (purchase.items?.length) {
    return purchase.items.map((line) => ({
      item_number: line.item_number,
      description: line.description,
      qty: Number(line.qty ?? 0),
      unit_price: Number(line.unit_price ?? 0),
      line_total: Number(line.line_total ?? line.qty * line.unit_price),
    }));
  }

  if (purchase.details?.length) {
    return purchase.details.map((line) => ({
      item_number: line.item_number ?? null,
      description: line.description ?? "—",
      qty: Number(line.qty ?? 0),
      unit_price: Number(line.unit_price ?? 0),
      line_total: Number(line.amount ?? line.qty * line.unit_price),
    }));
  }

  return [];
}

function purchasePaymentLabel(purchase: Purchase): string {
  const method = purchase.payment_method ?? "Cash";
  if (purchase.net_terms && purchase.net_terms !== "Cash" && method === "Credit") {
    return `${method} · ${purchase.net_terms}`;
  }
  return method;
}

function purchaseToSaleReceiptData(purchase: Purchase): SaleReceiptData {
  return {
    sales_id: purchase.invoice_id,
    sale_date: purchase.purchase_datetime ?? purchase.purchase_date,
    customer_name: purchase.supplier_name?.trim() || WALK_IN_SUPPLIER_LABEL,
    location: purchase.location ?? "Main Location",
    payment_method: purchasePaymentLabel(purchase),
    sub_total: purchase.sub_total ?? 0,
    discount: purchase.discount ?? 0,
    net_amount: purchase.amount ?? 0,
    cheque_number: purchase.cheque_number ?? null,
    lines: normalizePurchaseLines(purchase).map((line) => ({
      item_number: line.item_number,
      description: line.description,
      qty: line.qty,
      unit_price: line.unit_price,
      line_total: line.line_total,
    })),
  };
}

function purchaseHardwareOverrides(hardware: HardwareSettings): HardwareSettings {
  return {
    ...hardware,
    allow_customer_details_on_sales_receipt: true,
    allow_discount_on_sales_receipt: true,
  };
}

export function printPurchaseInvoice(
  purchase: Purchase,
  header: CompanyPrintHeader,
  hardware?: HardwareSettings
): void {
  printSaleReceipt(header, purchaseToSaleReceiptData(purchase), {
    labels: PURCHASE_RECEIPT_LABELS,
    hardware: hardware ? purchaseHardwareOverrides(hardware) : undefined,
  });
}

/** @deprecated Use printPurchaseInvoice */
export function printPurchaseReceipt(purchase: Purchase): void {
  void printPurchaseInvoiceAsync(purchase);
}

export async function printPurchaseInvoiceAsync(
  purchaseOrId: Purchase | number
): Promise<void> {
  const [header, hardware, purchase] = await Promise.all([
    getCompanyPrintHeader(),
    getHardwareSettings(),
    typeof purchaseOrId === "number" ? getPurchase(purchaseOrId) : Promise.resolve(purchaseOrId),
  ]);
  printPurchaseInvoice(purchase, header, hardware);
}

export function buildDraftPurchaseInvoice(
  purchase: Omit<Purchase, "id"> & { id?: number },
  items: PurchaseLineItem[]
): Purchase {
  return {
    id: purchase.id ?? 0,
    purchase_type: purchase.purchase_type,
    location: purchase.location,
    purchase_date: purchase.purchase_date,
    purchase_datetime: purchase.purchase_datetime,
    invoice_id: purchase.invoice_id,
    supplier_id: purchase.supplier_id ?? null,
    supplier_name: purchase.supplier_name?.trim() || WALK_IN_SUPPLIER_LABEL,
    sub_total: purchase.sub_total ?? 0,
    discount: purchase.discount ?? 0,
    amount: purchase.amount ?? 0,
    payment_method: purchase.payment_method,
    bank_id: purchase.bank_id,
    cheque_number: purchase.cheque_number,
    net_terms: purchase.net_terms ?? null,
    notes: purchase.notes,
    items,
  };
}
