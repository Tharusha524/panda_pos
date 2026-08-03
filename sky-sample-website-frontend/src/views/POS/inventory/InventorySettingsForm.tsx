import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormControlLabel,
  Grid,
  Link,
  MenuItem,
  Select,
  Switch,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router";
import SettingsToggleRow from "../Settings/components/SettingsToggleRow";
import {
  getInventorySettings,
  updateInventorySettings,
  type CostingMethod,
  type InventorySettingsPayload,
} from "../../../api/Settings/inventorySettingsApi";
import { getFriendlyErrorMessage } from "../../../utils/getFriendlyErrorMessage";
import { invalidatePosRuntimeSettings } from "../../../utils/invalidatePosRuntimeSettings";
import {
  COSTING_METHOD_OPTIONS,
  INVENTORY_TOGGLE_FIELDS,
} from "../Settings/inventorySettingFields";
import { COMPANY_SETTINGS_BASE } from "../Settings/companyModelShortcuts";
import BranchQuickAddDialog from "./BranchQuickAddDialog";

const cardSx = {
  p: 2,
  mb: 1.5,
  bgcolor: "var(--surface-bg)",
  border: "1px solid var(--surface-border)",
  borderRadius: "4px",
  height: "100%",
};

export interface InventorySettingsFormProps {
  onSave?: () => void;
  showSaveButton?: boolean;
}

const InventorySettingsForm: React.FC<InventorySettingsFormProps> = ({
  onSave,
  showSaveButton = true,
}) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<InventorySettingsPayload>({});
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [branchDialogOpen, setBranchDialogOpen] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["inventory-settings"],
    queryFn: getInventorySettings,
  });

  useEffect(() => {
    if (data) {
      const { id: _id, ...settings } = data;
      setForm(settings);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: updateInventorySettings,
    onSuccess: (updated) => {
      queryClient.setQueryData(["inventory-settings"], updated);
      invalidatePosRuntimeSettings(queryClient);
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      setSaveError(null);
      setSaveMessage("Inventory settings saved successfully!");
      onSave?.();
    },
    onError: (err: unknown) => {
      setSaveMessage(null);
      setSaveError(getFriendlyErrorMessage(err, "Failed to save inventory settings"));
    },
  });

  const handleToggle = (field: keyof InventorySettingsPayload, value: boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaveMessage(null);
    setSaveError(null);
  };

  const costingDescription =
    COSTING_METHOD_OPTIONS.find((o) => o.value === form.costing_method)?.description ??
    COSTING_METHOD_OPTIONS[0].description;

  if (isLoading) {
    return <CircularProgress size={32} sx={{ color: "var(--pallet-blue)" }} />;
  }

  if (isError) {
    return (
      <Alert severity="error">
        {getFriendlyErrorMessage(error, "Failed to load inventory settings")}
      </Alert>
    );
  }

  return (
    <Box>
      {saveMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {saveMessage}
        </Alert>
      )}
      {saveError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {saveError}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 1 }}>
        <Grid item xs={12} md={7}>
          <Box sx={cardSx}>
            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Inventory Location
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  In a case you have many shops, by clicking on ADD you can add details about those
                  shops, create an account, and insert transactions of that shop.
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2, mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={Boolean(form.manage_multiple_locations)}
                        onChange={(e) => handleToggle("manage_multiple_locations", e.target.checked)}
                        disabled={saveMutation.isPending}
                      />
                    }
                    label="Manage your inventory at multiple location"
                  />
                  {form.manage_multiple_locations && (
                    <>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => setBranchDialogOpen(true)}
                        disabled={saveMutation.isPending}
                        sx={{
                          bgcolor: "var(--pallet-blue)",
                          textTransform: "none",
                          "&:hover": { bgcolor: "var(--pallet-main-blue)" },
                        }}
                      >
                        ADD
                      </Button>
                      <Link
                        component={RouterLink}
                        to={`${COMPANY_SETTINGS_BASE}/branch`}
                        underline="hover"
                        sx={{ color: "var(--pallet-blue)", fontWeight: 500 }}
                      >
                        Manage all branches
                      </Link>
                    </>
                  )}
                </Box>
              </Box>
              <StorefrontIcon sx={{ fontSize: 56, color: "var(--pallet-blue)", opacity: 0.35 }} />
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} md={5}>
          <Box sx={cardSx}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Costing Method
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {costingDescription}
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={form.costing_method ?? "FIFO"}
                onChange={(e) => {
                  setForm((prev) => ({
                    ...prev,
                    costing_method: e.target.value as CostingMethod,
                  }));
                  setSaveMessage(null);
                  setSaveError(null);
                }}
                disabled={saveMutation.isPending}
              >
                {COSTING_METHOD_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              Applied to inventory dashboard unit cost and stock value ({form.costing_method ?? "FIFO"}).
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Box>
        {INVENTORY_TOGGLE_FIELDS.map((field) => (
          <SettingsToggleRow
            key={field.key}
            title={field.title}
            description={field.description}
            checked={Boolean(form[field.key])}
            onChange={(checked) => handleToggle(field.key, checked)}
            disabled={saveMutation.isPending}
          />
        ))}
      </Box>

      {showSaveButton && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
          <Button
            variant="contained"
            onClick={() => saveMutation.mutate(form)}
            disabled={saveMutation.isPending}
            sx={{
              bgcolor: "var(--pallet-blue)",
              textTransform: "none",
              minWidth: 120,
              "&:hover": { bgcolor: "var(--pallet-main-blue)" },
            }}
          >
            {saveMutation.isPending ? "Saving…" : "Save"}
          </Button>
        </Box>
      )}

      <BranchQuickAddDialog
        open={branchDialogOpen}
        onClose={() => setBranchDialogOpen(false)}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["branches"] });
          queryClient.invalidateQueries({ queryKey: ["inventory-list"] });
          setSaveMessage("Inventory location added.");
        }}
      />
    </Box>
  );
};

export default InventorySettingsForm;
