import type { PurchaseLineItem, PurchasePayload } from "../../../api/purchasesApi";
import type { Supplier } from "../../../api/suppliersApi";
import { DEFAULT_PURCHASE_TYPE, WALK_IN_SUPPLIER_LABEL } from "./purchaseConstants";
import { supplierDisplayName } from "./PurchaseSupplierSelectArea";

export const PURCHASES_BASE = "/purchasing";

export function localDateInputValue(date = new Date()): string {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export function emptyPurchaseForm(): PurchasePayload {
  return {
    purchase_type: DEFAULT_PURCHASE_TYPE,
    location: "Main Location",
    purchase_date: localDateInputValue(),
    invoice_id: "",
    supplier_id: null,
    supplier_name: WALK_IN_SUPPLIER_LABEL,
    sub_total: 0,
    discount: 0,
    amount: 0,
    net_terms: "30 Days",
    payment_method: "Cash",
    bank_id: null,
    cheque_number: null,
    notes: "",
  };
}

export function resolvePurchaseSupplierName(
  form: Pick<PurchasePayload, "supplier_id" | "supplier_name">,
  suppliers: Supplier[]
): string {
  const trimmed = form.supplier_name?.trim();
  if (trimmed) return trimmed;
  if (form.supplier_id != null) {
    const supplier = suppliers.find((s) => s.id === form.supplier_id);
    if (supplier) return supplierDisplayName(supplier);
  }
  return "";
}

export function formatPurchaseRs(amount: number): string {
  return `Rs ${amount.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPurchasePricePerUom(price: number, uom?: string | null): string {
  const label = (uom?.trim().toLowerCase() || "pcs");
  return `${formatPurchaseRs(price)} / ${label}`;
}

export function buildPurchaseSavePayload(
  form: PurchasePayload,
  lines: PurchaseLineItem[],
  options: {
    location: string;
    amount: number;
    subTotal: number;
    supplierName: string;
    banks: { id: number; name: string }[];
    savingReturn?: boolean;
    returnedFromPurchaseId?: number | null;
  }
): PurchasePayload {
  const paymentMethod = form.payment_method ?? "Cash";
  const isCheque = paymentMethod === "Cheque";

  return {
    purchase_type: form.purchase_type,
    location: options.location,
    purchase_date: form.purchase_date,
    invoice_id: form.invoice_id,
    supplier_id: form.supplier_id != null && form.supplier_id > 0 ? form.supplier_id : null,
    supplier_name: options.supplierName,
    sub_total: options.subTotal,
    discount: form.discount ?? 0,
    amount: options.amount,
    net_terms: form.net_terms ?? null,
    payment_method: paymentMethod,
    bank_id: isCheque && form.bank_id ? form.bank_id : null,
    cheque_number: isCheque ? form.cheque_number?.trim() || null : null,
    notes: form.notes ?? null,
    items: lines,
    ...(options.savingReturn && options.returnedFromPurchaseId
      ? { returned_from_purchase_id: options.returnedFromPurchaseId }
      : {}),
  };
}
