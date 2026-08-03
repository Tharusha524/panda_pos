import React, { useEffect, useState } from "react";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import SettingsPageShell from "../components/SettingsPageShell";
import SettingsToggleRow from "../components/SettingsToggleRow";
import SettingsSelectRow, {
  SettingsTextRow,
} from "../components/SettingsSelectRow";
import {
  getOrderSettings,
  updateOrderSettings,
  type OrderSettingsPayload,
} from "../../../../api/Settings/orderSettingsApi";
import { getFriendlyErrorMessage } from "../../../../utils/getFriendlyErrorMessage";
import { invalidatePosRuntimeSettings } from "../../../../utils/invalidatePosRuntimeSettings";
import {
  ORDER_SETTINGS_SECTIONS,
  PAYMENT_METHOD_OPTIONS,
  SEARCH_KEY_STYLE_OPTIONS,
} from "../orderSettingFields";

const OrderSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<OrderSettingsPayload>({});
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["order-settings"],
    queryFn: getOrderSettings,
  });

  useEffect(() => {
    if (data) {
      const { id: _id, ...settings } = data;
      setForm(settings);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: updateOrderSettings,
    onSuccess: (updated) => {
      queryClient.setQueryData(["order-settings"], updated);
      invalidatePosRuntimeSettings(queryClient);
      setSaveError(null);
      setSaveMessage("Order settings saved successfully!");
    },
    onError: (err: unknown) => {
      setSaveMessage(null);
      setSaveError(getFriendlyErrorMessage(err, "Failed to save order settings"));
    },
  });

  const handleToggle = (field: keyof OrderSettingsPayload, value: boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaveMessage(null);
    setSaveError(null);
  };

  const handleFieldChange = (
    field: keyof OrderSettingsPayload,
    value: string | number
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaveMessage(null);
    setSaveError(null);
  };

  if (isLoading) {
    return (
      <SettingsPageShell
        title="Order"
        subtitle="Update your order settings"
        wide
        hideSave
      >
        <CircularProgress size={32} sx={{ color: "var(--pallet-blue)" }} />
      </SettingsPageShell>
    );
  }

  if (isError) {
    return (
      <SettingsPageShell
        title="Order"
        subtitle="Update your order settings"
        wide
        hideSave
      >
        <Alert severity="error">
          {getFriendlyErrorMessage(error, "Failed to load order settings")}
        </Alert>
      </SettingsPageShell>
    );
  }

  return (
    <SettingsPageShell
      title="Order"
      subtitle="Update your order settings"
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

      <SettingsSelectRow
        title="Search box short key style"
        description="Easily search item with short key style"
        value={form.search_box_short_key_style ?? "item_code_qty"}
        options={SEARCH_KEY_STYLE_OPTIONS}
        onChange={(v) => handleFieldChange("search_box_short_key_style", v)}
        disabled={saveMutation.isPending}
      />

      {ORDER_SETTINGS_SECTIONS.map((section) => (
        <Box key={section.title} sx={{ mb: 2 }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, mb: 1.5, color: "var(--pallet-blue)" }}
          >
            {section.title}
          </Typography>
          {section.fields.map((field) => (
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
      ))}

      <Typography
        variant="subtitle1"
        sx={{ fontWeight: 600, mb: 1.5, color: "var(--pallet-blue)" }}
      >
        Payment & charges
      </Typography>
      <SettingsSelectRow
        title="Set a default payment method."
        description="Default payment method for sales receipt transaction."
        value={form.default_payment_method ?? "cash"}
        options={PAYMENT_METHOD_OPTIONS}
        onChange={(v) => handleFieldChange("default_payment_method", v)}
        disabled={saveMutation.isPending}
      />
      <SettingsTextRow
        title="Credit or debit card payment charges"
        description="When a customer pays with a debit/credit card, you can charge a card fee as a percentage."
        type="number"
        value={String(form.credit_debit_card_payment_charges_percent ?? 1.5)}
        onChange={(v) =>
          handleFieldChange(
            "credit_debit_card_payment_charges_percent",
            parseFloat(v) || 0
          )
        }
        endAdornment="%"
        disabled={saveMutation.isPending}
      />
      <SettingsTextRow
        title="Enter the required PIN to delete or modify the hold order."
        description="The admin should enter the PIN to delete or modify the hold order."
        value={form.hold_order_pin ?? ""}
        onChange={(v) => handleFieldChange("hold_order_pin", v)}
        disabled={saveMutation.isPending}
      />
    </SettingsPageShell>
  );
};

export default OrderSettings;
