import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PrintIcon from "@mui/icons-material/Print";
import SaveIcon from "@mui/icons-material/Save";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import PageTitle from "../../../components/PageTitle";
import {
  createSale,
  getNextSalesId,
  getSale,
  getSaleReceipt,
  getSales,
  getSalesPosContext,
  updateSale,
  type Sale,
  type SalePayload,
  type SaleReceiptApiPayload,
} from "../../../api/salesApi";
import { getCustomers } from "../../../api/customersApi";
import { getFriendlyErrorMessage } from "../../../utils/getFriendlyErrorMessage";
import { invalidatePosQueries } from "../../../utils/invalidatePosQueries";
import { SaleSection, fieldSx } from "./SaleFormComponents";
import SaleLineItemsSection, {
  linesFromSale,
  linesToPayload,
  type SaleLineDraft,
} from "./SaleLineItemsSection";
import { DEFAULT_TRANSACTION_TYPE, SALES_TYPES, TRANSACTION_TYPE_RETURN, canReturnSale, isReturnTransaction, transactionTypeLabel } from "./saleConstants";
import { emptySaleForm, formatSaleRs, SALES_BASE } from "./saleFormUtils";
import SaleOfferSection from "./SaleOfferSection";
import { filterOffersForPricingMode } from "./posProductOffers";
import { pricingModeFromSalesType } from "./posSalePricing";
import SaleReturnInvoicePicker from "./SaleReturnInvoicePicker";
import { useSaleOfferEngine } from "./useSaleOfferEngine";
import { printSaleReceiptFromApi } from "./saleReceiptPrint";

const pageSx = {
  width: "100%",
  p: { xs: 2, sm: 3 },
  pb: 10,
  boxSizing: "border-box" as const,
};

type SaleReturnLocationState = {
  returnFromSale?: Sale;
};

const SaleFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const isNew = !id || id === "new";
  const saleId = isNew ? null : Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [form, setForm] = useState<SalePayload>(emptySaleForm());
  const [lines, setLines] = useState<SaleLineDraft[]>([]);
  const [errors, setErrors] = useState<{
    sales_id?: string;
    sale_date?: string;
    products?: string;
  }>({});
  const [offerDiscount, setOfferDiscount] = useState(0);
  const [sourceSaleId, setSourceSaleId] = useState<number | null>(null);
  const sourceSaleIdRef = useRef<number | null>(null);
  const [loadingReturnSource, setLoadingReturnSource] = useState(false);
  const loadedReturnSourceIdRef = useRef<number | null>(null);
  const [savedReturn, setSavedReturn] = useState<{
    sale: Sale;
    receipt?: SaleReceiptApiPayload;
  } | null>(null);
  const [printingReturnReceipt, setPrintingReturnReceipt] = useState(false);

  const applyReturnFromSale = (full: Sale) => {
    if (isReturnTransaction(full.transaction_type)) {
      enqueueSnackbar("This invoice is already a return", { variant: "warning" });
      return false;
    }
    if (full.has_return) {
      enqueueSnackbar("This invoice has been fully returned.", { variant: "warning" });
      return false;
    }
    if (!canReturnSale(full)) {
      enqueueSnackbar("Nothing left to return on this invoice.", { variant: "warning" });
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
    sourceSaleIdRef.current = full.id;
    setSourceSaleId(full.id);
    setLines(linesFromSale(returnLines));
    setOfferDiscount(0);
    setForm((prev) => ({
      ...prev,
      transaction_type: TRANSACTION_TYPE_RETURN,
      customer_id: full.customer_id,
      customer_name: full.customer_name ?? prev.customer_name ?? "",
      location: full.location,
      sales_type: full.sales_type,
      pricing_mode: full.pricing_mode ?? pricingModeFromSalesType(full.sales_type),
      payment_method: full.payment_method ?? "Cash",
      discount: full.discount ?? 0,
      service_charge: full.service_charge ?? 0,
      offer_id: null,
      offer_promo_code: null,
      notes: `Return for invoice ${full.sales_id}`,
    }));
    const totalRemaining = returnLines.reduce((sum, line) => sum + Number(line.qty ?? 0), 0);
    enqueueSnackbar(
      `Loaded ${returnLines.length} item(s) — ${totalRemaining} unit(s) remaining to return from ${full.sales_id}`,
      { variant: "info" }
    );
    return true;
  };

  const { data: filterData } = useQuery({
    queryKey: ["sales", "form-filters"],
    queryFn: () => getSales("all", "all"),
  });

  const { data: posContext } = useQuery({
    queryKey: ["sales-pos-context", form.sale_date],
    queryFn: getSalesPosContext,
  });
  const allApplicableOffers = posContext?.applicable_offers ?? [];
  const salePricingMode = pricingModeFromSalesType(form.sales_type);
  const applicableOffers = useMemo(
    () => filterOffersForPricingMode(allApplicableOffers, salePricingMode),
    [allApplicableOffers, salePricingMode]
  );
  const allowOffers = posContext?.order_settings?.allow_offer !== false;

  const transactionTypes = filterData?.transaction_types ?? [DEFAULT_TRANSACTION_TYPE];
  const salesTypes = filterData?.sales_types ?? SALES_TYPES;
  const paymentMethods = filterData?.payment_methods ?? ["Cash"];
  const locationOptions = useMemo(() => {
    const locs = filterData?.locations ?? ["Main Location"];
    if (form.location && !locs.includes(form.location)) {
      return [...locs, form.location];
    }
    return locs;
  }, [filterData?.locations, form.location]);

  const { data: customersData } = useQuery({
    queryKey: ["customers", "sale-form"],
    queryFn: () => getCustomers(),
  });
  const customers = customersData?.customers ?? [];

  const {
    data: existing,
    isLoading: loadingSale,
    isError: loadError,
    error: loadErr,
  } = useQuery({
    queryKey: ["sale", saleId],
    queryFn: () => getSale(saleId!),
    enabled: saleId != null && !Number.isNaN(saleId),
  });

  useEffect(() => {
    if (!isNew) return;
    getNextSalesId()
      .then((salesId) => setForm((prev) => ({ ...prev, sales_id: salesId })))
      .catch(() => {});
  }, [isNew]);

  useEffect(() => {
    if (!isNew) return;

    const isReturn =
      searchParams.get("type") === "return" ||
      searchParams.get("transaction_type") === TRANSACTION_TYPE_RETURN;
    const sourceIdParam = searchParams.get("sourceSaleId");
    const sourceId = sourceIdParam ? Number(sourceIdParam) : NaN;
    const stateSale = (location.state as SaleReturnLocationState | null)?.returnFromSale;
    const targetId = !Number.isNaN(sourceId) ? sourceId : stateSale?.id;

    if (isReturn) {
      setForm((prev) =>
        prev.transaction_type === TRANSACTION_TYPE_RETURN
          ? prev
          : { ...prev, transaction_type: TRANSACTION_TYPE_RETURN }
      );
    }

    if (!isReturn && (targetId == null || Number.isNaN(targetId))) return;
    if (targetId != null && loadedReturnSourceIdRef.current === targetId) return;

    const finishReturnNavigation = () => {
      if (searchParams.toString()) {
        setSearchParams({}, { replace: true });
      }
      if (stateSale) {
        navigate(location.pathname, { replace: true, state: {} });
      }
    };

    const loadReturnSource = async () => {
      if (targetId == null || Number.isNaN(targetId)) {
        if (isReturn) finishReturnNavigation();
        return;
      }

      loadedReturnSourceIdRef.current = targetId;
      setLoadingReturnSource(true);
      try {
        const full = await getSale(targetId);
        if (isReturnTransaction(full.transaction_type)) {
          enqueueSnackbar("This invoice is already a return", { variant: "warning" });
          loadedReturnSourceIdRef.current = null;
          return;
        }
        if (!canReturnSale(full)) {
          enqueueSnackbar(
            full.has_return
              ? "This invoice has been fully returned."
              : "Nothing left to return on this invoice.",
            { variant: "warning" }
          );
          loadedReturnSourceIdRef.current = null;
          return;
        }
        applyReturnFromSale(full);
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
  }, [
    isNew,
    searchParams,
    location.state,
    location.pathname,
    navigate,
    setSearchParams,
    enqueueSnackbar,
  ]);

  useEffect(() => {
    if (!existing) return;
    setForm({
      transaction_type: existing.transaction_type,
      sales_type: existing.sales_type,
      location: existing.location,
      sale_date: existing.sale_date,
      sales_id: existing.sales_id,
      customer_id: existing.customer_id,
      customer_name: existing.customer_name ?? "",
      sub_total: existing.sub_total,
      discount: existing.discount,
      net_amount: existing.net_amount,
      offer_id: existing.offer_id ?? null,
      offer_promo_code: existing.offer_promo_code ?? null,
      payment_method: existing.payment_method,
      notes: existing.notes ?? "",
    });
    setLines(linesFromSale(existing.items));
  }, [existing]);

  const linesSubTotal = useMemo(
    () => lines.reduce((sum, l) => sum + (l.line_total || 0), 0),
    [lines]
  );

  const isReturnSaleForm = isReturnTransaction(form.transaction_type);

  const returnLineTotals = useMemo(() => {
    if (!isReturnSaleForm) return null;
    return lines.reduce(
      (acc, line) => ({
        sold: acc.sold + Number(line.sold_qty ?? line.qty ?? 0),
        returned: acc.returned + Number(line.returned_qty ?? 0),
        remaining: acc.remaining + Number(line.max_return_qty ?? line.qty ?? 0),
        returning: acc.returning + Number(line.qty ?? 0),
      }),
      { sold: 0, returned: 0, remaining: 0, returning: 0 }
    );
  }, [isReturnSaleForm, lines]);

  useEffect(() => {
    if (lines.length > 0) {
      setForm((prev) => ({ ...prev, sub_total: Math.round(linesSubTotal * 100) / 100 }));
    }
  }, [linesSubTotal, lines.length]);

  const computedAmount = useMemo(() => {
    const sub = lines.length > 0 ? linesSubTotal : Number(form.sub_total) || 0;
    const disc = Number(form.discount) || 0;
    return Math.max(0, sub - disc - offerDiscount);
  }, [linesSubTotal, lines.length, form.sub_total, form.discount, offerDiscount]);

  const handleOfferChange = useCallback(
    (patch: { offer_id?: number | null; offer_promo_code?: string | null }) => {
      setForm((prev) => ({ ...prev, ...patch }));
    },
    []
  );

  const offerEngine = useSaleOfferEngine({
    allowOffers,
    applicableOffers,
    offerId: form.offer_id,
    offerPromoCode: form.offer_promo_code,
    saleDate: form.sale_date ?? "",
    lines,
    onOfferChange: handleOfferChange,
    onOfferDiscountChange: setOfferDiscount,
  });

  const selectedOffer = offerEngine.selectedOffer;
  const offerNeedsPromo = Boolean(selectedOffer?.requires_promo_code);

  useEffect(() => {
    if (
      form.offer_id != null &&
      !applicableOffers.some((offer) => offer.id === form.offer_id)
    ) {
      setForm((prev) => ({ ...prev, offer_id: null, offer_promo_code: null }));
      setOfferDiscount(0);
    }
  }, [applicableOffers, form.offer_id]);

  const setField = <K extends keyof SalePayload>(key: K, value: SalePayload[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!form.sales_id?.trim()) next.sales_id = "Sales ID is required";
    if (!form.sale_date) next.sale_date = "Date is required";
    if (lines.length === 0) next.products = "Add at least one product";
    if (offerNeedsPromo && !String(form.offer_promo_code ?? "").trim()) {
      enqueueSnackbar("Enter the promo code for this offer", { variant: "warning" });
      return false;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const cust = customers.find((c) => c.id === form.customer_id);
      const customerName =
        form.customer_name?.trim() ||
        cust?.customer_name ||
        cust?.business_name ||
        cust?.first_name ||
        null;

      const savingReturn = isReturnTransaction(form.transaction_type);

      const payload: SalePayload = {
        ...form,
        transaction_type: savingReturn ? TRANSACTION_TYPE_RETURN : (form.transaction_type ?? DEFAULT_TRANSACTION_TYPE),
        returned_from_sale_id: savingReturn ? (sourceSaleIdRef.current ?? sourceSaleId) : null,
        sub_total: lines.length > 0 ? linesSubTotal : form.sub_total,
        net_amount: computedAmount,
        offer_id: savingReturn ? null : (form.offer_id ?? null),
        offer_applied: savingReturn ? false : Boolean(form.offer_id),
        offer_promo_code: savingReturn
          ? null
          : form.offer_promo_code?.trim()
            ? form.offer_promo_code.trim().toUpperCase()
            : null,
        items: linesToPayload(lines),
        customer_name: customerName,
      };
      if (isNew) {
        return createSale(payload);
      }
      const sale = await updateSale(saleId!, payload);
      return { sale };
    },
    onSuccess: (result) => {
      const saved = result.sale;
      invalidatePosQueries(queryClient);
      const wasReturn = isReturnTransaction(saved.transaction_type);
      if (wasReturn) {
        setSavedReturn({ sale: saved, receipt: result.receipt });
        return;
      }
      enqueueSnackbar(isNew ? "Sale created" : "Sale updated", { variant: "success" });
      navigate(SALES_BASE);
    },
    onError: (err: unknown) => {
      enqueueSnackbar(getFriendlyErrorMessage(err, "Failed to save sale"), { variant: "error" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) saveMutation.mutate();
  };

  const printSavedReturnReceipt = async () => {
    if (!savedReturn) return;
    setPrintingReturnReceipt(true);
    try {
      const receipt =
        savedReturn.receipt ?? (await getSaleReceipt(savedReturn.sale.id));
      printSaleReceiptFromApi(receipt);
    } catch (err: unknown) {
      enqueueSnackbar(getFriendlyErrorMessage(err, "Could not print return receipt"), {
        variant: "error",
      });
    } finally {
      setPrintingReturnReceipt(false);
    }
  };

  const finishAfterReturn = () => {
    setSavedReturn(null);
    navigate(SALES_BASE, { state: { transactionTypeFilter: TRANSACTION_TYPE_RETURN } });
  };

  if (!isNew && loadingSale) {
    return (
      <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
        <CircularProgress sx={{ color: "var(--pallet-blue)" }} />
      </Box>
    );
  }

  if (!isNew && loadError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{getFriendlyErrorMessage(loadErr, "Failed to load sale")}</Alert>
        <Button component={Link} to={SALES_BASE} sx={{ mt: 2 }}>
          Back to Sales
        </Button>
      </Box>
    );
  }

  const isReturnSale = isReturnSaleForm;

  const loadReturnFromInvoice = async (sale: Sale) => {
    setLoadingReturnSource(true);
    try {
      const full = await getSale(sale.id);
      loadedReturnSourceIdRef.current = full.id;
      applyReturnFromSale(full);
    } catch (err: unknown) {
      enqueueSnackbar(getFriendlyErrorMessage(err, "Could not load invoice"), {
        variant: "error",
      });
    } finally {
      setLoadingReturnSource(false);
    }
  };

  const handleReturnCustomerChange = (cid: number | null, name: string) => {
    loadedReturnSourceIdRef.current = null;
    sourceSaleIdRef.current = null;
    setSourceSaleId(null);
    setLines([]);
    setOfferDiscount(0);
    setForm((prev) => ({
      ...prev,
      customer_id: cid,
      customer_name: name,
      discount: 0,
      offer_id: null,
      offer_promo_code: null,
      notes: "",
    }));
  };

  return (
    <Box sx={pageSx}>
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: "var(--app-bg)",
          pb: 2,
          mb: 1,
          borderBottom: "1px solid var(--surface-border)",
        }}
      >
        <Button
          component={Link}
          to={SALES_BASE}
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 1, color: "text.secondary", textTransform: "none" }}
        >
          Back to Sales
        </Button>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <PageTitle
            title={isNew ? (isReturnSale ? "Sales Return" : "Add Sale") : "Edit Sale"}
            subtitle="Sales ID, customer, products, and amounts"
          />
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button component={Link} to={SALES_BASE} sx={{ textTransform: "none" }}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="sale-form"
              variant="contained"
              startIcon={
                saveMutation.isPending ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <SaveIcon />
                )
              }
              disabled={saveMutation.isPending}
              sx={{
                bgcolor: "var(--pallet-blue)",
                textTransform: "none",
                fontWeight: 600,
                "&:hover": { bgcolor: "var(--pallet-main-blue)" },
              }}
            >
              {saveMutation.isPending ? "Saving…" : isNew ? (isReturnSale ? "Save Return" : "Add Sale") : "Update Sale"}
            </Button>
          </Box>
        </Box>
      </Box>

      <form id="sale-form" onSubmit={handleSubmit}>
        {isReturnSale && isNew && returnLineTotals && sourceSaleId ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Sold: <strong>{returnLineTotals.sold}</strong>
            {" · "}Already returned: <strong>{returnLineTotals.returned}</strong>
            {" · "}Remaining to return: <strong>{returnLineTotals.remaining}</strong>
            {" · "}This return: <strong>{returnLineTotals.returning}</strong>
          </Alert>
        ) : null}
        {isReturnSale && isNew && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {sourceSaleId
              ? "Original invoice loaded — adjust return quantities (partial returns allowed), then save. Stock goes back to inventory."
              : "Select the customer, click their original sale invoice, then save the return. You can return part of the qty and return the rest later."}
          </Alert>
        )}
        {loadingReturnSource && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <CircularProgress size={22} sx={{ color: "var(--pallet-blue)" }} />
            <Typography variant="body2" color="text.secondary">
              Loading original invoice…
            </Typography>
          </Box>
        )}
        <Grid container spacing={2} alignItems="flex-start">
          <Grid item xs={12} lg={7}>
            <SaleSection title="General Information">
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small" sx={fieldSx}>
                    <InputLabel shrink>Transaction Type</InputLabel>
                    <Select
                      label="Transaction Type"
                      value={form.transaction_type ?? DEFAULT_TRANSACTION_TYPE}
                      onChange={(e) => setField("transaction_type", e.target.value)}
                      notched
                    >
                      {transactionTypes.map((t) => (
                        <MenuItem key={t} value={t}>
                          {transactionTypeLabel(t)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small" sx={fieldSx}>
                    <InputLabel shrink>Sales Type</InputLabel>
                    <Select
                      label="Sales Type"
                      value={form.sales_type ?? "Retail"}
                      onChange={(e) => setField("sales_type", e.target.value)}
                      notched
                    >
                      {salesTypes.map((t) => (
                        <MenuItem key={t} value={t}>
                          {t}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small" sx={fieldSx}>
                    <InputLabel shrink>Location</InputLabel>
                    <Select
                      label="Location"
                      value={form.location ?? "Main Location"}
                      onChange={(e) => setField("location", e.target.value)}
                      notched
                    >
                      {locationOptions.map((loc) => (
                        <MenuItem key={loc} value={loc}>
                          {loc}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Date"
                    type="date"
                    required
                    value={form.sale_date ?? ""}
                    onChange={(e) => {
                      setField("sale_date", e.target.value);
                      if (errors.sale_date) setErrors((p) => ({ ...p, sale_date: undefined }));
                    }}
                    error={!!errors.sale_date}
                    helperText={errors.sale_date}
                    InputLabelProps={{ shrink: true }}
                    sx={fieldSx}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Sales ID"
                    required
                    value={form.sales_id}
                    onChange={(e) => {
                      setField("sales_id", e.target.value);
                      if (errors.sales_id) setErrors((p) => ({ ...p, sales_id: undefined }));
                    }}
                    error={!!errors.sales_id}
                    helperText={errors.sales_id}
                    InputLabelProps={{ shrink: true }}
                    sx={fieldSx}
                  />
                </Grid>
              </Grid>
            </SaleSection>

            <SaleSection title={isReturnSale ? "Customer" : "Customer (optional)"}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small" sx={fieldSx} required={isReturnSale}>
                    <InputLabel shrink>Customer</InputLabel>
                    <Select
                      label="Customer"
                      value={form.customer_id ?? ""}
                      onChange={(e) => {
                        const cid = e.target.value === "" ? null : Number(e.target.value);
                        const c = customers.find((x) => x.id === cid);
                        const name =
                          c?.customer_name || c?.business_name || c?.first_name || "";
                        if (isReturnSale) {
                          handleReturnCustomerChange(cid, name);
                        } else {
                          setForm((prev) => ({
                            ...prev,
                            customer_id: cid,
                            customer_name: name,
                          }));
                        }
                      }}
                      displayEmpty
                      notched
                    >
                      <MenuItem value="">
                        <em>{isReturnSale ? "Select customer" : "Walk-in / no customer"}</em>
                      </MenuItem>
                      {customers.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.customer_name || c.business_name || c.first_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Customer name"
                    value={form.customer_name ?? ""}
                    onChange={(e) => setField("customer_name", e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={fieldSx}
                  />
                </Grid>
              </Grid>
              {isReturnSale && isNew && (
                <Box sx={{ mt: 2 }}>
                  <SaleReturnInvoicePicker
                    customerId={form.customer_id}
                    selectedSaleId={sourceSaleId}
                    onSelect={loadReturnFromInvoice}
                    loadingSelection={loadingReturnSource}
                  />
                </Box>
              )}
            </SaleSection>

            <Box sx={{ mt: 0 }}>
              {errors.products && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {errors.products}
                </Alert>
              )}
              <SaleLineItemsSection
                lines={lines}
                onChange={(next) => {
                  setLines(next);
                  if (errors.products) setErrors((p) => ({ ...p, products: undefined }));
                }}
                locationFilter={form.location}
                returnMode={isReturnSale && isNew}
              />
            </Box>
          </Grid>

          <Grid item xs={12} lg={5}>
            <SaleSection title="Amount & Payment">
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Sub Total"
                    type="number"
                    value={lines.length > 0 ? linesSubTotal : form.sub_total}
                    onChange={(e) => setField("sub_total", parseFloat(e.target.value) || 0)}
                    InputProps={{
                      readOnly: lines.length > 0,
                      startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                    }}
                    helperText={lines.length > 0 ? "Calculated from product lines" : undefined}
                    inputProps={{ min: 0, step: "0.01" }}
                    InputLabelProps={{ shrink: true }}
                    sx={fieldSx}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Discount"
                    type="number"
                    value={form.discount}
                    onChange={(e) => setField("discount", parseFloat(e.target.value) || 0)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                    }}
                    inputProps={{ min: 0, step: "0.01" }}
                    InputLabelProps={{ shrink: true }}
                    sx={fieldSx}
                  />
                </Grid>
                {allowOffers && !isReturnSale && (
                  <Grid item xs={12}>
                    <SaleOfferSection
                      allowOffers={allowOffers}
                      applicableOffers={applicableOffers}
                      offerId={form.offer_id}
                      offerPromoCode={form.offer_promo_code}
                      onOfferChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
                      engine={offerEngine}
                    />
                  </Grid>
                )}
                {offerDiscount > 0 && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Offer Discount"
                      value={offerDiscount.toFixed(2)}
                      InputProps={{
                        readOnly: true,
                        startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                      }}
                      InputLabelProps={{ shrink: true }}
                      sx={fieldSx}
                    />
                  </Grid>
                )}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Net Amount"
                    value={computedAmount.toFixed(2)}
                    InputProps={{
                      readOnly: true,
                      startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                    }}
                    helperText="Sub Total − Discount − Offer"
                    InputLabelProps={{ shrink: true }}
                    sx={fieldSx}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small" sx={fieldSx}>
                    <InputLabel shrink>Payment Method</InputLabel>
                    <Select
                      label="Payment Method"
                      value={form.payment_method ?? "Cash"}
                      onChange={(e) => setField("payment_method", e.target.value)}
                      notched
                    >
                      {paymentMethods.map((m) => (
                        <MenuItem key={m} value={m}>
                          {m}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </SaleSection>

            <Box
              sx={{
                p: 2,
                bgcolor: "var(--surface-bg-alt)",
                border: "1px solid #d0e3ff",
                borderRadius: 1,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Net amount
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: "var(--pallet-blue)", mt: 0.5 }}>
                {formatSaleRs(computedAmount)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                Sales ID: {form.sales_id || "—"} · {form.payment_method ?? "Cash"}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <SaleSection title="Notes">
              <TextField
                fullWidth
                size="small"
                label="Note"
                multiline
                minRows={3}
                value={form.notes ?? ""}
                onChange={(e) => setField("notes", e.target.value)}
                placeholder="Additional notes for this sale…"
                InputLabelProps={{ shrink: true }}
                sx={fieldSx}
              />
            </SaleSection>
          </Grid>
        </Grid>

        <Box
          sx={{
            position: "sticky",
            bottom: 0,
            mt: 3,
            py: 2,
            px: 2,
            bgcolor: "var(--surface-bg)",
            borderTop: "1px solid var(--surface-border)",
            display: "flex",
            justifyContent: "flex-end",
            gap: 2,
            boxShadow: "0 -4px 12px rgba(0,0,0,0.06)",
          }}
        >
          <Button component={Link} to={SALES_BASE} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saveMutation.isPending}
            startIcon={saveMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
            sx={{
              bgcolor: "var(--pallet-blue)",
              textTransform: "none",
              minWidth: 140,
              "&:hover": { bgcolor: "var(--pallet-main-blue)" },
            }}
          >
            {saveMutation.isPending ? "Saving…" : isNew ? (isReturnSale ? "Save Return" : "Add Sale") : "Update Sale"}
          </Button>
        </Box>
      </form>

      <Dialog open={savedReturn != null} onClose={finishAfterReturn} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Return saved</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Return <strong>{savedReturn?.sale.sales_id}</strong> was recorded. If any quantity remains
            on the original sale, you can process another partial return later. View returns under{" "}
            <strong>Transaction Type → Return</strong> on the Sales Dashboard.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={finishAfterReturn} sx={{ textTransform: "none" }}>
            Done
          </Button>
          <Button
            variant="contained"
            onClick={() => void printSavedReturnReceipt()}
            disabled={printingReturnReceipt}
            startIcon={
              printingReturnReceipt ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <PrintIcon />
              )
            }
            sx={{ textTransform: "none", bgcolor: "var(--pallet-blue)" }}
          >
            Print return receipt
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SaleFormPage;
