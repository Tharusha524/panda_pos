import type { Dispatch, SetStateAction } from "react";
import type { Item, ItemCategory } from "../../../api/itemsApi";
import type { Bank } from "../../../api/Settings/bankApi";
import type { Supplier } from "../../../api/suppliersApi";
import type { PurchasePayload } from "../../../api/purchasesApi";
import type { PurchaseLineDraft } from "./PurchaseLineItemsSection";
import type { PosPaymentMethod } from "../sales/posSaleConstants";
import type { PosCategoryTab } from "../sales/posSaleCatalogFilter";
import type { PosSubCategoryTab } from "../sales/PosSubCategoryTabs";

export type PurchaseView = "products" | "checkout";

export interface PurchaseSession {
  view: PurchaseView;
  setView: Dispatch<SetStateAction<PurchaseView>>;
  form: PurchasePayload;
  setForm: Dispatch<SetStateAction<PurchasePayload>>;
  setField: <K extends keyof PurchasePayload>(key: K, value: PurchasePayload[K]) => void;
  lines: PurchaseLineDraft[];
  setLines: Dispatch<SetStateAction<PurchaseLineDraft[]>>;
  errors: {
    invoice_id?: string;
    supplier_name?: string;
    purchase_date?: string;
    products?: string;
    expiry?: string;
    amount?: string;
    bank_id?: string;
    cheque_number?: string;
  };
  clearError: (
    key:
      | "invoice_id"
      | "supplier_name"
      | "purchase_date"
      | "products"
      | "expiry"
      | "amount"
      | "bank_id"
      | "cheque_number"
  ) => void;
  itemBranch: string;
  manageMultiple: boolean;
  suppliers: Supplier[];
  loadingSuppliers: boolean;
  banks: Bank[];
  loadingBanks: boolean;
  purchaseTypes: string[];
  paymentMethods: string[];
  linesSubTotal: number;
  computedAmount: number;
  purchaseAmount: number;
  setPurchaseAmount: (amount: number) => void;
  savePending: boolean;
  itemUomById: Map<number, string>;
  lineUom: (line: PurchaseLineDraft) => string;
  categories: ItemCategory[];
  loadingCategories: boolean;
  loadingItems: boolean;
  catalogItems: Item[];
  filteredItems: Item[];
  categoryTab: PosCategoryTab;
  subCategoryTab: PosSubCategoryTab;
  setSubCategoryTab: Dispatch<SetStateAction<PosSubCategoryTab>>;
  catalogSearch: string;
  setCatalogSearch: Dispatch<SetStateAction<string>>;
  parsedCatalogSearch: { term: string; qty: number | null };
  visibleSubCategories: { id: number; name: string }[];
  activeCategoryName: string;
  categoryTabLabel: string;
  handleCategoryTabChange: (tab: PosCategoryTab) => void;
  handleCatalogSearchSubmit: () => void;
  addItemToCart: (item: Item, addQty?: number) => void;
  setLineQty: (key: string, rawQty: number) => void;
  updateLineQty: (key: string, delta: number) => void;
  updateLinePrice: (key: string, unitPrice: number) => void;
  updateLineExpiry: (key: string, expiryDate: string | null) => void;
  removeLine: (key: string) => void;
  handlePaymentSelect: (method: PosPaymentMethod) => void;
  handleSubmit: () => void;
  goToCheckout: () => void;
  handlePrintInvoice: () => void;
  printInvoicePending: boolean;
  supplierDisplayName: (supplier: Supplier) => string;
}
