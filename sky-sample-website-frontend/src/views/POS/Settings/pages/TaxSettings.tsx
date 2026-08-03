import React, { useEffect, useState } from "react";
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
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import SettingsPageShell from "../components/SettingsPageShell";
import SettingsToggleRow from "../components/SettingsToggleRow";
import SettingsRadioRow from "../components/SettingsRadioRow";
import AssignVatToItemsDialog from "../components/AssignVatToItemsDialog";
import PosConfirmDeleteDialog from "../../shared/PosConfirmDeleteDialog";
import { useConfirmDelete } from "../../shared/useConfirmDelete";
import {
  createVatRate,
  deleteVatRate,
  formatVatRateLabel,
  getTaxSettings,
  updateTaxSettings,
  updateVatRate,
  type TaxSettingsPayload,
  type VatRate,
  type VatRatePayload,
  type VatType,
} from "../../../../api/Settings/taxSettingsApi";
import { getFriendlyErrorMessage } from "../../../../utils/getFriendlyErrorMessage";
import { invalidatePosRuntimeSettings } from "../../../../utils/invalidatePosRuntimeSettings";

const VAT_TYPE_OPTIONS = [
  { value: "none", label: "None" },
  { value: "exclusive", label: "Exclusive" },
  { value: "inclusive", label: "Inclusive" },
];

const emptyRateForm = (): VatRatePayload => ({
  vat_code: "",
  vat_desc: "",
  vat_rate: 0,
});

const TaxSettingsPage: React.FC = () => {
  const deleteConfirm = useConfirmDelete();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [form, setForm] = useState<TaxSettingsPayload>({});
  const [vatRates, setVatRates] = useState<VatRate[]>([]);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [rateDialogOpen, setRateDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<VatRate | null>(null);
  const [rateForm, setRateForm] = useState<VatRatePayload>(emptyRateForm());

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["tax-settings"],
    queryFn: getTaxSettings,
  });

  useEffect(() => {
    if (data) {
      setForm({
        allow_vat: data.settings.allow_vat,
        default_vat_rate_id: data.settings.default_vat_rate_id,
        vat_type: data.settings.vat_type,
      });
      setVatRates(data.vat_rates);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: updateTaxSettings,
    onSuccess: (updated) => {
      queryClient.setQueryData(["tax-settings"], updated);
      setVatRates(updated.vat_rates);
      invalidatePosRuntimeSettings(queryClient);
      setSaveError(null);
      setSaveMessage("Tax settings saved successfully!");
    },
    onError: (err: unknown) => {
      setSaveMessage(null);
      setSaveError(getFriendlyErrorMessage(err, "Failed to save tax settings"));
    },
  });

  const rateMutation = useMutation({
    mutationFn: async () => {
      if (editingRate) {
        return updateVatRate(editingRate.id, rateForm);
      }
      return createVatRate(rateForm);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["tax-settings"], updated);
      setVatRates(updated.vat_rates);
      setRateDialogOpen(false);
      setEditingRate(null);
      setRateForm(emptyRateForm());
      enqueueSnackbar(editingRate ? "VAT rate updated" : "VAT rate added", {
        variant: "success",
      });
    },
    onError: (err: unknown) => {
      enqueueSnackbar(getFriendlyErrorMessage(err, "Failed to save VAT rate"), {
        variant: "error",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVatRate,
    onSuccess: (updated) => {
      queryClient.setQueryData(["tax-settings"], updated);
      setVatRates(updated.vat_rates);
      setForm((prev) => ({
        ...prev,
        default_vat_rate_id: updated.settings.default_vat_rate_id,
      }));
      enqueueSnackbar("VAT rate deleted", { variant: "success" });
    },
    onError: (err: unknown) => {
      enqueueSnackbar(getFriendlyErrorMessage(err, "Failed to delete VAT rate"), {
        variant: "error",
      });
    },
  });

  const openNewRate = () => {
    setEditingRate(null);
    setRateForm(emptyRateForm());
    setRateDialogOpen(true);
  };

  const openEditRate = (rate: VatRate) => {
    setEditingRate(rate);
    setRateForm({
      vat_code: rate.vat_code,
      vat_desc: rate.vat_desc,
      vat_rate: rate.vat_rate,
    });
    setRateDialogOpen(true);
  };

  if (isLoading) {
    return (
      <SettingsPageShell title="Tax" subtitle="Update your tax more details" wide hideSave>
        <CircularProgress size={32} sx={{ color: "var(--pallet-blue)" }} />
      </SettingsPageShell>
    );
  }

  if (isError) {
    return (
      <SettingsPageShell title="Tax" subtitle="Update your tax more details" wide hideSave>
        <Alert severity="error">{getFriendlyErrorMessage(error, "Failed to load tax settings")}</Alert>
      </SettingsPageShell>
    );
  }

  return (
    <SettingsPageShell
      title="Tax"
      subtitle="Update your tax more details"
      wide
      onSave={() => saveMutation.mutate(form)}
      isSaving={saveMutation.isPending}
    >
      {saveMessage ? <Alert severity="success" sx={{ mb: 2 }}>{saveMessage}</Alert> : null}
      {saveError ? <Alert severity="error" sx={{ mb: 2 }}>{saveError}</Alert> : null}

      <SettingsToggleRow
        title="Allow VAT"
        description="Allow VAT"
        checked={Boolean(form.allow_vat)}
        onChange={(checked) => {
          setForm((prev) => ({ ...prev, allow_vat: checked }));
          setSaveMessage(null);
          setSaveError(null);
        }}
      />

      <Box
        sx={{
          p: 2,
          mb: 1.5,
          bgcolor: "var(--surface-bg)",
          border: "1px solid var(--surface-border)",
          borderRadius: "4px",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            VAT Details
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={openNewRate}
            sx={{ fontWeight: 700, fontSize: "0.7rem" }}
          >
            ADD NEW VAT RATE
          </Button>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>VAT Code</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>VAT Desc</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>VAT Rate(%)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vatRates.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell>{rate.vat_code}</TableCell>
                  <TableCell>{rate.vat_desc}</TableCell>
                  <TableCell>{rate.vat_rate.toFixed(2)}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEditRate(rate)} aria-label="Edit">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        deleteConfirm.requestDelete({
                          title: "Delete VAT rate",
                          message: `Delete VAT rate "${rate.vat_desc}"? This cannot be undone.`,
                          onConfirm: () => deleteMutation.mutate(rate.id),
                        });
                      }}
                      aria-label="Delete"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          p: 2,
          mb: 1.5,
          bgcolor: "var(--surface-bg)",
          border: "1px solid var(--surface-border)",
          borderRadius: "4px",
        }}
      >
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
            Default VAT
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Default VAT
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 240 }}>
          <InputLabel>Default VAT</InputLabel>
          <Select
            label="Default VAT"
            value={form.default_vat_rate_id ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              setForm((prev) => ({
                ...prev,
                default_vat_rate_id: val === "" ? null : Number(val),
              }));
              setSaveMessage(null);
              setSaveError(null);
            }}
          >
            {vatRates.map((r) => (
              <MenuItem key={r.id} value={r.id}>
                {formatVatRateLabel(r)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <SettingsRadioRow
        title="VAT type"
        description="VAT type"
        value={form.vat_type ?? "none"}
        options={VAT_TYPE_OPTIONS}
        onChange={(value) => {
          setForm((prev) => ({ ...prev, vat_type: value as VatType }));
          setSaveMessage(null);
          setSaveError(null);
        }}
      />

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          p: 2,
          mb: 1.5,
          bgcolor: "var(--surface-bg)",
          border: "1px solid var(--surface-border)",
          borderRadius: "4px",
        }}
      >
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
            Assign VAT to items
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Assign VAT to items
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={() => setAssignOpen(true)}
          sx={{ fontWeight: 700, minWidth: 100 }}
        >
          ASSIGN
        </Button>
      </Box>

      <Dialog open={rateDialogOpen} onClose={() => setRateDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editingRate ? "Edit VAT rate" : "Add VAT rate"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            label="VAT Code"
            value={rateForm.vat_code}
            onChange={(e) => setRateForm((p) => ({ ...p, vat_code: e.target.value }))}
            fullWidth
            size="small"
          />
          <TextField
            label="VAT Desc"
            value={rateForm.vat_desc}
            onChange={(e) => setRateForm((p) => ({ ...p, vat_desc: e.target.value }))}
            fullWidth
            size="small"
          />
          <TextField
            label="VAT Rate (%)"
            type="number"
            value={rateForm.vat_rate}
            onChange={(e) =>
              setRateForm((p) => ({ ...p, vat_rate: parseFloat(e.target.value) || 0 }))
            }
            fullWidth
            size="small"
            inputProps={{ min: 0, max: 100, step: "0.01" }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRateDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => rateMutation.mutate()}
            disabled={rateMutation.isPending}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <AssignVatToItemsDialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        vatRates={vatRates}
        onAssigned={() => queryClient.invalidateQueries({ queryKey: ["items"] })}
      />

      <PosConfirmDeleteDialog
        {...deleteConfirm.dialog}
        onCancel={deleteConfirm.close}
        onConfirm={deleteConfirm.confirm}
        loading={deleteMutation.isPending}
      />
    </SettingsPageShell>
  );
};

export default TaxSettingsPage;
