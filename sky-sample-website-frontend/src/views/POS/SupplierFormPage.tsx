import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router";
import { useSnackbar } from "notistack";
import PageTitle from "../../components/PageTitle";
import BranchLocationSelect from "../../components/BranchLocationSelect";
import { useBranchLocations } from "../../hooks/useBranchLocations";
import {
  createSupplier,
  getSupplier,
  updateSupplier,
  type SupplierPayload,
} from "../../api/suppliersApi";
import { getFriendlyErrorMessage } from "../../utils/getFriendlyErrorMessage";
import { SupplierSection } from "./suppliers/SupplierFormComponents";
import {
  DEFAULT_COUNTRY,
  PHONE_PREFIX,
  SRI_LANKA_PROVINCES,
} from "./suppliers/supplierConstants";

const EMPTY_FORM: SupplierPayload = {
  location: "Main Location",
  supplier_code: "",
  first_name: "",
  phone: "",
  email: "",
  opening_balance: 0,
  address_line1: "",
  address_line2: "",
  city: "",
  province: "Northern Province",
  postal_code: "",
  country: DEFAULT_COUNTRY,
};

function stripPhonePrefix(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith("+94")) {
    return trimmed.slice(3).trim();
  }
  if (trimmed.startsWith("94") && trimmed.length > 2) {
    return trimmed.slice(2).trim();
  }
  return trimmed;
}

function buildPhone(local: string): string {
  const digits = local.replace(/\D/g, "");
  return digits ? `${PHONE_PREFIX}${digits}` : "";
}

const SupplierFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === "new";
  const supplierId = isNew ? null : Number(id);

  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [form, setForm] = useState<SupplierPayload>(EMPTY_FORM);
  const [phoneLocal, setPhoneLocal] = useState("");
  const [errors, setErrors] = useState<{ first_name?: string; phone?: string }>({});
  const { defaultLocation, manageMultiple } = useBranchLocations();

  const { data: supplierData, isLoading } = useQuery({
    queryKey: ["supplier", supplierId],
    queryFn: () => getSupplier(supplierId!),
    enabled: supplierId !== null && !Number.isNaN(supplierId),
  });

  useEffect(() => {
    if (isNew) {
      setForm({ ...EMPTY_FORM, location: defaultLocation });
      setPhoneLocal("");
      return;
    }
    if (supplierData) {
      const { id: _id, name: _name, net_balance: _nb, phone_display: _pd, ...rest } =
        supplierData;
      setForm({
        location: rest.location ?? "Main Location",
        supplier_code: rest.supplier_code,
        first_name: rest.first_name,
        phone: rest.phone,
        email: rest.email ?? "",
        opening_balance: rest.opening_balance,
        address_line1: rest.address_line1 ?? "",
        address_line2: rest.address_line2 ?? "",
        city: rest.city ?? "",
        province: rest.province ?? "Northern Province",
        postal_code: rest.postal_code ?? "",
        country: rest.country ?? DEFAULT_COUNTRY,
      });
      setPhoneLocal(stripPhonePrefix(rest.phone));
    }
  }, [isNew, supplierData]);

  const saveMutation = useMutation({
    mutationFn: async (payload: SupplierPayload) => {
      const body: SupplierPayload = {
        ...payload,
        phone: buildPhone(phoneLocal),
        supplier_code: payload.supplier_code?.trim() || undefined,
        email: payload.email?.trim() || null,
      };
      if (isNew) {
        return createSupplier(body);
      }
      return updateSupplier(supplierId!, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      enqueueSnackbar("Supplier saved successfully", { variant: "success" });
      navigate("/suppliers");
    },
    onError: (err: unknown) => {
      enqueueSnackbar(getFriendlyErrorMessage(err, "Failed to save supplier"), {
        variant: "error",
      });
    },
  });

  const validate = (): boolean => {
    const next: { first_name?: string; phone?: string } = {};
    if (!form.first_name.trim()) {
      next.first_name = "Supplier first name is required";
    }
    if (!phoneLocal.trim()) {
      next.phone = "Phone number is required";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    saveMutation.mutate(form);
  };

  const handleClear = () => {
    setForm(EMPTY_FORM);
    setPhoneLocal("");
    setErrors({});
  };

  if (!isNew && isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8, width: "100%" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", p: { xs: 2, sm: 3 }, boxSizing: "border-box" }}>
      <Button
        component={Link}
        to="/suppliers"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2, color: "text.secondary", textTransform: "none" }}
      >
        Back to Suppliers
      </Button>

      <PageTitle
        title={isNew ? "Add Supplier" : "Edit Supplier"}
        subtitle="General information and address details"
      />

      <Card
        elevation={0}
        sx={{
          width: "100%",
          bgcolor: "var(--surface-bg)",
          border: "1px solid var(--surface-border)",
          borderRadius: "4px",
          boxShadow: "0 0 10px rgba(0,0,0,0.06)",
          mt: 2,
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <SupplierSection title="General Information">
            <Grid container spacing={2} alignItems="flex-start">
              {manageMultiple && (
                <Grid item xs={12} md={4}>
                  <BranchLocationSelect
                    value={form.location ?? defaultLocation}
                    onChange={(loc) => setForm((prev) => ({ ...prev, location: loc }))}
                    label="Branch"
                    size="medium"
                    minWidth={220}
                  />
                </Grid>
              )}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="First Name"
                  required
                  value={form.first_name}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, first_name: e.target.value }));
                    if (errors.first_name) setErrors((e) => ({ ...e, first_name: undefined }));
                  }}
                  error={!!errors.first_name}
                  helperText={errors.first_name}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Phone"
                  required
                  value={phoneLocal}
                  onChange={(e) => {
                    setPhoneLocal(e.target.value.replace(/\D/g, ""));
                    if (errors.phone) setErrors((e) => ({ ...e, phone: undefined }));
                  }}
                  error={!!errors.phone}
                  helperText={errors.phone}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">{PHONE_PREFIX}</InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={form.email ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  size="small"
                />
              </Grid>
            </Grid>
          </SupplierSection>

          <SupplierSection title="Other details">
            <Grid container spacing={2} alignItems="flex-start">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Opening Balance"
                  type="number"
                  value={form.opening_balance}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      opening_balance: parseFloat(e.target.value) || 0,
                    }))
                  }
                  size="small"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                  }}
                  inputProps={{ min: 0, step: "0.01" }}
                />
              </Grid>
              {!isNew && (
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Supplier ID"
                    value={form.supplier_code}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, supplier_code: e.target.value }))
                    }
                    size="small"
                    helperText="Unique supplier identifier"
                  />
                </Grid>
              )}
            </Grid>
          </SupplierSection>

          <SupplierSection title="Address details">
            <Grid container spacing={2} alignItems="flex-start">
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address line 1"
                  value={form.address_line1 ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, address_line1: e.target.value }))}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address line 2"
                  value={form.address_line2 ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, address_line2: e.target.value }))}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="City"
                  value={form.city ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="supplier-province-label">Province</InputLabel>
                  <Select
                    labelId="supplier-province-label"
                    label="Province"
                    value={form.province ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))}
                  >
                    {SRI_LANKA_PROVINCES.map((p) => (
                      <MenuItem key={p} value={p}>
                        {p}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Postal code / Zip code"
                  value={form.postal_code ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, postal_code: e.target.value }))}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Country"
                  value={form.country ?? DEFAULT_COUNTRY}
                  onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                  size="small"
                />
              </Grid>
            </Grid>
          </SupplierSection>

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 1.5,
              mt: 1,
              pt: 2,
              borderTop: "1px solid #eee",
            }}
          >
            <Button
              variant="outlined"
              onClick={handleClear}
              disabled={saveMutation.isPending}
              sx={{
                color: "text.secondary",
                borderColor: "var(--surface-border)",
                minWidth: 100,
                textTransform: "uppercase",
              }}
            >
              Clear
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saveMutation.isPending}
              sx={{
                bgcolor: "var(--pallet-blue)",
                minWidth: 100,
                textTransform: "uppercase",
                "&:hover": { bgcolor: "var(--pallet-main-blue)" },
              }}
            >
              {saveMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SupplierFormPage;
