import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
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
import SaveIcon from "@mui/icons-material/Save";
import { Link, useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import PageTitle from "../../../components/PageTitle";
import { fetchBranches } from "../../../api/Settings/branchApi";
import {
  createCustomer,
  getCustomer,
  getCustomerTypes,
  updateCustomer,
  type CustomerPayload,
} from "../../../api/customersApi";
import { getFriendlyErrorMessage } from "../../../utils/getFriendlyErrorMessage";
import { CustomerSection } from "./CustomerFormComponents";
import CustomerTypeFormDialog from "./CustomerTypeFormDialog";
import {
  CUSTOMER_LANGUAGES,
  CUSTOMER_SOURCES,
  CUSTOMER_STATUSES,
  DEFAULT_COUNTRY,
  PHONE_PREFIX,
  SRI_LANKA_PROVINCES,
} from "./customerConstants";

const CUSTOMERS_BASE = "/customers";

const EMPTY: CustomerPayload = {
  first_name: "",
  business_name: "",
  contact_no: "",
  allow_duplicate_phone: false,
  email: "",
  date_of_birth: "",
  passport_no: "",
  nic: "",
  address_line1: "",
  city: "",
  postal_code: "",
  country: DEFAULT_COUNTRY,
  province: "Northern Province",
  source: "4",
  sales_person_id: "",
  lead_sales_person: "",
  other_sales_person: "",
  support_person: "",
  customer_status: "Product",
  product: "",
  credit_limit: 0,
  opening_balance: 0,
  notes: "",
  language: "",
  inventory_location: "Main Location",
  customer_type_id: null,
  customer_discount: 0,
  advance_payment: 0,
  advance_payment_notes: "",
};

function stripPhonePrefix(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith("+94")) return trimmed.slice(3).trim();
  if (trimmed.startsWith("94") && trimmed.length > 2) return trimmed.slice(2).trim();
  return trimmed.replace(/\D/g, "");
}

function buildPhone(local: string): string {
  const digits = local.replace(/\D/g, "");
  return digits ? `${PHONE_PREFIX}${digits}` : "";
}

const fieldSx = { "& .MuiOutlinedInput-root": { bgcolor: "var(--surface-bg)" } };

const CustomerFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const customerId = isNew ? null : Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [form, setForm] = useState<CustomerPayload>(EMPTY);
  const [phoneLocal, setPhoneLocal] = useState("");
  const [errors, setErrors] = useState<{ first_name?: string; phone?: string }>({});
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["customer", customerId],
    queryFn: () => getCustomer(customerId!),
    enabled: customerId != null && !Number.isNaN(customerId),
  });

  const { data: customerTypes = [] } = useQuery({
    queryKey: ["customer-types"],
    queryFn: getCustomerTypes,
  });

  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: fetchBranches,
  });

  const locationOptions = React.useMemo(() => {
    const names = branches.map((b) => b.name).filter(Boolean);
    const set = new Set(["Main Location", ...names]);
    if (form.inventory_location) set.add(form.inventory_location);
    return Array.from(set);
  }, [branches, form.inventory_location]);

  useEffect(() => {
    if (isNew) {
      setForm(EMPTY);
      setPhoneLocal("");
      return;
    }
    if (data) {
      setForm({
        customer_code: data.customer_code,
        first_name: data.first_name,
        business_name: data.business_name ?? "",
        contact_no: data.contact_no,
        allow_duplicate_phone: data.allow_duplicate_phone ?? false,
        email: data.email ?? "",
        date_of_birth: data.date_of_birth ?? "",
        passport_no: data.passport_no ?? "",
        nic: data.nic ?? "",
        address_line1: data.address_line1 ?? "",
        city: data.city ?? "",
        postal_code: data.postal_code ?? "",
        country: data.country ?? DEFAULT_COUNTRY,
        province: data.province ?? "Northern Province",
        source: data.source ?? "4",
        sales_person_id: data.sales_person_id ?? "",
        lead_sales_person: data.lead_sales_person ?? "",
        other_sales_person: data.other_sales_person ?? "",
        support_person: data.support_person ?? "",
        customer_status: data.customer_status ?? "Product",
        product: data.product ?? "",
        credit_limit: data.credit_limit,
        opening_balance: data.opening_balance ?? 0,
        net_balance: data.net_balance,
        notes: data.notes ?? "",
        language: data.language ?? "",
        inventory_location: data.inventory_location ?? data.location ?? "Main Location",
        customer_type_id: data.customer_type_id ?? null,
        customer_discount: data.customer_discount ?? 0,
      });
      setPhoneLocal(stripPhonePrefix(data.contact_no));
    }
  }, [isNew, data]);

  const [paymentReceived, setPaymentReceived] = useState(0);
  const [paymentReceivedNotes, setPaymentReceivedNotes] = useState("");

  const setField = <K extends keyof CustomerPayload>(key: K, value: CustomerPayload[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = (): boolean => {
    const next: { first_name?: string; phone?: string } = {};
    if (!form.first_name.trim()) {
      next.first_name = "Customer name is required";
    }
    if (!phoneLocal.trim()) {
      next.phone = "Phone number is required";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: CustomerPayload = {
        ...form,
        contact_no: buildPhone(phoneLocal),
        customer_code: form.customer_code?.trim() || undefined,
        email: form.email?.trim() || null,
        business_name: form.business_name?.trim() || null,
        advance_payment: isNew ? form.advance_payment : undefined,
        advance_payment_notes: isNew ? form.advance_payment_notes : undefined,
        payment_received: !isNew && paymentReceived > 0 ? paymentReceived : undefined,
        payment_received_notes: !isNew && paymentReceived > 0 ? paymentReceivedNotes || null : undefined,
      };
      if (isNew) return createCustomer(payload);
      return updateCustomer(customerId!, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      enqueueSnackbar(isNew ? "Customer created" : "Customer updated", { variant: "success" });
      navigate(CUSTOMERS_BASE);
    },
    onError: (err: unknown) => {
      enqueueSnackbar(getFriendlyErrorMessage(err, "Failed to save customer"), { variant: "error" });
    },
  });

  if (!isNew && isLoading) {
    return (
      <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
        <CircularProgress sx={{ color: "var(--pallet-blue)" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", p: { xs: 2, sm: 3 }, pb: 10 }}>
      <Button
        component={Link}
        to={CUSTOMERS_BASE}
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2, textTransform: "none", color: "text.secondary" }}
      >
        Back to Customers
      </Button>

      <PageTitle
        title={isNew ? "Add Customer" : "Edit Customer"}
        subtitle="General information, billing, sales team, and credit details"
      />

      <Box component="form" onSubmit={(e) => { e.preventDefault(); if (validate()) saveMutation.mutate(); }}>
        <CustomerSection title="General Information">
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="First Name"
                required
                value={form.first_name}
                onChange={(e) => {
                  setField("first_name", e.target.value);
                  if (errors.first_name) setErrors((p) => ({ ...p, first_name: undefined }));
                }}
                error={!!errors.first_name}
                helperText={errors.first_name ?? "Customer name is required"}
                sx={fieldSx}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Business Name"
                value={form.business_name ?? ""}
                onChange={(e) => setField("business_name", e.target.value)}
                sx={fieldSx}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Phone"
                required
                value={phoneLocal}
                onChange={(e) => {
                  setPhoneLocal(e.target.value.replace(/\D/g, ""));
                  if (errors.phone) setErrors((p) => ({ ...p, phone: undefined }));
                }}
                error={!!errors.phone}
                helperText={errors.phone ?? "Phone number is required"}
                InputProps={{
                  startAdornment: <InputAdornment position="start">{PHONE_PREFIX}</InputAdornment>,
                }}
                sx={fieldSx}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} sx={{ display: "flex", alignItems: "center" }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.allow_duplicate_phone ?? false}
                    onChange={(e) => setField("allow_duplicate_phone", e.target.checked)}
                  />
                }
                label="Add multiple customers with same number"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Email"
                type="email"
                value={form.email ?? ""}
                onChange={(e) => setField("email", e.target.value)}
                sx={fieldSx}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Date of Birth"
                type="date"
                value={form.date_of_birth ?? ""}
                onChange={(e) => setField("date_of_birth", e.target.value || null)}
                InputLabelProps={{ shrink: true }}
                sx={fieldSx}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Passport No"
                value={form.passport_no ?? ""}
                onChange={(e) => setField("passport_no", e.target.value)}
                sx={fieldSx}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="NIC"
                value={form.nic ?? ""}
                onChange={(e) => setField("nic", e.target.value)}
                sx={fieldSx}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </CustomerSection>

        <CustomerSection title="Billing Address">
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Address Line 1"
                value={form.address_line1 ?? ""}
                onChange={(e) => setField("address_line1", e.target.value)}
                sx={fieldSx}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="City"
                value={form.city ?? ""}
                onChange={(e) => setField("city", e.target.value)}
                sx={fieldSx}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Zip code/Postal code"
                value={form.postal_code ?? ""}
                onChange={(e) => setField("postal_code", e.target.value)}
                sx={fieldSx}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Country"
                value={form.country ?? DEFAULT_COUNTRY}
                onChange={(e) => setField("country", e.target.value)}
                sx={fieldSx}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" sx={fieldSx}>
                <InputLabel shrink>Province</InputLabel>
                <Select
                  label="Province"
                  value={form.province ?? "Northern Province"}
                  onChange={(e) => setField("province", e.target.value)}
                  notched
                >
                  {SRI_LANKA_PROVINCES.map((p) => (
                    <MenuItem key={p} value={p}>
                      {p}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CustomerSection>

        <CustomerSection title="Sales Team Information">
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small" sx={fieldSx}>
                <InputLabel shrink>Source</InputLabel>
                <Select
                  label="Source"
                  value={form.source ?? "4"}
                  onChange={(e) => setField("source", e.target.value)}
                  notched
                >
                  {CUSTOMER_SOURCES.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Sales Person ID"
                value={form.sales_person_id ?? ""}
                onChange={(e) => setField("sales_person_id", e.target.value)}
                sx={fieldSx}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Lead Sales Person"
                value={form.lead_sales_person ?? ""}
                onChange={(e) => setField("lead_sales_person", e.target.value)}
                sx={fieldSx}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Other Sales Person"
                value={form.other_sales_person ?? ""}
                onChange={(e) => setField("other_sales_person", e.target.value)}
                sx={fieldSx}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Support Person"
                value={form.support_person ?? ""}
                onChange={(e) => setField("support_person", e.target.value)}
                sx={fieldSx}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small" sx={fieldSx}>
                <InputLabel shrink>Customer Status</InputLabel>
                <Select
                  label="Customer Status"
                  value={form.customer_status ?? "Product"}
                  onChange={(e) => setField("customer_status", e.target.value)}
                  notched
                >
                  {CUSTOMER_STATUSES.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Product"
                value={form.product ?? ""}
                onChange={(e) => setField("product", e.target.value)}
                sx={fieldSx}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Credit Limit"
                type="number"
                value={form.credit_limit}
                onChange={(e) => setField("credit_limit", parseFloat(e.target.value) || 0)}
                InputProps={{ startAdornment: <InputAdornment position="start">Rs</InputAdornment> }}
                inputProps={{ min: 0, step: "0.01" }}
                sx={fieldSx}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Opening Balance"
                type="number"
                value={form.opening_balance}
                onChange={(e) => setField("opening_balance", parseFloat(e.target.value) || 0)}
                InputProps={{ startAdornment: <InputAdornment position="start">Rs</InputAdornment> }}
                inputProps={{ step: "0.01" }}
                sx={fieldSx}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            {!isNew && (
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Credit Balance"
                  type="number"
                  value={form.net_balance ?? 0}
                  onChange={(e) => setField("net_balance", parseFloat(e.target.value) || 0)}
                  helperText="Amount the customer owes (debtor balance)"
                  InputProps={{ startAdornment: <InputAdornment position="start">Rs</InputAdornment> }}
                  inputProps={{ min: 0, step: "0.01" }}
                  sx={fieldSx}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Notes"
                multiline
                minRows={3}
                value={form.notes ?? ""}
                onChange={(e) => setField("notes", e.target.value)}
                placeholder="Note"
                sx={fieldSx}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </CustomerSection>

        <CustomerSection title="Additional Information">
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small" sx={fieldSx}>
                <InputLabel shrink>Language</InputLabel>
                <Select
                  label="Language"
                  value={form.language ?? ""}
                  onChange={(e) => setField("language", e.target.value)}
                  displayEmpty
                  notched
                >
                  <MenuItem value="">
                    <em>Select</em>
                  </MenuItem>
                  {CUSTOMER_LANGUAGES.map((lang) => (
                    <MenuItem key={lang} value={lang}>
                      {lang}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small" sx={fieldSx}>
                <InputLabel shrink>Inventory Location</InputLabel>
                <Select
                  label="Inventory Location"
                  value={form.inventory_location ?? "Main Location"}
                  onChange={(e) => setField("inventory_location", e.target.value)}
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
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                <FormControl fullWidth size="small" sx={fieldSx}>
                  <InputLabel shrink>Customer Type</InputLabel>
                  <Select
                    label="Customer Type"
                    value={form.customer_type_id ?? ""}
                    onChange={(e) =>
                      setField(
                        "customer_type_id",
                        e.target.value === "" ? null : Number(e.target.value)
                      )
                    }
                    displayEmpty
                    notched
                  >
                    <MenuItem value="">
                      <em>Select</em>
                    </MenuItem>
                    {customerTypes.map((t) => (
                      <MenuItem key={t.id} value={t.id}>
                        {t.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  type="button"
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => setTypeDialogOpen(true)}
                  sx={{ mt: 0.5, flexShrink: 0, textTransform: "none", borderColor: "var(--surface-border)" }}
                >
                  Add
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Customer Discount"
                type="number"
                value={form.customer_discount}
                onChange={(e) => setField("customer_discount", parseFloat(e.target.value) || 0)}
                inputProps={{ min: 0, step: "0.01" }}
                sx={fieldSx}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </CustomerSection>

        {isNew && (
          <CustomerSection title="Advance Payment">
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              This payment will be added after the customer is created.
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Advance Payment"
                  type="number"
                  value={form.advance_payment ?? 0}
                  onChange={(e) => setField("advance_payment", parseFloat(e.target.value) || 0)}
                  InputProps={{ startAdornment: <InputAdornment position="start">Rs</InputAdornment> }}
                  inputProps={{ min: 0, step: "0.01" }}
                  sx={fieldSx}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Note"
                  multiline
                  minRows={2}
                  value={form.advance_payment_notes ?? ""}
                  onChange={(e) => setField("advance_payment_notes", e.target.value)}
                  sx={fieldSx}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </CustomerSection>
        )}

        {!isNew && (form.net_balance ?? 0) > 0 && (
          <CustomerSection title="Settle Credit Balance">
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Record a payment to reduce this customer&apos;s outstanding balance. Credit sales with payment method
              &quot;Credit&quot; add to this balance automatically.
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Payment Received"
                  type="number"
                  value={paymentReceived}
                  onChange={(e) => setPaymentReceived(parseFloat(e.target.value) || 0)}
                  InputProps={{ startAdornment: <InputAdornment position="start">Rs</InputAdornment> }}
                  inputProps={{ min: 0, max: form.net_balance ?? 0, step: "0.01" }}
                  sx={fieldSx}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} sx={{ display: "flex", alignItems: "center" }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setPaymentReceived(form.net_balance ?? 0)}
                  sx={{ textTransform: "none" }}
                >
                  Settle full balance (Rs {(form.net_balance ?? 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })})
                </Button>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Payment Note"
                  multiline
                  minRows={2}
                  value={paymentReceivedNotes}
                  onChange={(e) => setPaymentReceivedNotes(e.target.value)}
                  sx={fieldSx}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </CustomerSection>
        )}

        {!isNew && data && (data.advance_payments_total ?? 0) > 0 && (
          <Box sx={{ mb: 2, p: 2, bgcolor: "var(--surface-bg-alt)", borderRadius: 1, border: "1px solid var(--surface-border)" }}>
            <Typography variant="body2">
              Total advance payments:{" "}
              <strong>
                Rs {(data.advance_payments_total ?? 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })}
              </strong>
            </Typography>
          </Box>
        )}

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
          <Button component={Link} to={CUSTOMERS_BASE} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={saveMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
            disabled={saveMutation.isPending}
            sx={{
              bgcolor: "var(--pallet-blue)",
              textTransform: "none",
              minWidth: 140,
              "&:hover": { bgcolor: "var(--pallet-main-blue)" },
            }}
          >
            {saveMutation.isPending ? "Saving…" : isNew ? "Add Customer" : "Update Customer"}
          </Button>
        </Box>
      </Box>

      <CustomerTypeFormDialog
        open={typeDialogOpen}
        onClose={() => setTypeDialogOpen(false)}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["customer-types"] });
          enqueueSnackbar("Customer type added", { variant: "success" });
        }}
      />
    </Box>
  );
};

export default CustomerFormPage;
