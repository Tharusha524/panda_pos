import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import SettingsPageShell from "../components/SettingsPageShell";
import EmployeeAccessGuard from "../components/EmployeeAccessGuard";
import {
  getApiSettings,
  regenerateIntegrationApiKey,
  updateApiSettings,
  type ApiSettingsPayload,
} from "../../../../api/Settings/apiSettingsApi";
import { getApiBaseUrl } from "../../../../config/apiBase";
import { getFriendlyErrorMessage } from "../../../../utils/getFriendlyErrorMessage";

const ApiConfigurationSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ApiSettingsPayload>({});
  const [integrationKeyInput, setIntegrationKeyInput] = useState("");
  const [webhookSecretInput, setWebhookSecretInput] = useState("");
  const [smsKeyInput, setSmsKeyInput] = useState("");
  const [paymentKeyInput, setPaymentKeyInput] = useState("");
  const [newKeyPlain, setNewKeyPlain] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["api-settings"],
    queryFn: getApiSettings,
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      api_enabled: data.api_enabled,
      public_base_url: data.public_base_url ?? getApiBaseUrl(),
      webhook_enabled: data.webhook_enabled,
      webhook_url: data.webhook_url,
      cors_allowed_origins: data.cors_allowed_origins,
      mobile_sync_enabled: data.mobile_sync_enabled,
      mobile_sync_interval_seconds: data.mobile_sync_interval_seconds,
      sms_api_url: data.sms_api_url,
      payment_gateway: data.payment_gateway,
      notes: data.notes,
    });
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: updateApiSettings,
    onSuccess: (updated) => {
      queryClient.setQueryData(["api-settings"], updated);
      setIntegrationKeyInput("");
      setWebhookSecretInput("");
      setSmsKeyInput("");
      setPaymentKeyInput("");
      setSaveError(null);
      setSaveMessage("API configuration saved.");
    },
    onError: (err: unknown) => {
      setSaveMessage(null);
      setSaveError(getFriendlyErrorMessage(err, "Failed to save API settings"));
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: regenerateIntegrationApiKey,
    onSuccess: (updated) => {
      queryClient.setQueryData(["api-settings"], updated);
      if (updated.integration_api_key_plain) {
        setNewKeyPlain(updated.integration_api_key_plain);
      }
      setForm((prev) => ({ ...prev, api_enabled: true }));
      setSaveMessage("New integration API key generated. Copy it below.");
    },
    onError: (err: unknown) => {
      setSaveError(getFriendlyErrorMessage(err, "Failed to generate API key"));
    },
  });

  const handleSave = () => {
    const payload: ApiSettingsPayload = { ...form };
    if (integrationKeyInput.trim()) payload.integration_api_key = integrationKeyInput.trim();
    if (webhookSecretInput.trim()) payload.webhook_secret = webhookSecretInput.trim();
    if (smsKeyInput.trim()) payload.sms_api_key = smsKeyInput.trim();
    if (paymentKeyInput.trim()) payload.payment_gateway_key = paymentKeyInput.trim();
    saveMutation.mutate(payload);
  };

  const copyKey = async () => {
    if (!newKeyPlain) return;
    await navigator.clipboard.writeText(newKeyPlain);
    setSaveMessage("API key copied to clipboard.");
  };

  if (isLoading) {
    return (
      <EmployeeAccessGuard>
        <SettingsPageShell title="API Configuration" subtitle="Backend API & integrations" wide hideSave>
          <CircularProgress size={32} sx={{ color: "var(--pallet-blue)" }} />
        </SettingsPageShell>
      </EmployeeAccessGuard>
    );
  }

  if (isError) {
    return (
      <EmployeeAccessGuard>
        <SettingsPageShell title="API Configuration" subtitle="Backend API & integrations" wide hideSave>
          <Alert severity="error">
            {getFriendlyErrorMessage(error, "Failed to load API settings")}
          </Alert>
        </SettingsPageShell>
      </EmployeeAccessGuard>
    );
  }

  return (
    <EmployeeAccessGuard>
      <SettingsPageShell
        title="API Configuration"
        subtitle="Configure how mobile apps and external systems connect to your POS backend"
        wide
        onSave={handleSave}
        isSaving={saveMutation.isPending}
      >
        {saveMessage && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSaveMessage(null)}>
            {saveMessage}
          </Alert>
        )}
        {saveError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveError(null)}>
            {saveError}
          </Alert>
        )}

        <Alert severity="info" sx={{ mb: 2 }}>
          API target:{" "}
          <strong>
            {import.meta.env.DEV
              ? `${window.location.origin}/api → ${import.meta.env.VITE_API_BASE_URL || "proxy"}/api`
              : `${getApiBaseUrl()}/api`}
          </strong>
          . Set <code>VITE_API_BASE_URL</code> in <code>.env.local</code>, then restart{" "}
          <code>npm run dev</code>.
        </Alert>

        <Typography variant="h6" sx={{ mb: 1, color: "var(--pallet-blue)" }}>
          General API access
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={Boolean(form.api_enabled)}
              onChange={(e) => setForm((p) => ({ ...p, api_enabled: e.target.checked }))}
            />
          }
          label="Enable external API access"
        />
        <TextField
          fullWidth
          label="Public API base URL"
          placeholder="https://finance.skytechsl.com/pos/backend/public"
          value={form.public_base_url ?? ""}
          onChange={(e) => setForm((p) => ({ ...p, public_base_url: e.target.value || null }))}
          margin="normal"
          helperText="Base URL used by POS Mobile and third-party integrations (no trailing slash)."
        />

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" sx={{ mb: 1, color: "var(--pallet-blue)" }}>
          Integration API key
        </Typography>
        {data?.has_integration_api_key && (
          <Chip
            label={`Current key: ${data.integration_api_key_preview ?? "set"}`}
            size="small"
            sx={{ mb: 1 }}
          />
        )}
        {newKeyPlain && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ wordBreak: "break-all", mb: 1 }}>
              {newKeyPlain}
            </Typography>
            <Button size="small" startIcon={<ContentCopyIcon />} onClick={copyKey}>
              Copy key
            </Button>
          </Alert>
        )}
        <TextField
          fullWidth
          label="Set custom integration key (optional)"
          type="password"
          value={integrationKeyInput}
          onChange={(e) => setIntegrationKeyInput(e.target.value)}
          margin="normal"
          helperText="Leave blank to keep existing key. Use Generate to create a secure key."
        />
        <Button
          variant="outlined"
          startIcon={<VpnKeyIcon />}
          onClick={() => regenerateMutation.mutate()}
          disabled={regenerateMutation.isPending}
          sx={{ mt: 1, textTransform: "none" }}
        >
          {regenerateMutation.isPending ? "Generating…" : "Generate new API key"}
        </Button>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" sx={{ mb: 1, color: "var(--pallet-blue)" }}>
          Webhooks
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={Boolean(form.webhook_enabled)}
              onChange={(e) => setForm((p) => ({ ...p, webhook_enabled: e.target.checked }))}
            />
          }
          label="Enable webhooks"
        />
        <TextField
          fullWidth
          label="Webhook URL"
          value={form.webhook_url ?? ""}
          onChange={(e) => setForm((p) => ({ ...p, webhook_url: e.target.value || null }))}
          margin="normal"
        />
        {data?.has_webhook_secret && (
          <Typography variant="caption" color="text.secondary" display="block">
            Secret set: {data.webhook_secret_preview}
          </Typography>
        )}
        <TextField
          fullWidth
          label="Webhook secret (optional)"
          type="password"
          value={webhookSecretInput}
          onChange={(e) => setWebhookSecretInput(e.target.value)}
          margin="normal"
        />

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" sx={{ mb: 1, color: "var(--pallet-blue)" }}>
          Mobile sync & CORS
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={Boolean(form.mobile_sync_enabled)}
              onChange={(e) => setForm((p) => ({ ...p, mobile_sync_enabled: e.target.checked }))}
            />
          }
          label="Enable mobile app sync"
        />
        <TextField
          fullWidth
          label="Sync interval (seconds)"
          type="number"
          value={form.mobile_sync_interval_seconds ?? 300}
          onChange={(e) =>
            setForm((p) => ({
              ...p,
              mobile_sync_interval_seconds: parseInt(e.target.value, 10) || 300,
            }))
          }
          margin="normal"
          inputProps={{ min: 60, max: 86400 }}
        />
        <TextField
          fullWidth
          label="CORS allowed origins"
          placeholder="https://app.example.com, https://mobile.example.com"
          value={form.cors_allowed_origins ?? ""}
          onChange={(e) => setForm((p) => ({ ...p, cors_allowed_origins: e.target.value || null }))}
          margin="normal"
          multiline
          minRows={2}
          helperText="Comma-separated list of origins allowed to call your API."
        />

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" sx={{ mb: 1, color: "var(--pallet-blue)" }}>
          SMS & payment gateways
        </Typography>
        <TextField
          fullWidth
          label="SMS provider API URL"
          placeholder="https://your-sms-provider.com/api/send"
          value={form.sms_api_url ?? ""}
          onChange={(e) => setForm((p) => ({ ...p, sms_api_url: e.target.value || null }))}
          margin="normal"
          helperText="POST endpoint. JSON body: { to, message, api_key }. Or set SMS_PROVIDER=twilio in backend .env."
        />
        {data?.has_sms_api_key && (
          <Typography variant="caption" color="text.secondary" display="block">
            SMS key: {data.sms_api_key_preview}
          </Typography>
        )}
        <TextField
          fullWidth
          label="SMS API key"
          type="password"
          value={smsKeyInput}
          onChange={(e) => setSmsKeyInput(e.target.value)}
          margin="normal"
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Payment gateway</InputLabel>
          <Select
            value={form.payment_gateway ?? "none"}
            label="Payment gateway"
            onChange={(e) => setForm((p) => ({ ...p, payment_gateway: e.target.value }))}
          >
            <MenuItem value="none">None</MenuItem>
            <MenuItem value="stripe">Stripe</MenuItem>
            <MenuItem value="paypal">PayPal</MenuItem>
            <MenuItem value="custom">Custom</MenuItem>
          </Select>
        </FormControl>
        {data?.has_payment_gateway_key && (
          <Typography variant="caption" color="text.secondary" display="block">
            Gateway key: {data.payment_gateway_key_preview}
          </Typography>
        )}
        <TextField
          fullWidth
          label="Payment gateway API key"
          type="password"
          value={paymentKeyInput}
          onChange={(e) => setPaymentKeyInput(e.target.value)}
          margin="normal"
        />

        <TextField
          fullWidth
          label="Admin notes"
          value={form.notes ?? ""}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value || null }))}
          margin="normal"
          multiline
          minRows={2}
        />

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" sx={{ mb: 2, color: "var(--pallet-blue)" }}>
          Available API endpoints
        </Typography>
        <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid var(--pallet-border-blue)" }}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Method</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Path</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(data?.endpoint_catalog ?? []).map((row) => (
                <TableRow key={`${row.method}-${row.path}`}>
                  <TableCell>
                    <Chip label={row.method} size="small" color="primary" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Box component="code" sx={{ fontSize: "0.85rem" }}>
                      {row.path}
                    </Box>
                  </TableCell>
                  <TableCell>{row.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </SettingsPageShell>
    </EmployeeAccessGuard>
  );
};

export default ApiConfigurationSettings;
