import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createPurchase,
  getNextInvoiceId,
  updatePurchase,
  type Purchase,
  type PurchasePayload,
} from "../../../api/purchasesApi";
import { getSuppliers } from "../../../api/suppliersApi";
import { getFriendlyErrorMessage } from "../../../utils/getFriendlyErrorMessage";
import { CATEGORY_DIALOG_PAPER_SX, POS_PRIMARY_BUTTON_SX } from "../posDialogTheme";
import { DEFAULT_PURCHASE_TYPE, NET_TERMS_OPTIONS, purchaseTypeLabel } from "./purchaseConstants";
import { localDateInputValue } from "./purchaseFormUtils";

interface PurchaseFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editPurchase?: Purchase | null;
  locationOptions: string[];
  purchaseTypeOptions: string[];
}

const emptyForm = (): PurchasePayload => ({
  purchase_type: DEFAULT_PURCHASE_TYPE,
  location: "Main Location",
  purchase_date: localDateInputValue(),
  invoice_id: "",
  supplier_id: null,
  supplier_name: "",
  sub_total: 0,
  discount: 0,
  amount: 0,
  net_terms: "30 Days",
  notes: "",
});

const PurchaseFormDialog: React.FC<PurchaseFormDialogProps> = ({
  open,
  onClose,
  onSaved,
  editPurchase,
  locationOptions,
  purchaseTypeOptions,
}) => {
  const isEdit = Boolean(editPurchase);
  const [form, setForm] = useState<PurchasePayload>(emptyForm());
  const [error, setError] = useState<string | null>(null);

  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers", form.location],
    queryFn: () => getSuppliers(form.location ?? "Main Location"),
    enabled: open,
  });
  const suppliers = suppliersData?.suppliers ?? [];

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (editPurchase) {
      setForm({
        purchase_type: editPurchase.purchase_type,
        location: editPurchase.location,
        purchase_date: editPurchase.purchase_date,
        invoice_id: editPurchase.invoice_id,
        supplier_id: editPurchase.supplier_id,
        supplier_name: editPurchase.supplier_name,
        sub_total: editPurchase.sub_total,
        discount: editPurchase.discount,
        amount: editPurchase.amount,
        net_terms: editPurchase.net_terms ?? "30 Days",
        notes: editPurchase.notes ?? "",
      });
      return;
    }
    setForm(emptyForm());
    getNextInvoiceId()
      .then((id) => setForm((prev) => ({ ...prev, invoice_id: id })))
      .catch(() => {});
  }, [open, editPurchase]);

  const computedAmount = useMemo(() => {
    const sub = Number(form.sub_total) || 0;
    const disc = Number(form.discount) || 0;
    return Math.max(0, sub - disc);
  }, [form.sub_total, form.discount]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: PurchasePayload = {
        ...form,
        amount: computedAmount,
        supplier_name:
          form.supplier_name?.trim() ||
          suppliers.find((s) => s.id === form.supplier_id)?.first_name ||
          "",
      };
      if (!payload.supplier_name) {
        throw new Error("Supplier name is required");
      }
      if (isEdit && editPurchase) {
        return updatePurchase(editPurchase.id, payload);
      }
      return createPurchase(payload);
    },
    onSuccess: () => {
      onSaved();
      onClose();
    },
    onError: (err: unknown) => {
      setError(getFriendlyErrorMessage(err, "Failed to save purchase"));
    },
  });

  const setField = <K extends keyof PurchasePayload>(key: K, value: PurchasePayload[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth scroll="paper" sx={CATEGORY_DIALOG_PAPER_SX}>
      <DialogTitle sx={{ fontWeight: 700, color: "var(--pallet-blue)", px: 3, pt: 2.5 }}>
        {isEdit ? "Edit Purchase" : "Add Purchase"}
      </DialogTitle>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          saveMutation.mutate();
        }}
      >
        <DialogContent sx={{ px: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel shrink>Purchase Type</InputLabel>
                <Select
                  label="Purchase Type"
                  value={form.purchase_type ?? DEFAULT_PURCHASE_TYPE}
                  onChange={(e) => setField("purchase_type", e.target.value)}
                  notched
                >
                  {purchaseTypeOptions.map((t) => (
                    <MenuItem key={t} value={t}>
                      {purchaseTypeLabel(t)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
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
            <Grid item xs={12} sm={6} md={4}>
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
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Invoice ID"
                required
                value={form.invoice_id}
                onChange={(e) => setField("invoice_id", e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel shrink>Supplier</InputLabel>
                <Select
                  label="Supplier"
                  value={form.supplier_id ?? ""}
                  onChange={(e) => {
                    const id = e.target.value === "" ? null : Number(e.target.value);
                    const sup = suppliers.find((s) => s.id === id);
                    setForm((prev) => ({
                      ...prev,
                      supplier_id: id,
                      supplier_name: sup?.first_name ?? prev.supplier_name,
                    }));
                  }}
                  displayEmpty
                  notched
                >
                  <MenuItem value="">
                    <em>Select supplier</em>
                  </MenuItem>
                  {suppliers.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.first_name} ({s.supplier_code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Supplier Name"
                required
                value={form.supplier_name ?? ""}
                onChange={(e) => setField("supplier_name", e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Sub Total (Rs)"
                type="number"
                value={form.sub_total}
                onChange={(e) => setField("sub_total", parseFloat(e.target.value) || 0)}
                inputProps={{ min: 0, step: "0.01" }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Discount (Rs)"
                type="number"
                value={form.discount}
                onChange={(e) => setField("discount", parseFloat(e.target.value) || 0)}
                inputProps={{ min: 0, step: "0.01" }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Amount (Rs)"
                value={computedAmount.toFixed(2)}
                InputProps={{ readOnly: true }}
                InputLabelProps={{ shrink: true }}
                helperText="Sub Total − Discount"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel shrink>Net Terms</InputLabel>
                <Select
                  label="Net Terms"
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
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Notes"
                multiline
                minRows={2}
                value={form.notes ?? ""}
                onChange={(e) => setField("notes", e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saveMutation.isPending}
            sx={POS_PRIMARY_BUTTON_SX}
          >
            {saveMutation.isPending ? "Saving…" : isEdit ? "Update" : "Add Purchase"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PurchaseFormDialog;
