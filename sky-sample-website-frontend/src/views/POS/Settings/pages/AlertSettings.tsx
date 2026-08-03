import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import SettingsPageShell from "../components/SettingsPageShell";
import SettingsToggleRow from "../components/SettingsToggleRow";
import AlertNotificationSetupInstructions from "../components/AlertNotificationSetupInstructions";
import AlertMessagePreview from "../components/AlertMessagePreview";
import {
  getAlertSettings,
  sendStaffAlertTest,
  updateAlertSettings,
  type AlertSettingsPayload,
} from "../../../../api/Settings/alertSettingsApi";
import { getUserSettings } from "../../../../api/Settings/userSettingsApi";
import { getFriendlyErrorMessage } from "../../../../utils/getFriendlyErrorMessage";
import { ALERT_NUMBER_FIELDS } from "../alertSettingFields";
import { USER_SETTINGS_BASE } from "../userModelShortcuts";
import { SettingsTextRow } from "../components/SettingsSelectRow";

const AlertSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AlertSettingsPayload>({});
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["alert-settings"],
    queryFn: getAlertSettings,
  });

  const { data: profile } = useQuery({
    queryKey: ["user-settings"],
    queryFn: getUserSettings,
  });

  useEffect(() => {
    if (data) {
      const { id: _id, staff_notify_email: _e, staff_notify_phone: _p, ...settings } = data;
      setForm(settings);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: updateAlertSettings,
    onSuccess: (updated) => {
      queryClient.setQueryData(["alert-settings"], updated);
      setSaveError(null);
      setSaveMessage("Alert preferences saved.");
    },
    onError: (err: unknown) => {
      setSaveMessage(null);
      setSaveError(getFriendlyErrorMessage(err, "Failed to save"));
    },
  });

  const testMutation = useMutation({
    mutationFn: sendStaffAlertTest,
    onSuccess: (result) => {
      setTestError(null);
      const parts: string[] = [];
      if (result.email_sent && result.email) parts.push(`Email sent to ${result.email}`);
      if (result.sms_sent && result.phone) {
        parts.push(
          result.sms_mode === "log"
            ? `SMS logged for ${result.phone} (test mode)`
            : `SMS sent to ${result.phone}`
        );
      }
      if (result.errors.length) parts.push(...result.errors);
      if (!result.sms_sent && result.sms_config && !result.sms_config.configured) {
        parts.push(result.sms_config.hint);
      }
      setTestMessage(parts.join(". ") || "Test sent.");
    },
    onError: (err: unknown) => {
      setTestMessage(null);
      setTestError(getFriendlyErrorMessage(err, "Test failed"));
    },
  });

  const handleFieldChange = (field: keyof AlertSettingsPayload, value: string) => {
    const num = parseInt(value, 10);
    setForm((prev) => ({ ...prev, [field]: Number.isNaN(num) ? 0 : num }));
    setSaveMessage(null);
    setSaveError(null);
  };

  const handleToggle = (field: keyof AlertSettingsPayload, checked: boolean) => {
    setForm((prev) => ({ ...prev, [field]: checked }));
    setSaveMessage(null);
    setSaveError(null);
  };

  if (isLoading) {
    return (
      <SettingsPageShell title="My alerts" subtitle="Receive inventory notifications" wide hideSave>
        <CircularProgress size={32} sx={{ color: "var(--pallet-blue)" }} />
      </SettingsPageShell>
    );
  }

  if (isError) {
    return (
      <SettingsPageShell title="My alerts" subtitle="Receive inventory notifications" wide hideSave>
        <Alert severity="error">{getFriendlyErrorMessage(error, "Failed to load")}</Alert>
      </SettingsPageShell>
    );
  }

  return (
    <SettingsPageShell
      title="My alerts"
      subtitle="Choose how you receive inventory alerts from your company"
      wide
      onSave={() => saveMutation.mutate(form)}
      isSaving={saveMutation.isPending}
    >
      {saveMessage && <Alert severity="success" sx={{ mb: 2 }}>{saveMessage}</Alert>}
      {saveError && <Alert severity="error" sx={{ mb: 2 }}>{saveError}</Alert>}

      <AlertNotificationSetupInstructions variant="employee" />

      <AlertMessagePreview />

      <Divider sx={{ my: 2 }} />
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        My alert preferences
      </Typography>

      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
        Your contact (where alerts are delivered)
      </Typography>
      <Box sx={{ mb: 2, p: 2, bgcolor: "var(--surface-bg)", border: "1px solid var(--surface-border)", borderRadius: 1 }}>
        <Typography variant="body2"><strong>Email:</strong> {profile?.email || "—"}</Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}><strong>Phone:</strong> {profile?.phone || "—"}</Typography>
        <Button component={RouterLink} to={`${USER_SETTINGS_BASE}/profile`} size="small" sx={{ mt: 1 }}>
          Update profile email / phone
        </Button>
      </Box>

      <SettingsToggleRow
        title="Receive email alerts"
        description="Inventory alerts sent to your profile email using company mail setup."
        checked={!!form.staff_send_email}
        onChange={(v) => handleToggle("staff_send_email", v)}
        disabled={saveMutation.isPending}
      />
      <SettingsToggleRow
        title="Receive SMS alerts"
        description="Short alert texts sent to your profile phone using company SMS setup."
        checked={!!form.staff_send_sms}
        onChange={(v) => handleToggle("staff_send_sms", v)}
        disabled={saveMutation.isPending}
      />
      <SettingsToggleRow
        title="Include me in daily digest"
        description="One alert summary per day at 8:00 AM when alerts exist."
        checked={form.staff_daily_digest !== false}
        onChange={(v) => handleToggle("staff_daily_digest", v)}
        disabled={saveMutation.isPending}
      />

      <Box sx={{ mb: 2 }}>
        <Button
          variant="outlined"
          disabled={testMutation.isPending || saveMutation.isPending}
          onClick={() => { setTestMessage(null); setTestError(null); testMutation.mutate(); }}
        >
          {testMutation.isPending ? "Sending…" : "Send test to my email/phone"}
        </Button>
      </Box>
      {testMessage && <Alert severity="success" sx={{ mb: 2 }}>{testMessage}</Alert>}
      {testError && <Alert severity="error" sx={{ mb: 2 }}>{testError}</Alert>}

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Expiry alert periods
      </Typography>
      {ALERT_NUMBER_FIELDS.map((field) => (
        <SettingsTextRow
          key={field.key}
          title={field.title}
          description={field.description}
          type="number"
          value={String(form[field.key] ?? "")}
          onChange={(v) => handleFieldChange(field.key, v)}
          disabled={saveMutation.isPending}
        />
      ))}
    </SettingsPageShell>
  );
};

export default AlertSettings;
