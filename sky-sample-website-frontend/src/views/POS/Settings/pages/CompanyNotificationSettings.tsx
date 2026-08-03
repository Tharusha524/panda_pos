import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import SettingsPageShell from "../components/SettingsPageShell";
import SettingsToggleRow from "../components/SettingsToggleRow";
import EmployeeAccessGuard from "../components/EmployeeAccessGuard";
import AlertNotificationSetupInstructions from "../components/AlertNotificationSetupInstructions";
import AlertMessagePreview from "../components/AlertMessagePreview";
import {
  getCompanyNotificationSettings,
  sendCompanyNotificationTest,
  updateCompanyNotificationSettings,
  type CompanyNotificationSettingsPayload,
} from "../../../../api/Settings/companyNotificationSettingsApi";
import { getFriendlyErrorMessage } from "../../../../utils/getFriendlyErrorMessage";
import { COMPANY_SETTINGS_BASE } from "../companyModelShortcuts";

const CompanyNotificationSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CompanyNotificationSettingsPayload>({});
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smsKey, setSmsKey] = useState("");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["company-notification-settings"],
    queryFn: getCompanyNotificationSettings,
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      alerts_enabled: data.alerts_enabled,
      send_email: data.send_email,
      send_sms: data.send_sms,
      notify_owner: data.notify_owner,
      notify_employees: data.notify_employees,
      daily_digest: data.daily_digest,
      smtp_host: data.smtp_host,
      smtp_port: data.smtp_port,
      smtp_username: data.smtp_username,
      smtp_encryption: data.smtp_encryption,
      mail_from_address: data.mail_from_address,
      mail_from_name: data.mail_from_name,
      sms_api_url: data.sms_api_url,
      sms_provider: data.sms_provider,
    });
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: updateCompanyNotificationSettings,
    onSuccess: (updated) => {
      queryClient.setQueryData(["company-notification-settings"], updated);
      setSmtpPassword("");
      setSmsKey("");
      setSaveError(null);
      setSaveMessage("Company notification setup saved.");
    },
    onError: (err: unknown) => {
      setSaveMessage(null);
      setSaveError(getFriendlyErrorMessage(err, "Failed to save"));
    },
  });

  const testMutation = useMutation({
    mutationFn: sendCompanyNotificationTest,
    onSuccess: (result) => {
      setTestError(null);
      const parts: string[] = [];
      if (result.email_sent && result.email) parts.push(`Email sent to company ${result.email}`);
      if (result.sms_sent && result.phone) {
        parts.push(
          result.sms_mode === "log"
            ? `SMS logged for ${result.phone} (test mode)`
            : `SMS sent to company ${result.phone}`
        );
      }
      if (result.errors.length) parts.push(...result.errors);
      setTestMessage(parts.join(". ") || "Test sent.");
    },
    onError: (err: unknown) => {
      setTestMessage(null);
      setTestError(getFriendlyErrorMessage(err, "Test failed"));
    },
  });

  const handleSave = () => {
    const payload: CompanyNotificationSettingsPayload = { ...form };
    if (smtpPassword.trim()) payload.smtp_password = smtpPassword.trim();
    if (smsKey.trim()) payload.sms_api_key = smsKey.trim();
    saveMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <SettingsPageShell title="Alert notifications" subtitle="Company email & SMS setup" wide hideSave>
        <CircularProgress size={32} sx={{ color: "var(--pallet-blue)" }} />
      </SettingsPageShell>
    );
  }

  if (isError) {
    return (
      <SettingsPageShell title="Alert notifications" subtitle="Company email & SMS setup" wide hideSave>
        <Alert severity="error">{getFriendlyErrorMessage(error, "Failed to load")}</Alert>
      </SettingsPageShell>
    );
  }

  return (
    <EmployeeAccessGuard>
      <SettingsPageShell
        title="Alert notifications"
        subtitle="Company owner: configure how alerts are sent to you and your staff"
        wide
        onSave={handleSave}
        isSaving={saveMutation.isPending}
        backTo={COMPANY_SETTINGS_BASE}
        backLabel="Company"
      >
        {saveMessage && <Alert severity="success" sx={{ mb: 2 }}>{saveMessage}</Alert>}
        {saveError && <Alert severity="error" sx={{ mb: 2 }}>{saveError}</Alert>}

        <AlertNotificationSetupInstructions
          variant="owner"
          companyEmail={data?.company_email}
          companyPhone={data?.company_phone}
        />

        <AlertMessagePreview />

        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Configuration
        </Typography>

        <SettingsToggleRow
          title="Enable company alerts"
          description="Master switch for email/SMS inventory alerts."
          checked={form.alerts_enabled !== false}
          onChange={(v) => setForm((p) => ({ ...p, alerts_enabled: v }))}
        />
        <SettingsToggleRow
          title="Send to company owner (main email & phone)"
          description="Uses company email and phone from Manage company."
          checked={form.notify_owner !== false}
          onChange={(v) => setForm((p) => ({ ...p, notify_owner: v }))}
        />
        <SettingsToggleRow
          title="Send to employees"
          description="Employees who opt in receive alerts on their profile email/phone."
          checked={form.notify_employees !== false}
          onChange={(v) => setForm((p) => ({ ...p, notify_employees: v }))}
        />
        <SettingsToggleRow
          title="Daily digest (8:00 AM)"
          description="One combined alert per day when inventory alerts exist."
          checked={form.daily_digest !== false}
          onChange={(v) => setForm((p) => ({ ...p, daily_digest: v }))}
        />

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}>
          <NotificationsActiveIcon color="primary" /> Email setup (SMTP)
        </Typography>
        <SettingsToggleRow
          title="Enable email sending"
          description="Required for employees and owner to receive alert emails."
          checked={!!form.send_email}
          onChange={(v) => setForm((p) => ({ ...p, send_email: v }))}
        />
        <TextField fullWidth label="SMTP host" value={form.smtp_host ?? ""} onChange={(e) => setForm((p) => ({ ...p, smtp_host: e.target.value || null }))} margin="normal" placeholder="smtp.gmail.com" />
        <TextField fullWidth label="SMTP port" type="number" value={form.smtp_port ?? 587} onChange={(e) => setForm((p) => ({ ...p, smtp_port: parseInt(e.target.value, 10) || 587 }))} margin="normal" />
        <TextField fullWidth label="SMTP username" value={form.smtp_username ?? ""} onChange={(e) => setForm((p) => ({ ...p, smtp_username: e.target.value || null }))} margin="normal" placeholder="your@gmail.com" helperText="Usually the same as your email login." />
        <TextField fullWidth label="SMTP password" type="password" value={smtpPassword} onChange={(e) => setSmtpPassword(e.target.value)} margin="normal" helperText={data?.has_smtp_password ? "Leave blank to keep current password. Gmail: use App Password, not normal password." : "Gmail: use App Password (16 chars), not your normal password."} />
        <FormControl fullWidth margin="normal">
          <InputLabel>Encryption</InputLabel>
          <Select label="Encryption" value={form.smtp_encryption ?? "tls"} onChange={(e) => setForm((p) => ({ ...p, smtp_encryption: e.target.value }))}>
            <MenuItem value="tls">TLS</MenuItem>
            <MenuItem value="ssl">SSL</MenuItem>
            <MenuItem value="none">None</MenuItem>
          </Select>
        </FormControl>
        <TextField fullWidth label="From email" type="email" value={form.mail_from_address ?? ""} onChange={(e) => setForm((p) => ({ ...p, mail_from_address: e.target.value || null }))} margin="normal" />
        <TextField fullWidth label="From name" value={form.mail_from_name ?? ""} onChange={(e) => setForm((p) => ({ ...p, mail_from_name: e.target.value || null }))} margin="normal" />

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>SMS setup</Typography>
        <SettingsToggleRow
          title="Enable SMS sending"
          description="Required for text message alerts."
          checked={!!form.send_sms}
          onChange={(v) => setForm((p) => ({ ...p, send_sms: v }))}
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>SMS provider</InputLabel>
          <Select label="SMS provider" value={form.sms_provider ?? "http"} onChange={(e) => setForm((p) => ({ ...p, sms_provider: e.target.value }))}>
            <MenuItem value="http">HTTP API (your SMS company URL)</MenuItem>
            <MenuItem value="log">Test mode (log only, no real SMS)</MenuItem>
          </Select>
        </FormControl>
        <TextField
          fullWidth
          label="SMS API URL"
          value={form.sms_api_url ?? ""}
          onChange={(e) => setForm((p) => ({ ...p, sms_api_url: e.target.value || null }))}
          margin="normal"
          placeholder="Paste URL from your SMS company dashboard"
          helperText="Only if provider = HTTP API. Real URL from Dialog/Mobitel/TextIt/etc. — not the sample link."
          disabled={form.sms_provider === "log"}
        />
        <TextField
          fullWidth
          label="SMS API key"
          type="password"
          value={smsKey}
          onChange={(e) => setSmsKey(e.target.value)}
          margin="normal"
          helperText={
            form.sms_provider === "log"
              ? "Not needed in test mode."
              : data?.has_sms_api_key
                ? "Leave blank to keep current key."
                : "Secret key from your SMS provider account."
          }
          disabled={form.sms_provider === "log"}
        />

        <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button variant="outlined" disabled={testMutation.isPending} onClick={() => { setTestMessage(null); setTestError(null); testMutation.mutate(); }}>
            {testMutation.isPending ? "Sending…" : "Send test to company email/phone"}
          </Button>
        </Box>
        {testMessage && <Alert severity="success" sx={{ mt: 2 }}>{testMessage}</Alert>}
        {testError && <Alert severity="error" sx={{ mt: 2 }}>{testError}</Alert>}
      </SettingsPageShell>
    </EmployeeAccessGuard>
  );
};

export default CompanyNotificationSettings;
