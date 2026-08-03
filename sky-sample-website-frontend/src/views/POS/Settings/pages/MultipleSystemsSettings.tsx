import React, { useEffect, useState } from "react";
import { Alert, CircularProgress, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import SettingsPageShell from "../components/SettingsPageShell";
import SettingsToggleRow from "../components/SettingsToggleRow";
import {
  getInventorySettings,
  updateInventorySettings,
  type InventorySettingsPayload,
} from "../../../../api/Settings/inventorySettingsApi";
import { getFriendlyErrorMessage } from "../../../../utils/getFriendlyErrorMessage";
import { invalidatePosRuntimeSettings } from "../../../../utils/invalidatePosRuntimeSettings";

const MultipleSystemsSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<InventorySettingsPayload>({});
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

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
      setSaveError(null);
      setSaveMessage("Location settings saved successfully!");
    },
    onError: (err: unknown) => {
      setSaveMessage(null);
      setSaveError(getFriendlyErrorMessage(err, "Failed to save settings"));
    },
  });

  if (isLoading) {
    return (
      <SettingsPageShell title="Multiple Systems" subtitle="Multi-location inventory" wide hideSave>
        <CircularProgress size={32} sx={{ color: "var(--pallet-blue)" }} />
      </SettingsPageShell>
    );
  }

  if (isError) {
    return (
      <SettingsPageShell title="Multiple Systems" subtitle="Multi-location inventory" wide hideSave>
        <Alert severity="error">
          {getFriendlyErrorMessage(error, "Failed to load inventory settings")}
        </Alert>
      </SettingsPageShell>
    );
  }

  return (
    <SettingsPageShell
      title="Multiple Systems"
      subtitle="Multi-location inventory"
      wide
      onSave={() => saveMutation.mutate(form)}
      isSaving={saveMutation.isPending}
    >
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

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        These options are stored in inventory settings and apply across branches and locations.
      </Typography>

      <SettingsToggleRow
        title="Manage multiple locations"
        description="Track stock and items per branch or warehouse location."
        checked={Boolean(form.manage_multiple_locations)}
        onChange={(checked) =>
          setForm((prev) => ({ ...prev, manage_multiple_locations: checked }))
        }
        disabled={saveMutation.isPending}
      />
      <SettingsToggleRow
        title="Inventory location filter"
        description="Filter inventory lists by location on the dashboard."
        checked={Boolean(form.allow_inventory_location_filter)}
        onChange={(checked) =>
          setForm((prev) => ({ ...prev, allow_inventory_location_filter: checked }))
        }
        disabled={saveMutation.isPending}
      />
    </SettingsPageShell>
  );
};

export default MultipleSystemsSettings;
