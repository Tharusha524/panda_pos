import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import SettingsEthernetIcon from "@mui/icons-material/SettingsEthernet";
import SaveIcon from "@mui/icons-material/Save";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useSnackbar } from "notistack";
import CustomButton from "../../components/CustomButton";
import { APP_INFO } from "../../config/appInfo";
import { LOGIN_PATH } from "../../config/appPaths";
import { getApiBaseUrl } from "../../config/apiBase";
import {
  BACKEND_URL_PRESETS,
  getStoredApiBaseUrl,
  isBackendConfigured,
  normalizeApiBaseUrl,
  saveBackendApiBaseUrl,
  testBackendConnection,
} from "../../config/backendConfig";

function BackendConfigureForm() {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up(990));
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [apiUrl, setApiUrl] = useState("");
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(
    null
  );

  useEffect(() => {
    const stored = getStoredApiBaseUrl();
    if (stored) {
      setApiUrl(stored);
      return;
    }
    if (import.meta.env.DEV) {
      setApiUrl("http://127.0.0.1:8000");
    } else {
      setApiUrl(getApiBaseUrl());
    }
  }, []);

  const handlePreset = (value: string) => {
    setApiUrl(value);
    setTestResult(null);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testBackendConnection(apiUrl);
      setTestResult(result);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    const normalized = normalizeApiBaseUrl(apiUrl);
    if (!normalized) {
      enqueueSnackbar("Enter your backend API URL.", { variant: "warning" });
      return;
    }

    setSaving(true);
    try {
      const result = await testBackendConnection(normalized);
      if (!result.ok) {
        setTestResult(result);
        enqueueSnackbar(result.message, { variant: "error" });
        return;
      }

      saveBackendApiBaseUrl(normalized);
      enqueueSnackbar("Backend saved. You can now sign in.", { variant: "success" });
      navigate(LOGIN_PATH, { replace: true });
    } finally {
      setSaving(false);
    }
  };

  const alreadyConfigured = isBackendConfigured();

  return (
    <Stack
      spacing={2}
      sx={{
        height: isMdUp ? "100vh" : "auto",
        justifyContent: "center",
        margin: "2.5rem",
        marginBottom: isMdUp ? "2.5rem" : "22vh",
      }}
    >
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, color: "var(--pallet-blue)" }}>
          Backend setup
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {APP_INFO.applicationName} — connect to your Laravel API once, then sign in.
        </Typography>
      </Box>

      {alreadyConfigured && (
        <Alert severity="info">
          Backend is already configured. Update the URL below or continue to login.
        </Alert>
      )}

      <Typography variant="body2" color="text.secondary">
        Enter the Laravel backend root URL (where <code>public/index.php</code> lives).
        Do not add <code>/api</code> at the end.
      </Typography>

      <TextField
        required
        fullWidth
        label="Backend API URL"
        placeholder="http://127.0.0.1:8000"
        value={apiUrl}
        onChange={(e) => {
          setApiUrl(e.target.value);
          setTestResult(null);
        }}
        size="small"
        helperText="Example: http://127.0.0.1:8000 or https://your-domain.com/pos/backend/public"
      />

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {BACKEND_URL_PRESETS.map((preset) => (
          <Chip
            key={preset.value}
            label={preset.label}
            size="small"
            clickable
            variant="outlined"
            onClick={() => handlePreset(preset.value)}
          />
        ))}
      </Stack>

      {testResult && (
        <Alert severity={testResult.ok ? "success" : "error"}>{testResult.message}</Alert>
      )}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <Button
          variant="outlined"
          startIcon={testing ? <CircularProgress size={16} /> : <SettingsEthernetIcon />}
          onClick={handleTest}
          disabled={testing || saving || !apiUrl.trim()}
          sx={{ textTransform: "none" }}
        >
          {testing ? "Testing…" : "Test connection"}
        </Button>
        <CustomButton
          variant="contained"
          startIcon={saving ? <CircularProgress color="inherit" size={16} /> : <SaveIcon />}
          onClick={handleSave}
          disabled={testing || saving || !apiUrl.trim()}
          sx={{ backgroundColor: "var(--pallet-blue)" }}
        >
          {saving ? "Saving…" : "Save & continue to login"}
        </CustomButton>
      </Stack>

      {alreadyConfigured && (
        <Button
          variant="text"
          onClick={() => navigate(LOGIN_PATH, { replace: true })}
          sx={{ alignSelf: "flex-start", textTransform: "none", color: "var(--pallet-orange)" }}
        >
          Skip — go to login
        </Button>
      )}

      <Box sx={{ mt: 1 }}>
        <Typography variant="caption" color="text.secondary" display="block">
          Saved locally in this browser. API calls use:{" "}
          <strong>{normalizeApiBaseUrl(apiUrl) || "—"}/api/…</strong>
        </Typography>
      </Box>
    </Stack>
  );
}

export default BackendConfigureForm;
