import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { createPurchase, getNextInvoiceId, getPurchase, getPurchases, type Purchase } from "../../../api/purchasesApi";
import { getItemCategoriesByLocation, getItems, type Item } from "../../../api/itemsApi";
import { fetchBanks } from "../../../api/Settings/bankApi";
import { getSuppliers } from "../../../api/suppliersApi";
import { getFriendlyErrorMessage } from "../../../utils/getFriendlyErrorMessage";
import { invalidatePosQueries } from "../../../utils/invalidatePosQueries";
import { setActiveLocation } from "../../../utils/posActiveLocation";
import { useBranchLocations } from "../../../hooks/useBranchLocations";
import { DEFAULT_PURCHASE_TYPE, PURCHASE_TYPE_RETURN, canReturnPurchase, isReturnPurchase, purchaseReturnStatusLabel } from "./purchaseConstants";
import {
  buildDraftPurchaseInvoice,
  printPurchaseInvoiceAsync,
} from "./purchaseReceiptPrint";
import { emptyPurchaseForm, PURCHASES_BASE, resolvePurchaseSupplierName, buildPurchaseSavePayload } from "./purchaseFormUtils";
import {
  itemToLine,
  linesFromPurchase,
  linesToPayload,
  type PurchaseLineDraft,
} from "./PurchaseLineItemsSection";
import { supplierDisplayName } from "./PurchaseSupplierSelectArea";
import type { PosPaymentMethod } from "../sales/posSaleConstants";
import { buildPurchaseChequeNotes, resolveBankName } from "./purchaseChequeUtils";
import type { PurchasePayload } from "../../../api/purchasesApi";
import {
  parsePosCatalogSearch,
  qtyStepForUom,
  roundSaleQty,
} from "../sales/posSaleUom";
import {
  filterPosCatalogItems,
  subCategoriesForPosTab,
  type PosCategoryTab,
} from "../sales/posSaleCatalogFilter";
import type { PosSubCategoryTab } from "../sales/PosSubCategoryTabs";
import { PurchaseContext } from "./purchaseContext";
import type { PurchaseSession, PurchaseView } from "./purchaseSessionTypes";
import PurchaseProductSelectPage from "./PurchaseProductSelectPage";
import PurchaseCheckoutPage from "./PurchaseCheckoutPage";

function roundLine(n: number): number {
  return Math.round(n * 100) / 100;
}

const PurchaseNewFormPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const statePurchase = (location.state as { returnFromPurchase?: Purchase } | null)?.returnFromPurchase;
  const sourcePurchaseIdRef = useRef<number | null>(null);
  const loadedReturnSourceIdRef = useRef<number | null>(null);
  const [sourcePurchaseId, setSourcePurchaseId] = useState<number | null>(null);
  const [loadingReturnSource, setLoadingReturnSource] = useState(false);

  const [view, setView] = useState<PurchaseView>("products");
  const [form, setForm] = useState<PurchasePayload>(emptyPurchaseForm());
  const [lines, setLines] = useState<PurchaseLineDraft[]>([]);
  const [errors, setErrors] = useState<PurchaseSession["errors"]>({});
  const [printInvoicePending, setPrintInvoicePending] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState(0);
  const [categoryTab, setCategoryTab] = useState<PosCategoryTab>("all");
  const [subCategoryTab, setSubCategoryTab] = useState<PosSubCategoryTab>("all");
  const [catalogSearch, setCatalogSearch] = useState("");

  const { defaultLocation, manageMultiple } = useBranchLocations([], { branchesOnly: true });
  const itemBranch = form.location ?? defaultLocation;

  const { data: filterData } = useQuery({
    queryKey: ["purchases", "form-filters"],
    queryFn: () => getPurchases("all", "all"),
  });

  const purchaseTypes = filterData?.purchase_types ?? [DEFAULT_PURCHASE_TYPE];
  const paymentMethods = filterData?.payment_methods ?? ["Cash"];

  const { data: banks = [], isLoading: loadingBanks } = useQuery({
    queryKey: ["banks"],
    queryFn: fetchBanks,
  });

  const { data: suppliersData, isLoading: loadingSuppliers } = useQuery({
    queryKey: ["suppliers", "purchase", "all"],
    queryFn: () => getSuppliers("all"),
  });
  const suppliers = suppliersData?.suppliers ?? [];

  const { data: itemsData, isLoading: loadingItems } = useQuery({
    queryKey: ["items", "purchase-new", itemBranch],
    queryFn: () => getItems(undefined, itemBranch),
    enabled: Boolean(itemBranch) && itemBranch !== "all",
  });

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["item-categories", "purchase-new", itemBranch],
    queryFn: () => getItemCategoriesByLocation(itemBranch),
    enabled: Boolean(itemBranch) && itemBranch !== "all",
  });

  const catalogItems = useMemo(
    () => (itemsData?.items ?? []).filter((i) => i.is_active),
    [itemsData?.items]
  );

  const parsedCatalogSearch = useMemo(
    () => parsePosCatalogSearch(catalogSearch),
    [catalogSearch]
  );

  const visibleSubCategories = useMemo(
    () => subCategoriesForPosTab(categoryTab, categories),
    [categoryTab, categories]
  );

  const filteredItems = useMemo(
    () =>
      filterPosCatalogItems(
        catalogItems,
        categoryTab,
        categories,
        parsedCatalogSearch.term,
        subCategoryTab
      ),
    [catalogItems, categoryTab, categories, parsedCatalogSearch.term, subCategoryTab]
  );

  useEffect(() => {
    setCatalogSearch("");
    setSubCategoryTab("all");
  }, [categoryTab]);

  useEffect(() => {
    setCategoryTab("all");
    setSubCategoryTab("all");
    setCatalogSearch("");
  }, [itemBranch]);

  const handleCategoryTabChange = (tab: PosCategoryTab) => {
    setCategoryTab(tab);
    setSubCategoryTab("all");
  };

  const activeCategoryName =
    categoryTab === "all"
      ? "All"
      : categoryTab === "favourite"
        ? "Favourite"
        : categories.find((c) => c.id === categoryTab)?.name ?? "Category";

  const activeSubName =
    subCategoryTab === "all"
      ? null
      : visibleSubCategories.find((s) => s.id === subCategoryTab)?.name ?? null;

  const categoryTabLabel = activeSubName
    ? `${activeCategoryName} › ${activeSubName}`
    : activeCategoryName;

  const itemUomById = useMemo(() => {
    const map = new Map<number, string>();
    for (const item of itemsData?.items ?? []) {
      if (item.uom) map.set(item.id, item.uom);
    }
    return map;
  }, [itemsData?.items]);

  const lineUom = (line: PurchaseLineDraft) =>
    (line.item_id != null ? itemUomById.get(line.item_id) : null) ?? "pcs";

  const applyReturnFromPurchase = (full: Purchase) => {
    if (isReturnPurchase(full.purchase_type)) {
      enqueueSnackbar("This invoice is already a return", { variant: "warning" });
      return false;
    }
    if (full.has_return) {
      enqueueSnackbar("This invoice has been fully returned.", { variant: "warning" });
      return false;
    }
    const returnLines =
      full.remaining_return_items && full.remaining_return_items.length > 0
        ? full.remaining_return_items
        : full.has_partial_return || full.return_status === "partial"
          ? null
          : full.items;
    if (!returnLines?.length) {
      enqueueSnackbar(
        full.has_partial_return || full.return_status === "partial"
          ? "Could not load remaining return quantities. Please refresh and try again."
          : "Nothing left to return on this invoice.",
        { variant: "warning" }
      );
      return false;
    }
    sourcePurchaseIdRef.current = full.id;
    setSourcePurchaseId(full.id);
    setLines(linesFromPurchase(returnLines));
    setForm((prev) => ({
      ...prev,
      purchase_type: PURCHASE_TYPE_RETURN,
      supplier_id: full.supplier_id,
      supplier_name: full.supplier_name ?? prev.supplier_name ?? "",
      location: full.location,
      discount: full.discount ?? 0,
      payment_method: full.payment_method ?? "Cash",
      bank_id: full.bank_id ?? null,
      cheque_number: full.cheque_number ?? null,
      net_terms: full.net_terms,
      notes: `Return for invoice ${full.invoice_id}`,
    }));
    const totalRemaining = returnLines.reduce((sum, line) => sum + Number(line.qty ?? 0), 0);
    enqueueSnackbar(
      `Loaded ${returnLines.length} item(s) — ${totalRemaining} unit(s) remaining to return from ${full.invoice_id}`,
      { variant: "info" }
    );
    return true;
  };

  useEffect(() => {
    getNextInvoiceId()
      .then((invoiceId) => setForm((prev) => ({ ...prev, invoice_id: invoiceId })))
      .catch(() => {});
    setForm((prev) => ({ ...prev, location: prev.location || defaultLocation }));
  }, [defaultLocation]);

  useEffect(() => {
    if (searchParams.get("type") === "return" || searchParams.get("purchase_type") === PURCHASE_TYPE_RETURN) {
      setForm((prev) => ({ ...prev, purchase_type: PURCHASE_TYPE_RETURN }));
    }
  }, [searchParams]);

  useEffect(() => {
    const isReturn =
      searchParams.get("type") === "return" ||
      searchParams.get("purchase_type") === PURCHASE_TYPE_RETURN ||
      form.purchase_type === PURCHASE_TYPE_RETURN;
    if (!isReturn) return;

    const paramId = searchParams.get("sourcePurchaseId");
    const targetId = paramId ? Number(paramId) : statePurchase?.id ?? null;
    if (targetId == null || Number.isNaN(targetId)) return;
    if (loadedReturnSourceIdRef.current === targetId) return;

    const finishReturnNavigation = () => {
      if (searchParams.toString()) {
        setSearchParams({}, { replace: true });
      }
      if (statePurchase) {
        navigate(location.pathname + location.search, { replace: true, state: {} });
      }
    };

    const loadReturnSource = async () => {
      loadedReturnSourceIdRef.current = targetId;
      setLoadingReturnSource(true);
      try {
        const full = await getPurchase(targetId);
        if (isReturnPurchase(full.purchase_type)) {
          enqueueSnackbar("This invoice is already a return", { variant: "warning" });
          loadedReturnSourceIdRef.current = null;
          return;
        }
        if (!canReturnPurchase(full)) {
          enqueueSnackbar(
            full.has_return
              ? "This invoice has been fully returned."
              : "Nothing left to return on this invoice.",
            { variant: "warning" }
          );
          loadedReturnSourceIdRef.current = null;
          return;
        }
        applyReturnFromPurchase(full);
      } catch (err: unknown) {
        loadedReturnSourceIdRef.current = null;
        enqueueSnackbar(getFriendlyErrorMessage(err, "Could not load invoice"), {
          variant: "error",
        });
      } finally {
        setLoadingReturnSource(false);
        finishReturnNavigation();
      }
    };

    void loadReturnSource();
  }, [searchParams, statePurchase, form.purchase_type, enqueueSnackbar, navigate, location.pathname, location.search, setSearchParams]);

  useEffect(() => {
    if (form.location) setActiveLocation(form.location);
  }, [form.location]);

  const linesSubTotal = useMemo(
    () => lines.reduce((sum, l) => sum + (l.line_total || 0), 0),
    [lines]
  );

  useEffect(() => {
    if (lines.length > 0) {
      setForm((prev) => ({ ...prev, sub_total: roundLine(linesSubTotal) }));
    }
  }, [linesSubTotal, lines.length]);

  const computedAmount = useMemo(() => {
    const sub = lines.length > 0 ? linesSubTotal : Number(form.sub_total) || 0;
    const disc = Number(form.discount) || 0;
    return Math.max(0, sub - disc);
  }, [linesSubTotal, lines.length, form.sub_total, form.discount]);

  useEffect(() => {
    setPurchaseAmount(roundLine(computedAmount));
  }, [computedAmount]);

  const setField = <K extends keyof PurchasePayload>(key: K, value: PurchasePayload[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const addItemToCart = (item: Item, addQty = 1) => {
    const qtyToAdd = roundSaleQty(addQty);
    const existing = lines.find((l) => l.item_id === item.id);
    if (existing) {
      setLines((prev) =>
        prev.map((l) => {
          if (l.key !== existing.key) return l;
          const qty = roundSaleQty(l.qty + qtyToAdd);
          return { ...l, qty, line_total: roundLine(qty * l.unit_price) };
        })
      );
    } else {
      setLines((prev) => [...prev, itemToLine(item, qtyToAdd)]);
    }
    if (errors.products) setErrors((p) => ({ ...p, products: undefined }));
  };

  const handleCatalogSearchSubmit = () => {
    const { term, qty } = parsedCatalogSearch;
    if (!term.trim()) return;

    const candidates = filterPosCatalogItems(
      catalogItems,
      categoryTab,
      categories,
      term,
      subCategoryTab
    );
    const termLower = term.toLowerCase();
    const match =
      candidates.find((i) => i.item_number.toLowerCase() === termLower) ??
      candidates.find((i) => (i.item_code ?? "").toLowerCase() === termLower) ??
      candidates.find((i) => (i.sku ?? "").toLowerCase() === termLower) ??
      candidates[0];

    if (!match) {
      enqueueSnackbar("No product found for that search.", { variant: "warning" });
      return;
    }

    addItemToCart(match, qty ?? 1);
    setCatalogSearch("");
  };

  const setLineQty = (key: string, rawQty: number) => {
    const line = lines.find((l) => l.key === key);
    let qty = roundSaleQty(rawQty);
    if (
      form.purchase_type === PURCHASE_TYPE_RETURN &&
      line?.max_return_qty != null &&
      qty > line.max_return_qty + 0.0001
    ) {
      enqueueSnackbar(`Maximum returnable qty is ${line.max_return_qty}`, { variant: "warning" });
      qty = roundSaleQty(line.max_return_qty);
    }
    if (qty < 0.01) {
      setLines((prev) => prev.filter((l) => l.key !== key));
      return;
    }
    setLines((prev) =>
      prev.map((l) => {
        if (l.key !== key) return l;
        return { ...l, qty, line_total: roundLine(qty * l.unit_price) };
      })
    );
  };

  const updateLineQty = (key: string, delta: number) => {
    const line = lines.find((l) => l.key === key);
    if (!line) return;
    const step = qtyStepForUom(lineUom(line));
    const signedDelta = delta > 0 ? step : -step;
    let nextQty = roundSaleQty(line.qty + signedDelta);
    if (
      form.purchase_type === PURCHASE_TYPE_RETURN &&
      line.max_return_qty != null &&
      nextQty > line.max_return_qty + 0.0001
    ) {
      nextQty = roundSaleQty(line.max_return_qty);
    }
    if (nextQty < 0.01) {
      setLines((prev) => prev.filter((l) => l.key !== key));
      return;
    }
    setLineQty(key, nextQty);
  };

  const updateLineExpiry = (key: string, expiryDate: string | null) => {
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, expiry_date: expiryDate || null } : l))
    );
    if (errors.expiry) setErrors((p) => ({ ...p, expiry: undefined }));
  };

  const updateLinePrice = (key: string, unitPrice: number) => {
    const price = Math.max(0, unitPrice);
    setLines((prev) =>
      prev.map((l) => {
        if (l.key !== key) return l;
        return { ...l, unit_price: price, line_total: roundLine(l.qty * price) };
      })
    );
  };

  const removeLine = (key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key));
  };

  const handlePaymentSelect = (method: PosPaymentMethod) => {
    setField("payment_method", method);
    if (method !== "Cheque") {
      setField("bank_id", null);
      setField("cheque_number", null);
    }
    if (method === "Credit" && !form.net_terms) {
      setField("net_terms", "30 Days");
    }
    if (method === "Credit" || method === "Cash" || method === "Cheque") {
      setPurchaseAmount(roundLine(computedAmount));
    }
  };

  const clearError = (
    key:
      | "invoice_id"
      | "supplier_name"
      | "purchase_date"
      | "products"
      | "expiry"
      | "amount"
      | "bank_id"
      | "cheque_number"
  ) => {
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: PurchaseSession["errors"] = {};
    if (!form.invoice_id?.trim()) next.invoice_id = "Invoice ID is required";
    if (!resolvePurchaseSupplierName(form, suppliers)) {
      next.supplier_name = "Select a supplier";
    }
    if (!form.purchase_date) next.purchase_date = "Date is required";
    if (lines.length === 0) next.products = "Add at least one product";

    if (form.payment_method === "Cheque") {
      if (!form.bank_id) next.bank_id = "Select bank";
      if (!form.cheque_number?.trim()) next.cheque_number = "Enter cheque ID";
    }
    if (purchaseAmount <= 0) {
      next.amount = "Enter purchase amount";
    } else if (
      form.payment_method !== "Credit" &&
      purchaseAmount + 0.009 < computedAmount
    ) {
      next.amount = "Purchase amount is less than total";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const savingReturn = form.purchase_type === PURCHASE_TYPE_RETURN;
      const supplierName = resolvePurchaseSupplierName(form, suppliers);
      if (!supplierName) {
        throw new Error("Select a supplier");
      }

      const linePayload = linesToPayload(lines);
      const notes =
        form.payment_method === "Cheque" && form.cheque_number?.trim() && form.bank_id
          ? buildPurchaseChequeNotes(
              form.cheque_number,
              resolveBankName(banks, form.bank_id),
              form.notes
            )
          : form.notes;

      const payload = buildPurchaseSavePayload(form, linePayload, {
        location: itemBranch,
        amount: purchaseAmount,
        subTotal: lines.length > 0 ? linesSubTotal : Number(form.sub_total) || 0,
        supplierName,
        banks,
        savingReturn,
        returnedFromPurchaseId: sourcePurchaseIdRef.current ?? sourcePurchaseId,
      });
      payload.notes = notes;

      return createPurchase(payload);
    },
    onSuccess: async (saved) => {
      invalidatePosQueries(queryClient);
      const isReturn = saved.purchase_type === PURCHASE_TYPE_RETURN;
      enqueueSnackbar(
        isReturn
          ? "Purchase return saved — stock reduced and refund recorded"
          : "Purchase saved — stock increased and payment recorded",
        { variant: "success" }
      );
      try {
        await printPurchaseInvoiceAsync(saved);
      } catch (err: unknown) {
        enqueueSnackbar(
          getFriendlyErrorMessage(err, "Purchase saved but invoice could not be printed"),
          { variant: "warning" }
        );
      }
      navigate(PURCHASES_BASE);
    },
    onError: (err: unknown) => {
      enqueueSnackbar(getFriendlyErrorMessage(err, "Failed to save purchase"), { variant: "error" });
    },
  });

  const handleSubmit = () => {
    if (validate()) saveMutation.mutate();
  };

  const goToCheckout = () => {
    if (lines.length === 0) {
      enqueueSnackbar("Add at least one product first", { variant: "warning" });
      return;
    }
    setView("checkout");
  };

  const handlePrintInvoice = async () => {
    if (lines.length === 0) {
      enqueueSnackbar("Add at least one product to print", { variant: "warning" });
      return;
    }
    setPrintInvoicePending(true);
    try {
      const draft = buildDraftPurchaseInvoice(
        {
          purchase_type: form.purchase_type ?? DEFAULT_PURCHASE_TYPE,
          location: itemBranch,
          purchase_date: form.purchase_date ?? "",
          invoice_id: form.invoice_id,
          supplier_id: form.supplier_id ?? null,
          supplier_name: resolvePurchaseSupplierName(form, suppliers),
          sub_total: linesSubTotal,
          discount: form.discount ?? 0,
          amount: purchaseAmount,
          payment_method: form.payment_method,
          bank_id: form.bank_id,
          cheque_number: form.cheque_number,
          net_terms: form.net_terms ?? null,
          notes: form.notes,
        },
        linesToPayload(lines)
      );
      await printPurchaseInvoiceAsync(draft);
    } catch (err: unknown) {
      enqueueSnackbar(getFriendlyErrorMessage(err, "Could not print purchase invoice"), {
        variant: "error",
      });
    } finally {
      setPrintInvoicePending(false);
    }
  };

  const session: PurchaseSession = {
    view,
    setView,
    form,
    setForm,
    setField,
    lines,
    setLines,
    errors,
    clearError,
    itemBranch,
    manageMultiple,
    suppliers,
    loadingSuppliers,
    banks,
    loadingBanks,
    purchaseTypes,
    paymentMethods,
    linesSubTotal,
    computedAmount,
    purchaseAmount,
    setPurchaseAmount,
    savePending: saveMutation.isPending,
    itemUomById,
    lineUom,
    categories,
    loadingCategories,
    loadingItems,
    catalogItems,
    filteredItems,
    categoryTab,
    subCategoryTab,
    setSubCategoryTab,
    catalogSearch,
    setCatalogSearch,
    parsedCatalogSearch,
    visibleSubCategories,
    activeCategoryName,
    categoryTabLabel,
    handleCategoryTabChange,
    handleCatalogSearchSubmit,
    addItemToCart,
    setLineQty,
    updateLineQty,
    updateLinePrice,
    updateLineExpiry,
    removeLine,
    handlePaymentSelect,
    handleSubmit,
    goToCheckout,
    handlePrintInvoice,
    printInvoicePending,
    supplierDisplayName,
  };

  return (
    <PurchaseContext.Provider value={session}>
      {view === "products" ? (
        <PurchaseProductSelectPage />
      ) : (
        <PurchaseCheckoutPage />
      )}
    </PurchaseContext.Provider>
  );
};

export default PurchaseNewFormPage;
