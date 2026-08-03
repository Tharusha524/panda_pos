import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
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
import SaveIcon from "@mui/icons-material/Save";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import PageTitle from "../../../components/PageTitle";
import {
  createPayment,
  getNextSalesNo,
  getPayment,
  getPayments,
  updatePayment,
  type PaymentPayload,
} from "../../../api/paymentsApi";
import { getFriendlyErrorMessage } from "../../../utils/getFriendlyErrorMessage";
import { PaymentSection, fieldSx } from "./PaymentFormComponents";
import { DEFAULT_PAYMENT_TYPE, RECEIPT_TYPES } from "./paymentConstants";
import {
  emptyPaymentForm,
  formatPaymentRs,
  PAYMENTS_BASE,
} from "./paymentFormUtils";

const pageSx = {
  width: "100%",
  p: { xs: 2, sm: 3 },
  pb: 10,
  boxSizing: "border-box" as const,
};

const PaymentFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const paymentId = isNew ? null : Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [form, setForm] = useState<PaymentPayload>(emptyPaymentForm());
  const [errors, setErrors] = useState<{
    sales_no?: string;
    payment_date?: string;
    paid_amount?: string;
  }>({});

  const { data: filterData } = useQuery({
    queryKey: ["payments", "form-filters"],
    queryFn: () => getPayments("all", "all", "all"),
  });

  const paymentTypes = filterData?.payment_types ?? [DEFAULT_PAYMENT_TYPE];
  const paymentMethods = filterData?.payment_methods ?? ["Cash"];
  const receiptTypes = filterData?.receipt_types ?? RECEIPT_TYPES;
  const locationOptions = useMemo(() => {
    const locs = filterData?.locations ?? ["Main Location"];
    if (form.location && !locs.includes(form.location)) {
      return [...locs, form.location];
    }
    return locs;
  }, [filterData?.locations, form.location]);

  const {
    data: existing,
    isLoading: loadingPayment,
    isError: loadError,
    error: loadErr,
  } = useQuery({
    queryKey: ["payment", paymentId],
    queryFn: () => getPayment(paymentId!),
    enabled: paymentId != null && !Number.isNaN(paymentId),
  });

  useEffect(() => {
    if (!isNew) return;
    getNextSalesNo()
      .then((salesNo) => setForm((prev) => ({ ...prev, sales_no: salesNo })))
      .catch(() => {});
  }, [isNew]);

  useEffect(() => {
    if (!existing) return;
    setForm({
      payment_type: existing.payment_type,
      location: existing.location,
      payment_date: existing.payment_date,
      sales_no: existing.sales_no,
      receipt_type: existing.receipt_type,
      payment_method: existing.payment_method,
      discount: existing.discount,
      paid_amount: existing.paid_amount,
      notes: existing.notes ?? "",
    });
  }, [existing]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isNew) {
        return createPayment(form);
      }
      return updatePayment(paymentId!, form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      enqueueSnackbar(isNew ? "Payment saved" : "Payment updated", { variant: "success" });
      navigate(PAYMENTS_BASE);
    },
    onError: (err: unknown) => {
      enqueueSnackbar(getFriendlyErrorMessage(err, "Failed to save payment"), {
        variant: "error",
      });
    },
  });

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!form.sales_no?.trim()) next.sales_no = "Sales number is required";
    if (!form.payment_date) next.payment_date = "Date is required";
    if (!form.paid_amount || form.paid_amount <= 0) {
      next.paid_amount = "Paid amount must be greater than zero";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    saveMutation.mutate();
  };

  if (!isNew && loadingPayment) {
    return (
      <Box sx={{ ...pageSx, display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress sx={{ color: "var(--pallet-blue)" }} />
      </Box>
    );
  }

  if (!isNew && loadError) {
    return (
      <Box sx={pageSx}>
        <Alert severity="error">
          {getFriendlyErrorMessage(loadErr, "Payment not found")}
        </Alert>
        <Button component={Link} to={PAYMENTS_BASE} sx={{ mt: 2 }}>
          Back to payments
        </Button>
      </Box>
    );
  }

  if (isNew) {
    return <Navigate to={PAYMENTS_BASE} replace />;
  }

  if (existing?.source_type) {
    return (
      <Box sx={pageSx}>
        <PageTitle title="Payment details" subtitle={existing.sales_no} />
        <Alert severity="info" sx={{ mb: 2 }}>
          This payment was recorded automatically from{" "}
          {existing.source_type === "sale"
            ? "a sale"
            : existing.source_type === "purchase"
              ? "a purchase"
              : existing.source_type === "expense"
                ? "an expense"
                : "employee salary"}
          . Update that record to change amounts.
        </Alert>
        <PaymentSection title="Details">
          <Typography variant="body2">
            Date: {existing.payment_date} · Receipt: {existing.receipt_type} · Method:{" "}
            {existing.payment_method}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Discount: {formatPaymentRs(existing.discount)} · Paid:{" "}
            {formatPaymentRs(existing.paid_amount)}
          </Typography>
          {existing.notes && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {existing.notes}
            </Typography>
          )}
        </PaymentSection>
        <Button component={Link} to={PAYMENTS_BASE} startIcon={<ArrowBackIcon />}>
          Back
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={pageSx}>
      <PageTitle
        title={isNew ? "Add Payment" : "Edit Payment"}
        subtitle={isNew ? "Record a new payment" : `Sales ${form.sales_no}`}
      />

      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <Button
          component={Link}
          to={PAYMENTS_BASE}
          startIcon={<ArrowBackIcon />}
          variant="outlined"
          sx={{ textTransform: "none" }}
        >
          Back
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saveMutation.isPending}
          sx={{ textTransform: "none", bgcolor: "var(--pallet-blue)" }}
        >
          {saveMutation.isPending ? "Saving…" : "Save"}
        </Button>
      </Box>

      <PaymentSection title="General">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small" sx={fieldSx}>
              <InputLabel>Payment Type</InputLabel>
              <Select
                label="Payment Type"
                value={form.payment_type ?? DEFAULT_PAYMENT_TYPE}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, payment_type: e.target.value }))
                }
              >
                {paymentTypes.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small" sx={fieldSx}>
              <InputLabel>Location</InputLabel>
              <Select
                label="Location"
                value={form.location ?? "Main Location"}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, location: e.target.value }))
                }
              >
                {locationOptions.map((loc) => (
                  <MenuItem key={loc} value={loc}>
                    {loc}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Date"
              type="date"
              value={form.payment_date ?? ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, payment_date: e.target.value }))
              }
              InputLabelProps={{ shrink: true }}
              error={Boolean(errors.payment_date)}
              helperText={errors.payment_date}
              sx={fieldSx}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Sales No"
              value={form.sales_no}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, sales_no: e.target.value }))
              }
              error={Boolean(errors.sales_no)}
              helperText={errors.sales_no}
              sx={fieldSx}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small" sx={fieldSx}>
              <InputLabel>Receipt type</InputLabel>
              <Select
                label="Receipt type"
                value={form.receipt_type ?? "Sale"}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, receipt_type: e.target.value }))
                }
              >
                {receiptTypes.map((r) => (
                  <MenuItem key={r} value={r}>
                    {r}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small" sx={fieldSx}>
              <InputLabel>Payment Method</InputLabel>
              <Select
                label="Payment Method"
                value={form.payment_method ?? "Cash"}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, payment_method: e.target.value }))
                }
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
      </PaymentSection>

      <PaymentSection title="Amount">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Discount (Rs)"
              type="number"
              value={form.discount ?? 0}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  discount: parseFloat(e.target.value) || 0,
                }))
              }
              InputProps={{
                startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
              }}
              inputProps={{ min: 0, step: 0.01 }}
              sx={fieldSx}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Paid Amount (Rs)"
              type="number"
              value={form.paid_amount ?? 0}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  paid_amount: parseFloat(e.target.value) || 0,
                }))
              }
              InputProps={{
                startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
              }}
              inputProps={{ min: 0.01, step: 0.01 }}
              error={Boolean(errors.paid_amount)}
              helperText={errors.paid_amount}
              sx={fieldSx}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body2" color="text.secondary" sx={{ pt: 1 }}>
              Net paid:{" "}
              <strong>{formatPaymentRs(Math.max(0, (form.paid_amount ?? 0) - (form.discount ?? 0)))}</strong>
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Notes"
              multiline
              minRows={2}
              value={form.notes ?? ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              sx={fieldSx}
            />
          </Grid>
        </Grid>
      </PaymentSection>
    </Box>
  );
};

export default PaymentFormPage;
