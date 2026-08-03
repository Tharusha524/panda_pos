import React, { useEffect, useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, Paper, TextField, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import SettingsToggleRow from "../Settings/components/SettingsToggleRow";
import {
  getItemSettings,
  updateItemSettings,
  type ItemSettingsPayload,
} from "../../../api/Settings/itemSettingsApi";
import { getFriendlyErrorMessage } from "../../../utils/getFriendlyErrorMessage";
import { invalidatePosRuntimeSettings } from "../../../utils/invalidatePosRuntimeSettings";
import { ITEM_SETTING_FIELDS } from "../Settings/itemSettingFields";
import { DEFAULT_UOM_OPTIONS, isValidUomCode, normalizeUomInput } from "./uomOptions";

export interface ItemSettingsFormProps {
  onSave?: () => void;
  showSaveButton?: boolean;
}

const ItemSettingsForm: React.FC<ItemSettingsFormProps> = ({
  onSave,
  showSaveButton = true,
}) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ItemSettingsPayload>({});
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [newUom, setNewUom] = useState("");
  const [uomError, setUomError] = useState<string | null>(null);

  const uomOptions = form.uom_options?.length ? form.uom_options : [...DEFAULT_UOM_OPTIONS];

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["item-settings"],
    queryFn: getItemSettings,
  });

  useEffect(() => {
    if (data) {
      const { id: _id, ...settings } = data;
      setForm(settings);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: updateItemSettings,
    onSuccess: (updated) => {
      queryClient.setQueryData(["item-settings"], updated);
      invalidatePosRuntimeSettings(queryClient);
      setSaveError(null);
      setSaveMessage("Item settings saved successfully!");
      onSave?.();
    },
    onError: (err: unknown) => {
      setSaveMessage(null);
      setSaveError(getFriendlyErrorMessage(err, "Failed to save item settings"));
    },
  });

  const handleToggle = (field: keyof ItemSettingsPayload, value: boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaveMessage(null);
    setSaveError(null);
  };

  const handleAddUom = () => {
    const value = normalizeUomInput(newUom);
    setUomError(null);
    if (!value) {
      setUomError("Enter a unit code (e.g. carton, bag, litre).");
      return;
    }
    if (!isValidUomCode(value)) {
      setUomError("Use 1–20 letters, numbers, dots, dashes, or underscores.");
      return;
    }
    if (uomOptions.includes(value)) {
      setUomError(`"${value}" is already in the list.`);
      return;
    }
    setForm((prev) => ({ ...prev, uom_options: [...uomOptions, value] }));
    setNewUom("");
  };

  const handleRemoveUom = (code: string) => {
    if (code === "pcs") {
      setUomError("pcs cannot be removed — it is the default piece unit.");
      return;
    }
    if (uomOptions.length <= 1) {
      setUomError("At least one unit must remain.");
      return;
    }
    setUomError(null);
    setForm((prev) => ({
      ...prev,
      uom_options: uomOptions.filter((u) => u !== code),
    }));
  };

  if (isLoading) {
    return <CircularProgress size={32} sx={{ color: "var(--pallet-blue)" }} />;
  }

  if (isError) {
    return (
      <Alert severity="error">
        {getFriendlyErrorMessage(error, "Failed to load item settings")}
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
      <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: "var(--surface-bg-alt)" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
          Units of measure (UOM)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Add the unit types your shop uses (pcs, kg, ml, carton, bag, etc.). These appear when you create or edit
          items under <strong>Stock Details → Unit of Measure</strong>.
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
          {uomOptions.map((code) => (
            <Chip
              key={code}
              label={code}
              onDelete={code === "pcs" ? undefined : () => handleRemoveUom(code)}
              deleteIcon={code === "pcs" ? undefined : <DeleteIcon />}
              sx={{ textTransform: "lowercase", fontWeight: 600 }}
            />
          ))}
        </Box>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "flex-start" }}>
          <TextField
            size="small"
            label="New unit code"
            placeholder="e.g. carton, bag, litre"
            value={newUom}
            onChange={(e) => {
              setNewUom(e.target.value);
              setUomError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddUom();
              }
            }}
            sx={{ minWidth: 220 }}
          />
          <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddUom} sx={{ textTransform: "none" }}>
            Add unit
          </Button>
        </Box>
        {uomError && (
          <Typography variant="caption" color="error.main" sx={{ mt: 1, display: "block" }}>
            {uomError}
          </Typography>
        )}
      </Paper>
      <Box>
        {ITEM_SETTING_FIELDS.map((field) => (
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
            onClick={() => saveMutation.mutate({ ...form, uom_options: uomOptions })}
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
    </Box>
  );
};

export default ItemSettingsForm;
