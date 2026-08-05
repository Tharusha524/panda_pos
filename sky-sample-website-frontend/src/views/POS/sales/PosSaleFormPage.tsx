import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import {
  completeHoldOrder,
  createSale,
  getNextSalesId,
  getSale,
  getSalesPosContext,
  updateSale,
  type OrderStatus,
  type Sale,
  type SalePayload,
} from "../../../api/salesApi";
import {
  getItems,
  getItemInventoryBreakdown,
  getItemCategoriesByLocation,
  type Item,
  type ItemBatch,
} from "../../../api/itemsApi";
import { getCustomers } from "../../../api/customersApi";
import { getApplicableOffers, type OfferPreviewResult } from "../../../api/offersApi";
import { getHardwareSettings } from "../../../api/Settings/hardwareSettingsApi";
import { getFriendlyErrorMessage } from "../../../utils/getFriendlyErrorMessage";
import { invalidatePosQueries } from "../../../utils/invalidatePosQueries";
import type { SaleLineDraft } from "./SaleLineItemsSection";
import { linesFromSale, linesToPayload } from "./SaleLineItemsSection";
import { emptySaleForm, SALES_BASE } from "./saleFormUtils";
import { DEFAULT_TRANSACTION_TYPE, TRANSACTION_TYPE_RETURN } from "./saleConstants";
import {
  canIncreaseCartQty,
  canSetCartQty,
  filterPosSaleCatalogItems,
  isInventoryTrackedItem,
} from "./posSaleInventory";
import {
  availableStockForCartItem,
  cartQtyForItem,
  mergePosCatalogAcrossBranches,
  resolveCartItemForSale,
  resolveSaleLocationFromLines,
} from "./posSaleCatalogMerge";
import { readPosSelectedCustomer, savePosSelectedCustomer } from "./posCustomerSelection";
import { customerDisplayName } from "./PosCustomerSelectArea";
import { useBranchLocations } from "../../../hooks/useBranchLocations";
import { downloadSaleReceiptImageFromApi } from "./saleReceiptImageDownload";
import PosChequeBankDialog, { type ChequePaymentDetails } from "./PosChequeBankDialog";
import PosSaleBatchSelectDialog from "./PosSaleBatchSelectDialog";
import {
  availableBatchesAtBranch,
  maxQtyForCartLine,
  unitPriceForBatchSale,
} from "./posSaleBatchUtils";
import type { PosPaymentMethod } from "./posSaleConstants";
import {
  applySalesTypeToLines,
  getPosItemUnitPrice,
  isWholesaleSalesType,
  pricingModeFromSalesType,
  type PosSalesPriceMode,
} from "./posSalePricing";
import { calculateSaleVat, grandTotalWithVat } from "./posSaleTax";
import {
  filterOffersForPricingMode,
  productOffersByItemNumber,
} from "./posProductOffers";
import { useSaleOfferEngine } from "./useSaleOfferEngine";
import { resolveItemImageUrl } from "../../../utils/resolveStorageUrl";
import {
  formatUomLabel,
  parsePosCatalogSearch,
  qtyStepForUom,
  parseSaleLineQty,
  roundSaleQty,
} from "./posSaleUom";
import { isItemExpired, isBatchExpired } from "../inventory/itemInventoryUtils";
import { PosSaleContext } from "./posSaleContext";
import type { PosSaleSession, PosSaleView } from "./posSaleSessionTypes";
import PosProductSelectPage from "./PosProductSelectPage";
import PosSaleCheckoutPage from "./PosSaleCheckoutPage";
import { printSaleReceiptFromApi } from "./saleReceiptPrint";
import {
  filterPosCatalogItems,
  subCategoriesForPosTab,
  type PosCategoryTab,
} from "./posSaleCatalogFilter";
import type { PosSubCategoryTab } from "./PosSubCategoryTabs";

function newLineKey(): string {
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function itemToLine(
  item: Item,
  salesType: PosSalesPriceMode,
  qty = 1,
  batch?: ItemBatch | null
): SaleLineDraft {
  const price = unitPriceForBatchSale(item, salesType, batch);
  const q = roundSaleQty(qty);
  return {
    key: newLineKey(),
    item_id: item.id,
    item_number: item.item_number,
    description: item.description,
    qty: q,
    unit_price: price,
    line_total: Math.round(q * price * 100) / 100,
    batch_id: batch?.batch_number ?? null,
    item_batch_id: batch?.id ?? null,
    batch_stock_qty: batch?.qty ?? item.qty ?? undefined,
    batch_expiry_date: batch?.expiry_date ?? null,
    batch_selling_price: batch?.selling_price ?? item.selling_price ?? null,
    purchase_price: batch?.purchase_price ?? null,
  };
}

const PosSaleFormPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [form, setForm] = useState<SalePayload>(emptySaleForm());
  const [lines, setLines] = useState<SaleLineDraft[]>([]);
  const [categoryTab, setCategoryTab] = useState<PosCategoryTab>("all");
  const [subCategoryTab, setSubCategoryTab] = useState<PosSubCategoryTab>("all");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PosPaymentMethod>("Cash");
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [chequeDetails, setChequeDetails] = useState<ChequePaymentDetails | null>(null);
  const [chequeDialogOpen, setChequeDialogOpen] = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [batchDialogItem, setBatchDialogItem] = useState<Item | null>(null);
  const [batchDialogQty, setBatchDialogQty] = useState(1);
  const [batchDialogBatches, setBatchDialogBatches] = useState<ItemBatch[]>([]);
  const [batchDialogVariants, setBatchDialogVariants] = useState<Item[]>([]);
  const [batchDialogLoading, setBatchDialogLoading] = useState(false);
  const [offerDiscount, setOfferDiscount] = useState(0);
  const [offerPreview, setOfferPreview] = useState<OfferPreviewResult | null>(null);
  const [activeHoldSaleId, setActiveHoldSaleId] = useState<number | null>(null);
  const [holdPin, setHoldPin] = useState("");
  const [view, setView] = useState<PosSaleView>("products");
  const [searchParams] = useSearchParams();

  const { defaultLocation, locations, manageMultiple } = useBranchLocations([], {
    branchesOnly: true,
  });
  /** Sale is recorded at this branch; catalog loads from all branches. */
  const itemBranch = form.location ?? defaultLocation;
  const catalogLocation = "all";

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["item-categories", "pos-sale", catalogLocation],
    queryFn: () => getItemCategoriesByLocation(catalogLocation),
  });

  const { data: itemsData, isLoading: loadingItems } = useQuery({
    queryKey: ["items", "pos-sale", catalogLocation],
    queryFn: () => getItems(undefined, catalogLocation, { forPosSale: true }),
  });

  const rawCatalogItems = useMemo(
    () => filterPosSaleCatalogItems(itemsData?.items ?? []),
    [itemsData?.items]
  );

  const { displayItems: catalogItems, variantsByItemNumber } = useMemo(
    () => mergePosCatalogAcrossBranches(rawCatalogItems, itemBranch),
    [rawCatalogItems, itemBranch]
  );

  const catalogScopeLabel =
    manageMultiple && locations.length > 1
      ? `All branches (${locations.length})`
      : "All locations";

  const { data: customersData, isLoading: loadingCustomers } = useQuery({
    queryKey: ["customers", "pos", "all"],
    queryFn: () => getCustomers("all"),
  });

  useEffect(() => {
    if (!form.location) {
      setForm((prev) => ({ ...prev, location: defaultLocation }));
    }
  }, [defaultLocation, form.location]);
  const customers = customersData?.customers ?? [];

  useEffect(() => {
    if (customers.length === 0) return;
    const paramId = searchParams.get("customerId");
    const stored = readPosSelectedCustomer();
    const idToApply =
      paramId != null && paramId !== ""
        ? Number(paramId)
        : stored?.id != null
          ? stored.id
          : null;
    if (idToApply == null || Number.isNaN(idToApply)) {
      if (stored?.id == null) return;
      setForm((prev) => ({ ...prev, customer_id: null, customer_name: "" }));
      return;
    }
    const c = customers.find((x) => x.id === idToApply);
    if (c) {
      setForm((prev) => ({
        ...prev,
        customer_id: c.id,
        customer_name: customerDisplayName(c),
      }));
      savePosSelectedCustomer(c);
    }
  }, [customers, searchParams]);

  const { data: hardwareSettings } = useQuery({
    queryKey: ["hardware-settings"],
    queryFn: getHardwareSettings,
  });

  const { data: posContext } = useQuery({
    queryKey: ["sales-pos-context"],
    queryFn: getSalesPosContext,
  });
  const { data: applicableOffersList } = useQuery({
    queryKey: ["offers-applicable", form.sale_date],
    queryFn: () => getApplicableOffers(form.sale_date),
    enabled: posContext?.order_settings?.allow_offer !== false,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
  const allApplicableOffers =
    applicableOffersList ?? posContext?.applicable_offers ?? [];
  const salePricingMode = pricingModeFromSalesType(form.sales_type);
  const applicableOffers = useMemo(
    () => filterOffersForPricingMode(allApplicableOffers, salePricingMode),
    [allApplicableOffers, salePricingMode]
  );
  const allowOffers = posContext?.order_settings?.allow_offer !== false;

  const allowWholesalePrice = itemsData?.item_settings?.allow_wholesale_price !== false;
  const salesPriceMode: PosSalesPriceMode = isWholesaleSalesType(form.sales_type)
    ? "Wholesale"
    : "Retail";
  const orderSettings = posContext?.order_settings;
  const allowNegativeInventory = orderSettings?.allow_sales_negative_inventory === true;
  const allowPriceSwitch = orderSettings?.allow_switching_wholesale_retail_prices !== false;
  const allowEditSellingPrice = orderSettings?.allow_edit_selling_price !== false;
  const showBothPricesOnCards =
    orderSettings?.allow_view_wholesale_retail_prices_by_clicking !== false;
  const allowDeliveryCharge = orderSettings?.allow_service_charge !== false;
  const allowBatchPicker = orderSettings?.allow_batch_id_popup !== false;
  const productOfferMap = useMemo(
    () => productOffersByItemNumber(applicableOffers),
    [applicableOffers]
  );

  const itemImageByNumber = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of rawCatalogItems) {
      const url = resolveItemImageUrl(item);
      if (url && item.item_number) {
        map.set(item.item_number.trim().toLowerCase(), url);
      }
    }
    return map;
  }, [rawCatalogItems]);

  const lineImageUrl = (itemNumber?: string | null) => {
    if (!itemNumber?.trim()) return null;
    return itemImageByNumber.get(itemNumber.trim().toLowerCase()) ?? null;
  };

  const itemUomById = useMemo(() => {
    const map = new Map<number, string>();
    for (const item of rawCatalogItems) {
      if (item.uom) map.set(item.id, item.uom);
    }
    return map;
  }, [rawCatalogItems]);

  const lineUom = (line: SaleLineDraft) =>
    (line.item_id != null ? itemUomById.get(line.item_id) : null) ?? "pcs";

  const parsedCatalogSearch = useMemo(
    () => parsePosCatalogSearch(catalogSearch),
    [catalogSearch]
  );

  const showOffers = allowOffers;

  const handleOfferChange = useCallback(
    (patch: { offer_id?: number | null; offer_promo_code?: string | null }) => {
      setForm((prev) => ({ ...prev, ...patch }));
    },
    []
  );

  const offerEngine = useSaleOfferEngine({
    allowOffers: showOffers,
    applicableOffers,
    offerId: form.offer_id,
    offerPromoCode: form.offer_promo_code,
    saleDate: form.sale_date ?? "",
    pricingMode: salePricingMode,
    lines,
    onOfferChange: handleOfferChange,
    onOfferDiscountChange: setOfferDiscount,
    onOfferPreviewChange: setOfferPreview,
  });

  const handleSalesPriceModeChange = (mode: PosSalesPriceMode) => {
    setForm((prev) => ({
      ...prev,
      sales_type: mode,
      pricing_mode: pricingModeFromSalesType(mode),
    }));
    setLines((prev) => applySalesTypeToLines(prev, catalogItems, mode));
  };

  const selectedOffer = offerEngine.selectedOffer;
  const offerNeedsPromo = Boolean(selectedOffer?.requires_promo_code);

  useEffect(() => {
    if (
      form.offer_id != null &&
      !applicableOffers.some((offer) => offer.id === form.offer_id)
    ) {
      setForm((prev) => ({ ...prev, offer_id: null, offer_promo_code: null }));
      setOfferDiscount(0);
      setOfferPreview(null);
    }
  }, [applicableOffers, form.offer_id]);

  useEffect(() => {
    const holdIdParam = searchParams.get("holdId");
    if (holdIdParam) return;
    getNextSalesId()
      .then((id) => setForm((prev) => ({ ...prev, sales_id: id })))
      .catch(() => {});
  }, [searchParams]);

  useEffect(() => {
    const holdIdParam = searchParams.get("holdId");
    if (!holdIdParam) return;
    const holdId = Number(holdIdParam);
    if (Number.isNaN(holdId)) return;

    getSale(holdId)
      .then((sale) => {
        if (sale.order_status !== "hold") {
          enqueueSnackbar("This sale is not on hold", { variant: "warning" });
          return;
        }
        setActiveHoldSaleId(sale.id);
        setForm({
          ...emptySaleForm(),
          transaction_type: sale.transaction_type,
          sales_type: sale.sales_type,
          pricing_mode: sale.pricing_mode,
          location: sale.location,
          sale_date: sale.sale_date,
          sales_id: sale.sales_id,
          customer_id: sale.customer_id,
          customer_name: sale.customer_name ?? "",
          sub_total: sale.sub_total,
          discount: sale.discount,
          service_charge: sale.service_charge ?? 0,
          net_amount: sale.net_amount,
          offer_id: sale.offer_id ?? null,
          offer_promo_code: sale.offer_promo_code ?? null,
          payment_method: sale.payment_method ?? "Cash",
          notes: sale.notes ?? "",
        });
        setLines(linesFromSale(sale.items));
        const method = (sale.payment_method as PosPaymentMethod) || "Cash";
        setPaymentMethod(method);
        setAmountReceived(sale.amount_received ?? sale.net_amount);
        setChequeDetails(null);
        setView("checkout");
        enqueueSnackbar(`Loaded hold order ${sale.sales_id}`, { variant: "info" });
      })
      .catch((err: unknown) => {
        enqueueSnackbar(getFriendlyErrorMessage(err, "Could not load hold order"), {
          variant: "error",
        });
      });
  }, [searchParams, enqueueSnackbar]);

  const linesSubTotal = useMemo(
    () => lines.reduce((sum, l) => sum + (l.line_total || 0), 0),
    [lines]
  );

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      sub_total: Math.round(linesSubTotal * 100) / 100,
    }));
  }, [linesSubTotal]);

  const taxSettings = posContext?.tax_settings;
  const productOfferPricesApplied =
    Boolean(form.offer_id) &&
    selectedOffer?.discount_type === "product" &&
    offerDiscount > 0 &&
    offerPreview?.sub_total != null;
  const effectiveCatalogTotal = productOfferPricesApplied
    ? offerPreview!.sub_total
    : linesSubTotal;
  const taxableAmount = useMemo(() => {
    const disc = Number(form.discount) || 0;
    if (productOfferPricesApplied) {
      return Math.max(0, effectiveCatalogTotal - disc);
    }
    return Math.max(0, linesSubTotal - disc - offerDiscount);
  }, [
    productOfferPricesApplied,
    effectiveCatalogTotal,
    linesSubTotal,
    form.discount,
    offerDiscount,
  ]);

  const vatBreakdown = useMemo(
    () =>
      calculateSaleVat(
        taxableAmount,
        taxSettings,
        catalogItems,
        lines.map((l) => l.item_id).filter((id): id is number => id != null)
      ),
    [taxableAmount, taxSettings, catalogItems, lines]
  );

  const deliveryCharge = allowDeliveryCharge ? Number(form.service_charge) || 0 : 0;

  const netAmount = useMemo(
    () => grandTotalWithVat(taxableAmount, vatBreakdown.vatAmount) + deliveryCharge,
    [taxableAmount, vatBreakdown.vatAmount, deliveryCharge]
  );

  const changeDue = useMemo(() => {
    if (paymentMethod === "Credit") return 0;
    return Math.max(0, (amountReceived || 0) - netAmount);
  }, [amountReceived, netAmount, paymentMethod]);

  useEffect(() => {
    setCatalogSearch("");
    setSubCategoryTab("all");
  }, [categoryTab]);

  const visibleSubCategories = useMemo(
    () => subCategoriesForPosTab(categoryTab, categories),
    [categoryTab, categories]
  );

  const handleCategoryTabChange = (tab: PosCategoryTab) => {
    setCategoryTab(tab);
    setSubCategoryTab("all");
  };

  useEffect(() => {
    if (allowWholesalePrice) return;
    setForm((prev) => {
      if (!isWholesaleSalesType(prev.sales_type)) return prev;
      return {
        ...prev,
        sales_type: "Retail",
        pricing_mode: "retail",
        offer_id: null,
        offer_promo_code: null,
      };
    });
    setLines((prev) => applySalesTypeToLines(prev, catalogItems, "Retail"));
  }, [allowWholesalePrice, catalogItems]);

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

  const addItemToCartDirect = (
    saleItem: Item,
    addQty: number,
    batch: ItemBatch | null
  ) => {
    if (batch && isBatchExpired(batch)) {
      enqueueSnackbar(`Batch ${batch.batch_number} is expired and cannot be sold.`, {
        variant: "error",
      });
      return;
    }
    if (!batch && isItemExpired(saleItem)) {
      enqueueSnackbar(`${saleItem.item_number} is expired. Write off from Inventory.`, {
        variant: "error",
      });
      return;
    }
    const availableQty =
      batch != null
        ? batch.qty
        : availableStockForCartItem(saleItem);
    const qtyToAdd = roundSaleQty(addQty);
    const batchId = batch?.id ?? null;

    if (
      availableQty <= 0 &&
      isInventoryTrackedItem(saleItem) &&
      !allowNegativeInventory
    ) {
      enqueueSnackbar("This item is out of stock at all branches.", {
        variant: "warning",
      });
      return;
    }

    const existing = lines.find(
      (l) =>
        l.item_id === saleItem.id &&
        (l.item_batch_id ?? null) === batchId
    );
    const nextQty = existing ? existing.qty + qtyToAdd : qtyToAdd;
    if (!canSetCartQty(saleItem, nextQty, availableQty, allowNegativeInventory)) {
      const scope = batch
        ? `in batch ${batch.batch_number}`
        : `at ${saleItem.location}`;
      enqueueSnackbar(
        `Only ${Math.max(0, availableQty).toFixed(2)} ${formatUomLabel(saleItem.uom)} available ${scope}.`,
        { variant: "warning" }
      );
      return;
    }
    if (existing) {
      setLines((prev) =>
        prev.map((l) => {
          if (l.key !== existing.key) return l;
          const qty = roundSaleQty(l.qty + qtyToAdd);
          return {
            ...l,
            qty,
            line_total: Math.round(qty * l.unit_price * 100) / 100,
          };
        })
      );
    } else {
      setLines((prev) => [
        ...prev,
        itemToLine(saleItem, salesPriceMode, qtyToAdd, batch),
      ]);
    }
  };

  const addBatchesToCart = (
    saleItem: Item,
    selections: Array<{ batch: ItemBatch; qty: number }>,
    unbatchedQty?: number
  ) => {
    if (selections.length === 0 && (!unbatchedQty || unbatchedQty <= 0)) return;

    let nextLines = [...lines];
    let added = 0;
    let skipped = 0;

    if (unbatchedQty && unbatchedQty > 0) {
      const roundedUnbatchedQty = roundSaleQty(unbatchedQty);
      const availableQty = availableStockForCartItem(saleItem);
      const existingUnbatched = nextLines.find(
        (l) => l.item_id === saleItem.id && (l.item_batch_id ?? null) == null
      );
      const nextQty = existingUnbatched
        ? existingUnbatched.qty + roundedUnbatchedQty
        : roundedUnbatchedQty;
      if (!canSetCartQty(saleItem, nextQty, availableQty, allowNegativeInventory)) {
        enqueueSnackbar(
          `Unbatched: only ${Math.max(0, availableQty).toFixed(2)} ${formatUomLabel(saleItem.uom)} available.`,
          { variant: "warning" }
        );
        skipped += 1;
      } else if (existingUnbatched) {
        nextLines = nextLines.map((l) => {
          if (l.key !== existingUnbatched.key) return l;
          const q = roundSaleQty(l.qty + roundedUnbatchedQty);
          return { ...l, qty: q, line_total: Math.round(q * l.unit_price * 100) / 100 };
        });
        added += 1;
      } else {
        nextLines = [...nextLines, itemToLine(saleItem, salesPriceMode, roundedUnbatchedQty, null)];
        added += 1;
      }
    }

    for (const { batch, qty } of selections) {
      if (isBatchExpired(batch)) {
        skipped += 1;
        continue;
      }
      const qtyToAdd = roundSaleQty(qty);
      if (qtyToAdd <= 0) {
        skipped += 1;
        continue;
      }
      const batchId = batch.id;
      const existing = nextLines.find(
        (l) => l.item_id === saleItem.id && (l.item_batch_id ?? null) === batchId
      );
      const nextQty = existing ? existing.qty + qtyToAdd : qtyToAdd;
      if (!canSetCartQty(saleItem, nextQty, batch.qty, allowNegativeInventory)) {
        enqueueSnackbar(
          `Batch ${batch.batch_number}: only ${Math.max(0, batch.qty).toFixed(2)} ${formatUomLabel(saleItem.uom)} available.`,
          { variant: "warning" }
        );
        skipped += 1;
        continue;
      }
      if (existing) {
        nextLines = nextLines.map((l) => {
          if (l.key !== existing.key) return l;
          const q = roundSaleQty(l.qty + qtyToAdd);
          return { ...l, qty: q, line_total: Math.round(q * l.unit_price * 100) / 100 };
        });
      } else {
        nextLines = [...nextLines, itemToLine(saleItem, salesPriceMode, qtyToAdd, batch)];
      }
      added += 1;
    }

    if (added === 0) {
      if (skipped > 0) {
        enqueueSnackbar("No batches were added — check qty and stock.", { variant: "warning" });
      }
      return;
    }

    setLines(nextLines);
    enqueueSnackbar(
      `Added ${added} row${added === 1 ? "" : "s"} to cart${skipped > 0 ? ` (${skipped} skipped)` : ""}.`,
      { variant: skipped > 0 ? "warning" : "success" }
    );
  };

  const addMainItemToCart = (displayItem: Item, addQty = 1) => {
    const saleItem = resolveCartItemForSale(
      displayItem,
      variantsByItemNumber,
      itemBranch
    );
    if (saleItem.has_expired_stock || isItemExpired(saleItem)) {
      if (saleItem.has_batches) {
        enqueueSnackbar(
          saleItem.has_expired_stock
            ? `${saleItem.item_number}: write off expired stock or pick a valid batch.`
            : `${saleItem.item_number} is expired — pick a valid batch.`,
          { variant: "warning" }
        );
        openBatchPicker(displayItem, addQty);
        return;
      }
      enqueueSnackbar(
        `${saleItem.item_number} is expired at ${saleItem.location || "this branch"}. Write off stock from Inventory Dashboard.`,
        { variant: "error" }
      );
      return;
    }
    addItemToCartDirect(saleItem, roundSaleQty(addQty), null);
  };

  const openBatchPicker = (displayItem: Item, addQty = 1) => {
    const saleItem = resolveCartItemForSale(
      displayItem,
      variantsByItemNumber,
      itemBranch
    );
    if (isItemExpired(saleItem) && !saleItem.has_batches) {
      enqueueSnackbar(
        `${displayItem.item_number} is expired. Write off stock from Inventory Dashboard.`,
        { variant: "error" }
      );
      return;
    }
    const qtyToAdd = roundSaleQty(addQty);
    const itemKey = (saleItem.item_number || String(saleItem.id)).trim().toLowerCase();
    const variants = variantsByItemNumber.get(itemKey) ?? [saleItem];

    if (!isInventoryTrackedItem(saleItem)) {
      enqueueSnackbar("Inventory details are not available for this item.", {
        variant: "info",
      });
      return;
    }

    setBatchDialogItem(saleItem);
    setBatchDialogQty(qtyToAdd);
    setBatchDialogVariants(variants);
    setBatchDialogBatches([]);
    setBatchDialogOpen(true);

    void (async () => {
      setBatchDialogLoading(true);
      try {
        const { batches } = await getItemInventoryBreakdown(saleItem.id);
        const available = availableBatchesAtBranch(batches, saleItem.location);
        setBatchDialogBatches(available);
      } catch (err) {
        enqueueSnackbar(getFriendlyErrorMessage(err), { variant: "error" });
      } finally {
        setBatchDialogLoading(false);
      }
    })();
  };

  /** Single-click / search: add main product only (no batch dialog). */
  const addItemToCart = addMainItemToCart;

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
    if (!line) return;
    const qty = parseSaleLineQty(rawQty);
    if (qty == null) {
      setLines((prev) => prev.filter((l) => l.key !== key));
      return;
    }
    const catalogItem = rawCatalogItems.find((i) => i.id === line.item_id);
    if (catalogItem) {
      const availableQty = maxQtyForCartLine(
        line,
        lines,
        availableStockForCartItem(catalogItem)
      );
      if (!canSetCartQty(catalogItem, qty, availableQty, allowNegativeInventory)) {
        const scope = line.batch_id ? `in batch ${line.batch_id}` : "available";
        enqueueSnackbar(
          `Only ${Math.max(0, availableQty).toFixed(2)} ${formatUomLabel(catalogItem.uom)} ${scope}.`,
          { variant: "warning" }
        );
        return;
      }
    }
    setLines((prev) =>
      prev.map((l) => {
          if (l.key !== key) return l;
          return {
            ...l,
            qty,
            line_total: Math.round(qty * l.unit_price * 100) / 100,
          };
        })
    );
  };

  const updateLineQty = (key: string, delta: number) => {
    const line = lines.find((l) => l.key === key);
    if (!line) return;
    const uom = lineUom(line);
    const step = qtyStepForUom(uom);
    const signedDelta = delta > 0 ? step : -step;
    const catalogItem = rawCatalogItems.find((i) => i.id === line.item_id);
    if (catalogItem && signedDelta > 0) {
      const availableQty = maxQtyForCartLine(
        line,
        lines,
        availableStockForCartItem(catalogItem)
      );
      if (!canIncreaseCartQty(catalogItem, line.qty, step, availableQty, allowNegativeInventory)) {
        const scope = line.batch_id ? `in batch ${line.batch_id}` : "available";
        enqueueSnackbar(
          `Only ${Math.max(0, availableQty).toFixed(2)} ${formatUomLabel(catalogItem.uom)} ${scope}.`,
          { variant: "warning" }
        );
        return;
      }
    }
    const nextQty = line.qty + signedDelta;
    if (nextQty <= 0) {
      setLines((prev) => prev.filter((l) => l.key !== key));
      return;
    }
    setLineQty(key, nextQty);
  };

  const setLineUnitPrice = (key: string, rawPrice: number) => {
    const unitPrice = Math.max(0, Math.round(rawPrice * 100) / 100);
    setLines((prev) =>
      prev.map((l) => {
        if (l.key !== key) return l;
        return {
          ...l,
          unit_price: unitPrice,
          line_total: Math.round(l.qty * unitPrice * 100) / 100,
        };
      })
    );
  };

  const removeFromCart = (displayItem: Item) => {
    const saleItem = resolveCartItemForSale(
      displayItem,
      variantsByItemNumber,
      itemBranch
    );
    const itemLines = lines.filter((l) => l.item_id === saleItem.id);
    if (itemLines.length === 0) return;

    const mainLine = itemLines.find((l) => l.item_batch_id == null);
    const target = mainLine ?? itemLines[itemLines.length - 1];
    updateLineQty(target.key, -1);
  };

  const finishSaleWithReceipt = async (receipt?: Parameters<typeof printSaleReceiptFromApi>[0]) => {
      invalidatePosQueries(queryClient);
      const autoPrint =
        hardwareSettings?.allow_auto_print ?? receipt?.print_options.allow_auto_print ?? true;
      if (receipt) {
        if (autoPrint) {
          printSaleReceiptFromApi(receipt);
        }
        try {
          await downloadSaleReceiptImageFromApi(receipt);
        enqueueSnackbar("Sale completed â€” receipt PNG downloaded", { variant: "success" });
        } catch (imgErr) {
        const imgMsg = imgErr instanceof Error ? imgErr.message : "Receipt image download failed";
        enqueueSnackbar(`Sale completed â€” ${imgMsg}`, { variant: "warning" });
        }
      } else {
        enqueueSnackbar("Sale completed", { variant: "success" });
      }
    setActiveHoldSaleId(null);
      navigate(SALES_BASE);
  };

  const saveMutation = useMutation({
    mutationFn: createSale,
    onSuccess: async ({ receipt }) => {
      await finishSaleWithReceipt(receipt);
    },
    onError: (err: unknown) => {
      enqueueSnackbar(getFriendlyErrorMessage(err, "Failed to complete sale"), {
        variant: "error",
      });
    },
  });

  const completeHoldMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: SalePayload }) =>
      completeHoldOrder(id, payload),
    onSuccess: async ({ receipt }) => {
      await finishSaleWithReceipt(receipt);
    },
    onError: (err: unknown) => {
      enqueueSnackbar(getFriendlyErrorMessage(err, "Failed to complete hold order"), {
        variant: "error",
      });
    },
  });

  const resetPosForNewSale = () => {
    setActiveHoldSaleId(null);
    setHoldPin("");
    setLines([]);
    setPaymentMethod("Cash");
    setAmountReceived(0);
    setChequeDetails(null);
    setOfferDiscount(0);
    setOfferPreview(null);
    setView("products");
    setForm((prev) => ({
      ...emptySaleForm(),
      location: prev.location ?? defaultLocation,
      customer_id: prev.customer_id ?? null,
      customer_name: prev.customer_name ?? "",
    }));
    getNextSalesId()
      .then((id) => setForm((prev) => ({ ...prev, sales_id: id })))
      .catch(() => {});
  };

  const holdMutation = useMutation({
    mutationFn: createSale,
    onSuccess: () => {
      invalidatePosQueries(queryClient);
      enqueueSnackbar("Order placed on hold", { variant: "success" });
      resetPosForNewSale();
    },
    onError: (err: unknown) => {
      enqueueSnackbar(getFriendlyErrorMessage(err, "Failed to hold order"), {
        variant: "error",
      });
    },
  });

  const updateHoldMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: SalePayload }) =>
      updateSale(id, payload),
    onSuccess: () => {
      invalidatePosQueries(queryClient);
      enqueueSnackbar("Hold order updated", { variant: "success" });
      resetPosForNewSale();
    },
    onError: (err: unknown) => {
      enqueueSnackbar(getFriendlyErrorMessage(err, "Failed to update hold order"), {
        variant: "error",
      });
    },
  });

  const resumeHoldOrder = (sale: Sale) => {
    setActiveHoldSaleId(sale.id);
    setForm({
      ...emptySaleForm(),
      transaction_type: sale.transaction_type,
      sales_type: sale.sales_type,
      pricing_mode: sale.pricing_mode,
      location: sale.location,
      sale_date: sale.sale_date,
      sales_id: sale.sales_id,
      customer_id: sale.customer_id,
      customer_name: sale.customer_name ?? "",
      sub_total: sale.sub_total,
      discount: sale.discount,
      service_charge: sale.service_charge ?? 0,
      net_amount: sale.net_amount,
      offer_id: sale.offer_id ?? null,
      offer_promo_code: sale.offer_promo_code ?? null,
      payment_method: sale.payment_method ?? "Cash",
      notes: sale.notes ?? "",
    });
    setLines(linesFromSale(sale.items));
    const method = (sale.payment_method as PosPaymentMethod) || "Cash";
    setPaymentMethod(method);
    setAmountReceived(sale.amount_received ?? sale.net_amount);
      setChequeDetails(null);
    setHoldPin("");
    setView("checkout");
    enqueueSnackbar(`Loaded hold order ${sale.sales_id}`, { variant: "info" });
  };

  const goToCheckout = () => {
    if (lines.length === 0) {
      enqueueSnackbar("Add at least one product first", { variant: "warning" });
      return;
    }
    setView("checkout");
  };

  const saleBusy =
    saveMutation.isPending ||
    holdMutation.isPending ||
    updateHoldMutation.isPending ||
    completeHoldMutation.isPending;

  const buildSalePayload = (orderStatus: OrderStatus): SalePayload => {
    const stockLocation = resolveSaleLocationFromLines(
      lines.map((l) => l.item_id).filter((id): id is number => id != null),
      rawCatalogItems,
      itemBranch
    );

    return {
      ...form,
      order_status: orderStatus,
      transaction_type:
        activeHoldSaleId && form.transaction_type === TRANSACTION_TYPE_RETURN
          ? TRANSACTION_TYPE_RETURN
          : DEFAULT_TRANSACTION_TYPE,
      sales_type: salesPriceMode,
      pricing_mode: pricingModeFromSalesType(salesPriceMode),
      location: stockLocation,
      sub_total: linesSubTotal,
      net_amount: netAmount,
      discount: Number(form.discount) || 0,
      service_charge: deliveryCharge,
      vat_amount: vatBreakdown.vatAmount,
      vat_rate_id: vatBreakdown.vatRateId,
      offer_id: form.offer_id ?? null,
      offer_applied: Boolean(form.offer_id),
      offer_promo_code: form.offer_promo_code?.trim()
        ? form.offer_promo_code.trim().toUpperCase()
        : null,
      payment_method: paymentMethod,
      amount_received: paymentMethod === "Credit" ? netAmount : amountReceived,
      bank_id: null,
      cheque_number: null,
      items: linesToPayload(lines),
      notes: chequeDetails ? `Cheque payment - ${chequeDetails.bank_name}` : form.notes,
      ...(activeHoldSaleId && holdPin.trim() ? { hold_pin: holdPin.trim() } : {}),
    };
  };

  const requireHoldPin = (): boolean => {
    if (!activeHoldSaleId) return true;
    if (holdPin.trim()) return true;
    enqueueSnackbar("Enter hold order PIN to modify this order", { variant: "warning" });
    return false;
  };

  const handlePaymentSelect = (method: PosPaymentMethod) => {
    setPaymentMethod(method);
    if (method === "Cheque") {
      setChequeDialogOpen(true);
    } else {
      setChequeDetails(null);
      if (method === "Cash") {
        setAmountReceived(netAmount);
      }
    }
  };

  const handleComplete = () => {
    if (lines.length === 0) {
      enqueueSnackbar("Add at least one item", { variant: "warning" });
      return;
    }
    if (paymentMethod === "Cheque" && !chequeDetails) {
      setChequeDialogOpen(true);
      enqueueSnackbar("Enter cheque bank details", { variant: "warning" });
      return;
    }
    if (paymentMethod !== "Credit" && amountReceived < netAmount) {
      enqueueSnackbar("Amount received is less than net amount", { variant: "warning" });
      return;
    }
    if (paymentMethod === "Credit" && !form.customer_id) {
      enqueueSnackbar("Select a customer for credit sales", { variant: "warning" });
      return;
    }
    if (offerNeedsPromo && !String(form.offer_promo_code ?? "").trim()) {
      enqueueSnackbar("Enter the promo code for this offer", { variant: "warning" });
      return;
    }

    const payload = buildSalePayload("completed");
    if (activeHoldSaleId) {
      if (!requireHoldPin()) return;
      completeHoldMutation.mutate({ id: activeHoldSaleId, payload });
      return;
    }
    saveMutation.mutate(payload);
  };

  const handleHold = () => {
    if (lines.length === 0) {
      enqueueSnackbar("Add at least one item", { variant: "warning" });
      return;
    }
    if (offerNeedsPromo && !String(form.offer_promo_code ?? "").trim()) {
      enqueueSnackbar("Enter the promo code for this offer", { variant: "warning" });
      return;
    }

    const payload = buildSalePayload("hold");
    if (activeHoldSaleId) {
      if (!requireHoldPin()) return;
      updateHoldMutation.mutate({ id: activeHoldSaleId, payload });
      return;
    }
    holdMutation.mutate(payload);
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

  const session: PosSaleSession = {
    view,
    setView,
    form,
    setForm,
    lines,
    setLines,
    categoryTab,
    subCategoryTab,
    catalogSearch,
    setCatalogSearch,
    paymentMethod,
    amountReceived,
    setAmountReceived,
    chequeDetails,
    setChequeDialogOpen,
    offerDiscount,
    setOfferDiscount,
    offerPreview,
    setOfferPreview,
    offerUpdating: offerEngine.isFetching,
    offerEngine,
    selectedOffer: selectedOffer ?? null,
    activeHoldSaleId,
    holdPin,
    setHoldPin,
    itemBranch,
    catalogScopeLabel,
    categories,
    loadingCategories,
    loadingItems,
    filteredItems,
    catalogItems,
    customers,
    loadingCustomers,
    applicableOffers,
    allowPriceSwitch,
    allowWholesalePrice,
    allowEditSellingPrice,
    salesPriceMode,
    showBothPricesOnCards,
    showOffers,
    allowDeliveryCharge,
    visibleSubCategories,
    activeCategoryName,
    categoryTabLabel,
    parsedCatalogSearch,
    productOfferMap,
    linesSubTotal,
    netAmount,
    changeDue,
    vatBreakdown,
    saleBusy,
    offerNeedsPromo,
    itemImageByNumber,
    lineImageUrl,
    lineUom,
    handleSalesPriceModeChange,
    handleCategoryTabChange,
    setSubCategoryTab,
    addItemToCart,
    addMainItemToCart,
    openBatchPicker,
    removeFromCart,
    cartQtyForItem: (itemId: number) => cartQtyForItem(lines, itemId),
    handleCatalogSearchSubmit,
    setLineQty,
    setLineUnitPrice,
    updateLineQty,
    handlePaymentSelect,
    handleComplete,
    handleHold,
    resetPosForNewSale,
    resumeHoldOrder,
    savePosSelectedCustomer,
    customerDisplayName,
    goToCheckout,
  };

  return (
    <PosSaleContext.Provider value={session}>
      {view === "products" ? <PosProductSelectPage /> : <PosSaleCheckoutPage />}
      <PosChequeBankDialog
        open={chequeDialogOpen}
        onClose={() => setChequeDialogOpen(false)}
        initialBankName={chequeDetails?.bank_name}
        onConfirm={(d) => {
          setChequeDetails(d);
          setAmountReceived(netAmount);
        }}
      />
      <PosSaleBatchSelectDialog
        open={batchDialogOpen}
        item={batchDialogItem}
        variants={batchDialogVariants}
        batches={batchDialogBatches}
        loading={batchDialogLoading}
        defaultQty={batchDialogQty}
        salesType={salesPriceMode}
        allowNegativeInventory={allowNegativeInventory}
        allowBatchSelection={allowBatchPicker}
        applicableOffers={applicableOffers}
        onClose={() => setBatchDialogOpen(false)}
        onSelectBatch={(batch, qty) => {
          if (batchDialogItem) {
            addItemToCartDirect(batchDialogItem, qty, batch);
          }
          setBatchDialogOpen(false);
        }}
        onSelectBatches={(selections, unbatchedQty) => {
          if (batchDialogItem) {
            addBatchesToCart(batchDialogItem, selections, unbatchedQty);
          }
          setBatchDialogOpen(false);
        }}
        onSelectMainProduct={(qty) => {
          if (batchDialogItem) {
            addItemToCartDirect(batchDialogItem, qty, null);
          }
          setBatchDialogOpen(false);
        }}
        onSelectAutoFefo={(qty) => {
          if (batchDialogItem) {
            addItemToCartDirect(batchDialogItem, qty, null);
          }
          setBatchDialogOpen(false);
        }}
      />
    </PosSaleContext.Provider>
  );
};

export default PosSaleFormPage;
