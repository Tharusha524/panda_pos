import React, { useEffect, useState } from "react";
import { Alert, Box, CircularProgress, TextField, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import SettingsPageShell from "./SettingsPageShell";
import SettingsToggleRow from "./SettingsToggleRow";
import {
  getPaymentNotificationSettings,
  getSalesNotificationSettings,
  updatePaymentNotificationSettings,
  updateSalesNotificationSettings,
  type NotificationChannelConfig,
  type NotificationChannelPayload,
} from "../../../../api/Settings/notificationSettingsApi";
import { getFriendlyErrorMessage } from "../../../../utils/getFriendlyErrorMessage";
import { NOTIFICATION_SETTINGS_BASE } from "../notificationModelShortcuts";

type ChannelType = "sales" | "payment";

interface CustomerNotificationFormProps {
  type: ChannelType;
  pageTitle: string;
  pageSubtitle: string;
}

const CONFIG: Record<
  ChannelType,
  {
    queryKey: string;
    getFn: () => Promise<NotificationChannelConfig>;
    updateFn: (p: NotificationChannelPayload) => Promise<NotificationChannelConfig>;
    masterTitle: string;
    masterDescription: string;
  }
> = {
  sales: {
    queryKey: "notification-sales",
    getFn: getSalesNotificationSettings,
    updateFn: updateSalesNotificationSettings,
    masterTitle: "Enable sales notifications",
    masterDescription:
      "Send email and SMS to customers when a sales order is created or updated.",
  },
  payment: {
    queryKey: "notification-payment",
    getFn: getPaymentNotificationSettings,
    updateFn: updatePaymentNotificationSettings,
    masterTitle: "Enable payment notifications",
    masterDescription:
      "Send email and SMS to customers when a payment is received.",
  },
};

const CustomerNotificationForm: React.FC<CustomerNotificationFormProps> = ({
  type,
  pageTitle,
  pageSubtitle,
}) => {
  const queryClient = useQueryClient();
  const cfg = CONFIG[type];
  const [form, setForm] = useState<NotificationChannelPayload>({});
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [cfg.queryKey],
    queryFn: cfg.getFn,
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: cfg.updateFn,
    onSuccess: (updated) => {
      queryClient.setQueryData([cfg.queryKey], updated);
      setSaveError(null);
      setSaveMessage("Notification settings saved successfully!");
    },
    onError: (err: unknown) => {
      setSaveMessage(null);
      setSaveError(getFriendlyErrorMessage(err, "Failed to save settings"));
    },
  });

  const handleToggle = (field: keyof NotificationChannelPayload, value: boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaveMessage(null);
    setSaveError(null);
  };

  if (isLoading) {
    return (
      <SettingsPageShell
        title={pageTitle}
        subtitle={pageSubtitle}
        wide
        hideSave
        backTo={NOTIFICATION_SETTINGS_BASE}
        backLabel="Notifications"
      >
        <CircularProgress size={32} sx={{ color: "var(--pallet-blue)" }} />
      </SettingsPageShell>
    );
  }

  if (isError) {
    return (
      <SettingsPageShell
        title={pageTitle}
        subtitle={pageSubtitle}
        wide
        hideSave
        backTo={NOTIFICATION_SETTINGS_BASE}
        backLabel="Notifications"
      >
        <Alert severity="error">
          {getFriendlyErrorMessage(error, "Failed to load notification settings")}
        </Alert>
      </SettingsPageShell>
    );
  }

  return (
    <SettingsPageShell
      title={pageTitle}
      subtitle={pageSubtitle}
      wide
      backTo={NOTIFICATION_SETTINGS_BASE}
      backLabel="Notifications"
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

      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: "var(--pallet-blue)" }}>
        Email & SMS channels
      </Typography>

      <SettingsToggleRow
        title={cfg.masterTitle}
        description={cfg.masterDescription}
        checked={Boolean(form.enabled)}
        onChange={(v) => handleToggle("enabled", v)}
        disabled={saveMutation.isPending}
      />
      <SettingsToggleRow
        title="Send email"
        description="Deliver this notification to the customer by email."
        checked={Boolean(form.send_email)}
        onChange={(v) => handleToggle("send_email", v)}
        disabled={saveMutation.isPending || !form.enabled}
      />
      <SettingsToggleRow
        title="Send SMS"
        description="Deliver this notification to the customer by SMS."
        checked={Boolean(form.send_sms)}
        onChange={(v) => handleToggle("send_sms", v)}
        disabled={saveMutation.isPending || !form.enabled}
      />

      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, mt: 2, color: "var(--pallet-blue)" }}>
        Email template
      </Typography>
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="Email subject"
          value={form.email_subject ?? ""}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, email_subject: e.target.value }))
          }
          margin="dense"
          disabled={!form.enabled || !form.send_email}
        />
        <TextField
          fullWidth
          label="Email body"
          value={form.email_body ?? ""}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, email_body: e.target.value }))
          }
          margin="dense"
          multiline
          rows={4}
          disabled={!form.enabled || !form.send_email}
          helperText="Use {order_id}, {amount}, {customer_name} as placeholders"
        />
      </Box>

      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: "var(--pallet-blue)" }}>
        SMS template
      </Typography>
      <TextField
        fullWidth
        label="SMS message"
        value={form.sms_template ?? ""}
        onChange={(e) =>
          setForm((prev) => ({ ...prev, sms_template: e.target.value }))
        }
        margin="dense"
        multiline
        rows={3}
        disabled={!form.enabled || !form.send_sms}
        helperText="Use {order_id}, {amount}, {customer_name} as placeholders"
      />
    </SettingsPageShell>
  );
};

export default CustomerNotificationForm;
