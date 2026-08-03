import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PrintIcon from "@mui/icons-material/Print";
import SaveIcon from "@mui/icons-material/Save";
import { Link, useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import PageTitle from "../../../components/PageTitle";
import {
  createPurchase,
  getNextInvoiceId,
  getPurchase,
  getPurchases,
  updatePurchase,
  type PurchasePayload,
} from "../../../api/purchasesApi";
import { fetchBanks } from "../../../api/Settings/bankApi";
import { getSuppliers } from "../../../api/suppliersApi";
import { getFriendlyErrorMessage } from "../../../utils/getFriendlyErrorMessage";
import { invalidatePosQueries } from "../../../utils/invalidatePosQueries";
import { PurchaseSection, fieldSx } from "./PurchaseFormComponents";
import PurchaseLineItemsSection, {
  linesFromPurchase,
  linesToPayload,
  type PurchaseLineDraft,
} from "./PurchaseLineItemsSection";
import { DEFAULT_PURCHASE_TYPE, NET_TERMS_OPTIONS, purchaseTypeLabel, WALK_IN_SUPPLIER_LABEL } from "./purchaseConstants";
import BranchLocationSelect from "../../../components/BranchLocationSelect";
import { useBranchLocations } from "../../../hooks/useBranchLocations";
import { setActiveLocation } from "../../../utils/posActiveLocation";
import PurchaseSupplierSelectArea, {
  supplierDisplayName,
} from "./PurchaseSupplierSelectArea";
import {
  POS_PAYMENT_OPTIONS,
  type PosPaymentMethod,
} from "../sales/posSaleConstants";
import PurchaseChequeFields from "./PurchaseChequeFields";
import { buildPurchaseChequeNotes, resolveBankName } from "./purchaseChequeUtils";
import {
  buildDraftPurchaseInvoice,
  printPurchaseInvoiceAsync,
} from "./purchaseReceiptPrint";
import {
  emptyPurchaseForm,
  formatPurchaseRs,
  PURCHASES_BASE,
  resolvePurchaseSupplierName,
} from "./purchaseFormUtils";

const pageSx = {
  width: "100%",
  p: { xs: 2, sm: 3 },
  pb: 10,
  boxSizing: "border-box" as const,
};

const PurchaseFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const purchaseId = isNew ? null : Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [form, setForm] = useState<PurchasePayload>(emptyPurchaseForm());
  const [lines, setLines] = useState<PurchaseLineDraft[]>([]);
  const [errors, setErrors] = useState<{
    invoice_id?: string;
    supplier_name?: string;
    purchase_date?: string;
    products?: string;
    amount?: string;
    bank_id?: string;
    cheque_number?: string;
  }>({});

  const { data: filterData } = useQuery({
    queryKey: ["purchases", "form-filters"],
    queryFn: () => getPurchases("all", "all"),
  });

  const purchaseTypes = filterData?.purchase_types ?? [DEFAULT_PURCHASE_TYPE];
  const paymentMethods = filterData?.payment_methods ?? ["Cash"];
  const { defaultLocation, manageMultiple } = useBranchLocations([], { branchesOnly: true });
  const [printInvoicePending, setPrintInvoicePending] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState(0);
  const itemBranch = form.location ?? defaultLocation;

  const { data: banks = [], isLoading: loadingBanks } = useQuery({
    queryKey: ["banks"],
    queryFn: fetchBanks,
  });

  const { data: suppliersData, isLoading: loadingSuppliers } = useQuery({
    queryKey: ["suppliers", "purchase", "all"],
    queryFn: () => getSuppliers("all"),
  });
  const suppliers = suppliersData?.suppliers ?? [];

  const {
    data: existing,
    isLoading: loadingPurchase,
    isError: loadError,
    error: loadErr,
  } = useQuery({
    queryKey: ["purchase", purchaseId],
    queryFn: () => getPurchase(purchaseId!),
    enabled: purchaseId != null && !Number.isNaN(purchaseId),
  });

  useEffect(() => {
    if (!isNew) return;
    getNextInvoiceId()
      .then((invoiceId) => setForm((prev) => ({ ...prev, invoice_id: invoiceId })))
      .catch(() => {});
    setForm((prev) => ({ ...prev, location: prev.location || defaultLocation }));
  }, [isNew, defaultLocation]);

  useEffect(() => {
    if (form.location) {
      setActiveLocation(form.location);
    }
  }, [form.location]);

  useEffect(() => {
    if (!existing) return;
    setForm({
      purchase_type: existing.purchase_type,
      location: existing.location,
      purchase_date: existing.purchase_date,
      invoice_id: existing.invoice_id,
      supplier_id: existing.supplier_id,
      supplier_name: existing.supplier_name,
      sub_total: existing.sub_total,
      discount: existing.discount,
      amount: existing.amount,
      net_terms: existing.net_terms ?? "30 Days",
      payment_method: existing.payment_method ?? "Cash",
      bank_id: existing.bank_id ?? null,
      cheque_number: existing.cheque_number ?? null,
      notes: existing.notes ?? "",
    });
    setLines(linesFromPurchase(existing.items));
    setPurchaseAmount(existing.amount ?? 0);
  }, [existing]);

  const linesSubTotal = useMemo(
    () => lines.reduce((sum, l) => sum + (l.line_total || 0), 0),
    [lines]
  );

  useEffect(() => {
    if (lines.length > 0) {
      setForm((prev) => ({ ...prev, sub_total: Math.round(linesSubTotal * 100) / 100 }));
    }
  }, [linesSubTotal, lines.length]);

  const computedAmount = useMemo(() => {
    const sub = lines.length > 0 ? linesSubTotal : Number(form.sub_total) || 0;
    const disc = Number(form.discount) || 0;
    return Math.max(0, sub - disc);
  }, [linesSubTotal, lines.length, form.sub_total, form.discount]);

  useEffect(() => {
    setPurchaseAmount(Math.round(computedAmount * 100) / 100);
  }, [computedAmount]);

  const setField = <K extends keyof PurchasePayload>(key: K, value: PurchasePayload[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
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
      setPurchaseAmount(Math.round(computedAmount * 100) / 100);
    }
  };

  const validate = (): boolean => {
    const next: typeof errors = {};
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
      next.amount =
        form.payment_method === "Cheque"
          ? "Cheque amount is less than total"
          : "Purchase amount is less than total";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: PurchasePayload = {
        ...form,
        location: itemBranch,
        sub_total: lines.length > 0 ? linesSubTotal : form.sub_total,
        amount: purchaseAmount,
        items: linesToPayload(lines),
        payment_method: form.payment_method ?? "Cash",
        bank_id: form.bank_id ?? null,
        cheque_number: form.cheque_number?.trim() || null,
        supplier_name: resolvePurchaseSupplierName(form, suppliers),
        notes:
          form.payment_method === "Cheque" && form.cheque_number?.trim() && form.bank_id
            ? buildPurchaseChequeNotes(
                form.cheque_number,
                resolveBankName(banks, form.bank_id),
                form.notes
              )
            : form.notes,
      };
      if (!payload.supplier_name) {
        throw new Error("Select a supplier");
      }
      if (isNew) return createPurchase(payload);
      return updatePurchase(purchaseId!, payload);
    },
    onSuccess: () => {
      invalidatePosQueries(queryClient);
      enqueueSnackbar(isNew ? "Purchase created" : "Purchase updated", { variant: "success" });
      navigate(PURCHASES_BASE);
    },
    onError: (err: unknown) => {
      enqueueSnackbar(getFriendlyErrorMessage(err, "Failed to save purchase"), { variant: "error" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) saveMutation.mutate();
  };

  const handlePrintInvoice = async () => {
    if (lines.length === 0) {
      enqueueSnackbar("Add at least one product to print", { variant: "warning" });
      return;
    }
    setPrintInvoicePending(true);
    try {
      if (!isNew && purchaseId != null && !Number.isNaN(purchaseId)) {
        await printPurchaseInvoiceAsync(purchaseId);
      } else {
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
      }
    } catch (err: unknown) {
      enqueueSnackbar(getFriendlyErrorMessage(err, "Could not print purchase invoice"), {
        variant: "error",
      });
    } finally {
      setPrintInvoicePending(false);
    }
  };

  if (!isNew && loadingPurchase) {
    return (
      <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
        <CircularProgress sx={{ color: "var(--pallet-blue)" }} />
      </Box>
    );
  }

  if (!isNew && loadError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{getFriendlyErrorMessage(loadErr, "Failed to load purchase")}</Alert>
        <Button component={Link} to={PURCHASES_BASE} sx={{ mt: 2 }}>
          Back to Purchasing
        </Button>
      </Box>
    );
  }

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
          to={PURCHASES_BASE}
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 1, color: "text.secondary", textTransform: "none" }}
        >
          Back to Purchasing
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
            title={isNew ? "Add Purchase" : "Edit Purchase"}
            subtitle="Invoice details, supplier, amounts, and payment terms"
          />
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button component={Link} to={PURCHASES_BASE} sx={{ textTransform: "none" }}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="purchase-form"
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
              {saveMutation.isPending ? "Saving…" : isNew ? "Add Purchase" : "Update Purchase"}
            </Button>
          </Box>
        </Box>
      </Box>

      <form id="purchase-form" onSubmit={handleSubmit}>
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, mb: 2 }}>
          {manageMultiple && (
            <BranchLocationSelect
              branchesOnly
              value={itemBranch}
              onChange={(loc) => {
                if (loc === "all") return;
                setActiveLocation(loc);
                setField("location", loc);
              }}
              label="Branch (stock)"
            />
          )}
        </Box>
        <Grid container spacing={2} alignItems="stretch" sx={{ mb: 2 }}>
          <Grid item xs={12} lg={3.5}>
            <Box sx={{ p: 1.5, border: "1px solid var(--surface-border)", borderRadius: 1.5, bgcolor: "var(--surface-bg-alt)", height: "100%" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Purchase</Typography>
              <PurchaseSupplierSelectArea
                suppliers={suppliers}
                isLoading={loadingSuppliers}
                selectedSupplierId={form.supplier_id ?? null}
                selectedSupplierName={form.supplier_name}
                error={errors.supplier_name}
                onSelect={(supplier) => {
                  setForm((prev) => ({
                    ...prev,
                    supplier_id: supplier?.id ?? null,
                    supplier_name: supplier
                      ? supplierDisplayName(supplier)
                      : WALK_IN_SUPPLIER_LABEL,
                  }));
                  if (errors.supplier_name) {
                    setErrors((p) => ({ ...p, supplier_name: undefined }));
                  }
                }}
              />
              <Grid container spacing={1} sx={{ mt: 0.5 }}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Date"
                    type="date"
                    required
                    value={form.purchase_date ?? ""}
                    onChange={(e) => setField("purchase_date", e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Invoice"
                    value={form.invoice_id}
                    onChange={(e) => setField("invoice_id", e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel shrink>Purchase Type</InputLabel>
                    <Select
                      label="Purchase Type"
                      value={form.purchase_type ?? DEFAULT_PURCHASE_TYPE}
                      onChange={(e) => setField("purchase_type", e.target.value)}
                      notched
                    >
                      {purchaseTypes.map((t) => (
                        <MenuItem key={t} value={t}>{purchaseTypeLabel(t)}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Discount"
                    type="number"
                    value={form.discount}
                    onChange={(e) => setField("discount", parseFloat(e.target.value) || 0)}
                    InputProps={{ startAdornment: <InputAdornment position="start">Rs</InputAdornment> }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Total"
                    value={computedAmount.toFixed(2)}
                    InputProps={{ readOnly: true, startAdornment: <InputAdornment position="start">Rs</InputAdornment> }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel shrink>Payment method</InputLabel>
                    <Select
                      label="Payment method"
                      value={form.payment_method ?? "Cash"}
                      onChange={(e) => handlePaymentSelect(e.target.value as PosPaymentMethod)}
                      notched
                    >
                      {(paymentMethods.length > 0 ? paymentMethods : POS_PAYMENT_OPTIONS.map((o) => o.value)).map((m) => (
                        <MenuItem key={m} value={m}>{POS_PAYMENT_OPTIONS.find((o) => o.value === m)?.label ?? m}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                {form.payment_method === "Cheque" ? (
                  <Grid item xs={12}>
                    <PurchaseChequeFields
                      banks={banks}
                      loadingBanks={loadingBanks}
                      bankId={form.bank_id ?? null}
                      chequeNumber={form.cheque_number ?? ""}
                      chequeAmount={purchaseAmount}
                      bankError={errors.bank_id}
                      chequeNumberError={errors.cheque_number}
                      amountError={errors.amount}
                      onBankChange={(bankId) => setField("bank_id", bankId)}
                      onChequeNumberChange={(chequeNumber) =>
                        setField("cheque_number", chequeNumber)
                      }
                      onChequeAmountChange={setPurchaseAmount}
                      onClearError={(key) =>
                        setErrors((prev) => ({ ...prev, [key]: undefined }))
                      }
                    />
                  </Grid>
                ) : null}
              </Grid>
              <Box sx={{ display: "flex", gap: 1, mt: 1.5 }}>
                <Button component={Link} to={PURCHASES_BASE} fullWidth variant="outlined" sx={{ textTransform: "none" }}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={saveMutation.isPending}
                  startIcon={saveMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                  sx={{ bgcolor: "#0b7a45", textTransform: "none", "&:hover": { bgcolor: "#09673b" } }}
                >
                  {saveMutation.isPending ? "Saving..." : "Pay"}
                </Button>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} lg={8.5}>
            {errors.products && (
              <Alert severity="warning" sx={{ mb: 1.5 }}>
                {errors.products}
              </Alert>
            )}
            <PurchaseLineItemsSection
              lines={lines}
              onChange={(next) => {
                setLines(next);
                if (errors.products) setErrors((p) => ({ ...p, products: undefined }));
              }}
              locationFilter={itemBranch}
            />
          </Grid>
        </Grid>
        <Box sx={{ display: "none" }}>

        <PurchaseSupplierSelectArea
          suppliers={suppliers}
          isLoading={loadingSuppliers}
          selectedSupplierId={form.supplier_id ?? null}
          selectedSupplierName={form.supplier_name}
          error={errors.supplier_name}
          onSelect={(supplier) => {
            setForm((prev) => ({
              ...prev,
              supplier_id: supplier?.id ?? null,
              supplier_name: supplier
                ? supplierDisplayName(supplier)
                : WALK_IN_SUPPLIER_LABEL,
            }));
            if (errors.supplier_name) {
              setErrors((p) => ({ ...p, supplier_name: undefined }));
            }
          }}
        />

        <Grid container spacing={2} alignItems="flex-start">
          <Grid item xs={12} lg={7}>
            <PurchaseSection title="General Information">
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small" sx={fieldSx}>
                    <InputLabel shrink>Purchase Type</InputLabel>
                    <Select
                      label="Purchase Type"
                      value={form.purchase_type ?? DEFAULT_PURCHASE_TYPE}
                      onChange={(e) => setField("purchase_type", e.target.value)}
                      notched
                    >
                      {purchaseTypes.map((t) => (
                        <MenuItem key={t} value={t}>
                          {purchaseTypeLabel(t)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                {!manageMultiple && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Branch"
                      value={form.location ?? "Main Location"}
                      InputProps={{ readOnly: true }}
                      InputLabelProps={{ shrink: true }}
                      sx={fieldSx}
                    />
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Date"
                    type="date"
                    required
                    value={form.purchase_date ?? ""}
                    onChange={(e) => {
                      setField("purchase_date", e.target.value);
                      if (errors.purchase_date) setErrors((p) => ({ ...p, purchase_date: undefined }));
                    }}
                    error={!!errors.purchase_date}
                    helperText={errors.purchase_date}
                    InputLabelProps={{ shrink: true }}
                    sx={fieldSx}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Invoice ID"
                    required
                    value={form.invoice_id}
                    onChange={(e) => {
                      setField("invoice_id", e.target.value);
                      if (errors.invoice_id) setErrors((p) => ({ ...p, invoice_id: undefined }));
                    }}
                    error={!!errors.invoice_id}
                    helperText={errors.invoice_id}
                    InputLabelProps={{ shrink: true }}
                    sx={fieldSx}
                  />
                </Grid>
              </Grid>
            </PurchaseSection>

          </Grid>

          <Grid item xs={12}>
            {errors.products && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {errors.products}
              </Alert>
            )}
            <PurchaseLineItemsSection
              lines={lines}
              onChange={(next) => {
                setLines(next);
                if (errors.products) setErrors((p) => ({ ...p, products: undefined }));
              }}
              locationFilter={itemBranch}
            />
          </Grid>

          <Grid item xs={12} lg={5}>
            <PurchaseSection title="Amount & Payment">
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
                {form.payment_method !== "Cheque" ? (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Purchase Amount"
                      type="number"
                      value={purchaseAmount}
                      onChange={(e) => {
                        setPurchaseAmount(parseFloat(e.target.value) || 0);
                        setErrors((prev) => ({ ...prev, amount: undefined }));
                      }}
                      disabled={form.payment_method === "Credit"}
                      error={!!errors.amount}
                      helperText={
                        errors.amount ??
                        (form.payment_method === "Credit"
                          ? "Full amount on credit"
                          : "Sub Total − Discount")
                      }
                      InputProps={{
                        startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                      }}
                      inputProps={{ min: 0, step: "0.01" }}
                      InputLabelProps={{ shrink: true }}
                      sx={fieldSx}
                    />
                  </Grid>
                ) : null}
                <Grid item xs={12}>
                  <FormControl fullWidth size="small" sx={fieldSx}>
                    <InputLabel shrink>Payment method</InputLabel>
                    <Select
                      label="Payment method"
                      value={form.payment_method ?? "Cash"}
                      onChange={(e) => handlePaymentSelect(e.target.value as PosPaymentMethod)}
                      notched
                    >
                      {(paymentMethods.length > 0
                        ? paymentMethods
                        : POS_PAYMENT_OPTIONS.map((o) => o.value)
                      ).map((m) => (
                        <MenuItem key={m} value={m}>
                          {POS_PAYMENT_OPTIONS.find((o) => o.value === m)?.label ?? m}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
                    Quick select
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                    {POS_PAYMENT_OPTIONS.map((opt) => (
                      <Chip
                        key={opt.value}
                        label={opt.label}
                        size="small"
                        onClick={() => handlePaymentSelect(opt.value)}
                        color={form.payment_method === opt.value ? "primary" : "default"}
                        variant={form.payment_method === opt.value ? "filled" : "outlined"}
                        sx={{ fontWeight: form.payment_method === opt.value ? 700 : 400 }}
                      />
                    ))}
                  </Box>
                </Grid>
                {(form.payment_method === "Credit" || form.payment_method === "Cheque") && (
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small" sx={fieldSx}>
                      <InputLabel shrink>Net terms</InputLabel>
                      <Select
                        label="Net terms"
                        value={form.net_terms ?? ""}
                        onChange={(e) => setField("net_terms", e.target.value)}
                        notched
                      >
                        {NET_TERMS_OPTIONS.map((term) => (
                          <MenuItem key={term} value={term}>
                            {term}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
                {form.payment_method === "Cheque" ? (
                  <Grid item xs={12}>
                    <PurchaseChequeFields
                      banks={banks}
                      loadingBanks={loadingBanks}
                      bankId={form.bank_id ?? null}
                      chequeNumber={form.cheque_number ?? ""}
                      chequeAmount={purchaseAmount}
                      bankError={errors.bank_id}
                      chequeNumberError={errors.cheque_number}
                      amountError={errors.amount}
                      onBankChange={(bankId) => setField("bank_id", bankId)}
                      onChequeNumberChange={(chequeNumber) =>
                        setField("cheque_number", chequeNumber)
                      }
                      onChequeAmountChange={setPurchaseAmount}
                      onClearError={(key) =>
                        setErrors((prev) => ({ ...prev, [key]: undefined }))
                      }
                    />
                  </Grid>
                ) : null}
              </Grid>
            </PurchaseSection>

            <Box
              sx={{
                p: 2,
                bgcolor: "var(--surface-bg-alt)",
                border: "1px solid #d0e3ff",
                borderRadius: 1,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Total payable
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: "var(--pallet-blue)", mt: 0.5 }}>
                {formatPurchaseRs(computedAmount)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                Invoice: {form.invoice_id || "—"} · {form.payment_method ?? "Cash"}
                {form.net_terms ? ` · ${form.net_terms}` : ""}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <PurchaseSection title="Notes">
              <TextField
                fullWidth
                size="small"
                label="Note"
                multiline
                minRows={3}
                value={form.notes ?? ""}
                onChange={(e) => setField("notes", e.target.value)}
                placeholder="Additional notes for this purchase…"
                InputLabelProps={{ shrink: true }}
                sx={fieldSx}
              />
            </PurchaseSection>
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
          <Button component={Link} to={PURCHASES_BASE} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="outlined"
            disabled={printInvoicePending || lines.length === 0}
            onClick={handlePrintInvoice}
            startIcon={
              printInvoicePending ? <CircularProgress size={18} color="inherit" /> : <PrintIcon />
            }
            sx={{ textTransform: "none" }}
          >
            {printInvoicePending ? "Preparing…" : "Print Invoice"}
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
            {saveMutation.isPending ? "Saving…" : isNew ? "Add Purchase" : "Update Purchase"}
          </Button>
        </Box>
        </Box>
      </form>

    </Box>
  );
};

export default PurchaseFormPage;
