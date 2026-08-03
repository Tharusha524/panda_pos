import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import { Link as RouterLink, useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import PageTitle from "../../../components/PageTitle";
import BranchLocationSelect from "../../../components/BranchLocationSelect";
import { useBranchLocations } from "../../../hooks/useBranchLocations";
import { getCustomers } from "../../../api/customersApi";
import { getSales } from "../../../api/salesApi";
import {
  createShipment,
  getNextShipmentNo,
  getShipment,
  updateShipment,
  type ShipmentPayload,
} from "../../../api/shippingApi";
import { getFriendlyErrorMessage } from "../../../utils/getFriendlyErrorMessage";
import { CUSTOMERS_BASE, SHIPMENT_STATUSES } from "./shippingConstants";
import { ShippingSection, fieldSx } from "./ShippingFormComponents";
import { emptyShipmentForm, formatShippingRs, SHIPPING_BASE } from "./shippingFormUtils";

const pageSx = {
  width: "100%",
  p: { xs: 2, sm: 3 },
  pb: 10,
  boxSizing: "border-box" as const,
};

const ShippingFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const shipmentId = isNew ? null : Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [form, setForm] = useState<ShipmentPayload>(emptyShipmentForm());
  const { defaultLocation, manageMultiple } = useBranchLocations();

  const { data: customersData } = useQuery({
    queryKey: ["customers", "shipping-form"],
    queryFn: () => getCustomers(),
  });
  const customers = customersData?.customers ?? [];

  const { data: salesData } = useQuery({
    queryKey: ["sales", "shipping-form", form.location],
    queryFn: () => getSales("all", form.location ?? "all"),
  });
  const sales = salesData?.sales ?? [];

  const {
    data: existing,
    isLoading: loadingShipment,
    isError: loadError,
    error: loadErr,
  } = useQuery({
    queryKey: ["shipment", shipmentId],
    queryFn: () => getShipment(shipmentId!),
    enabled: shipmentId != null && !Number.isNaN(shipmentId),
  });

  useEffect(() => {
    if (!isNew) return;
    getNextShipmentNo()
      .then((no) => setForm((prev) => ({ ...prev, shipment_no: no })))
      .catch(() => {});
    setForm((prev) => ({ ...prev, location: prev.location || defaultLocation }));
  }, [isNew, defaultLocation]);

  useEffect(() => {
    if (!existing) return;
    setForm({
      location: existing.location,
      shipment_no: existing.shipment_no,
      sale_id: existing.sale_id,
      sales_id: existing.sales_id,
      customer_id: existing.customer_id,
      customer_name: existing.customer_name,
      shipment_date: existing.shipment_date,
      destination: existing.destination,
      estimated_delivery_date: existing.estimated_delivery_date,
      weight: existing.weight,
      freight_cost: existing.freight_cost,
      invoice_cost: existing.invoice_cost,
      bsl_number: existing.bsl_number,
      us_lot_number: existing.us_lot_number,
      status: existing.status,
      notes: existing.notes,
    });
  }, [existing]);

  const saleOptions = useMemo(
    () =>
      sales.map((s) => ({
        id: s.id,
        label: `${s.sales_id} · ${s.customer_name || "Walk-in"} · ${formatShippingRs(s.net_amount)}`,
        sales_id: s.sales_id,
        customer_id: s.customer_id,
        customer_name: s.customer_name,
        location: s.location,
      })),
    [sales]
  );

  const setField = <K extends keyof ShipmentPayload>(key: K, value: ShipmentPayload[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaleLink = (saleId: number | "") => {
    if (saleId === "") {
      setField("sale_id", null);
      return;
    }
    const sale = saleOptions.find((s) => s.id === saleId);
    if (!sale) return;
    setForm((prev) => ({
      ...prev,
      sale_id: sale.id,
      sales_id: sale.sales_id,
      customer_id: sale.customer_id,
      customer_name: sale.customer_name,
      location: sale.location,
    }));
  };

  const saveMutation = useMutation({
    mutationFn: async (payload: ShipmentPayload) => {
      if (isNew) return createShipment(payload);
      return updateShipment(shipmentId!, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      enqueueSnackbar(isNew ? "Shipment created" : "Shipment updated", { variant: "success" });
      navigate(SHIPPING_BASE);
    },
    onError: (err: unknown) => {
      enqueueSnackbar(getFriendlyErrorMessage(err, "Failed to save shipment"), { variant: "error" });
    },
  });

  const handleSave = () => {
    if (!form.shipment_no?.trim()) {
      enqueueSnackbar("Shipment number is required", { variant: "warning" });
      return;
    }
    saveMutation.mutate(form);
  };

  if (!isNew && loadingShipment) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isNew && loadError) {
    return (
      <Box sx={pageSx}>
        <Alert severity="error">{getFriendlyErrorMessage(loadErr, "Failed to load shipment")}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={pageSx}>
      <Button
        component={RouterLink}
        to={SHIPPING_BASE}
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2, textTransform: "none", color: "text.secondary" }}
      >
        Back to Shipping
      </Button>

      <PageTitle
        title={isNew ? "Add Shipment" : "Edit Shipment"}
        subtitle="Link to a sale and customer from Customer Dashboard — no box picker on this screen"
      />

      <Box
        component={Paper}
        elevation={0}
        sx={{ p: { xs: 2, sm: 3 }, border: "1px solid var(--surface-border)", borderRadius: 1, bgcolor: "var(--surface-bg)" }}
      >
        <ShippingSection title="Shipment details">
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Shipment No"
                required
                value={form.shipment_no}
                onChange={(e) => setField("shipment_no", e.target.value)}
                sx={fieldSx}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Shipment date"
                type="date"
                required
                value={form.shipment_date}
                onChange={(e) => setField("shipment_date", e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={fieldSx}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small" sx={fieldSx}>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={form.status}
                  onChange={(e) => setField("status", e.target.value as ShipmentPayload["status"])}
                >
                  {SHIPMENT_STATUSES.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              {manageMultiple ? (
                <BranchLocationSelect
                  value={form.location ?? defaultLocation}
                  onChange={(loc) => setField("location", loc)}
                  label="Branch"
                  size="medium"
                  minWidth={200}
                />
              ) : (
                <TextField
                  fullWidth
                  size="small"
                  label="Branch"
                  value={form.location}
                  disabled
                  sx={fieldSx}
                />
              )}
            </Grid>
          </Grid>
        </ShippingSection>

        <ShippingSection title="Customer & sale">
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add or edit customers in{" "}
            <Typography
              component={RouterLink}
              to={CUSTOMERS_BASE}
              variant="body2"
              sx={{ fontWeight: 600, color: "primary.main", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
            >
              Customer Dashboard
            </Typography>
            . Pick customer and optional linked sale below (dropdown only).
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small" sx={fieldSx}>
                <InputLabel>Customer</InputLabel>
                <Select
                  label="Customer"
                  value={form.customer_id ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      setForm((prev) => ({
                        ...prev,
                        customer_id: null,
                        customer_name: null,
                      }));
                      return;
                    }
                    const c = customers.find((x) => x.id === Number(val));
                    setForm((prev) => ({
                      ...prev,
                      customer_id: c?.id ?? null,
                      customer_name: c?.customer_name ?? c?.first_name ?? null,
                    }));
                  }}
                >
                  <MenuItem value="">Walk-in / none</MenuItem>
                  {customers.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.customer_name || c.first_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small" sx={fieldSx}>
                <InputLabel>Link to sale (optional)</InputLabel>
                <Select
                  label="Link to sale (optional)"
                  value={form.sale_id ?? ""}
                  onChange={(e) =>
                    handleSaleLink(e.target.value === "" ? "" : Number(e.target.value))
                  }
                >
                  <MenuItem value="">No sale linked</MenuItem>
                  {saleOptions.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Sales No (reference)"
                value={form.sales_id ?? ""}
                onChange={(e) => setField("sales_id", e.target.value || null)}
                sx={fieldSx}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                component={RouterLink}
                to="/sales/new"
                variant="outlined"
                size="small"
                sx={{ textTransform: "none", mt: 0.5 }}
              >
                Create new sale
              </Button>
            </Grid>
          </Grid>
        </ShippingSection>

        <ShippingSection title="Delivery & costs">
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Destination"
                value={form.destination ?? ""}
                onChange={(e) => setField("destination", e.target.value || null)}
                sx={fieldSx}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Est. delivery date"
                type="date"
                value={form.estimated_delivery_date ?? ""}
                onChange={(e) => setField("estimated_delivery_date", e.target.value || null)}
                InputLabelProps={{ shrink: true }}
                sx={fieldSx}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Weight (kg)"
                type="number"
                value={form.weight ?? ""}
                onChange={(e) =>
                  setField("weight", e.target.value === "" ? null : parseFloat(e.target.value))
                }
                sx={fieldSx}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Freight cost (Rs)"
                type="number"
                value={form.freight_cost}
                onChange={(e) => setField("freight_cost", parseFloat(e.target.value) || 0)}
                sx={fieldSx}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Invoice cost (Rs)"
                type="number"
                value={form.invoice_cost}
                onChange={(e) => setField("invoice_cost", parseFloat(e.target.value) || 0)}
                sx={fieldSx}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="BSL number"
                value={form.bsl_number ?? ""}
                onChange={(e) => setField("bsl_number", e.target.value || null)}
                sx={fieldSx}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="US lot number"
                value={form.us_lot_number ?? ""}
                onChange={(e) => setField("us_lot_number", e.target.value || null)}
                sx={fieldSx}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Notes"
                multiline
                minRows={2}
                value={form.notes ?? ""}
                onChange={(e) => setField("notes", e.target.value || null)}
                sx={fieldSx}
              />
            </Grid>
          </Grid>
        </ShippingSection>

        <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 2 }}>
          <Button
            component={RouterLink}
            to={SHIPPING_BASE}
            variant="outlined"
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saveMutation.isPending}
            sx={{
              textTransform: "none",
              bgcolor: "var(--pallet-blue)",
              "&:hover": { bgcolor: "var(--pallet-main-blue)" },
            }}
          >
            {saveMutation.isPending ? "Saving…" : "Save shipment"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default ShippingFormPage;
