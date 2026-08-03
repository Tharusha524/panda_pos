import React, { useEffect, useState } from "react";
import {
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import SettingsPageShell from "../components/SettingsPageShell";
import {
  getCompanySettings,
  updateCompanyLocale,
  type CompanyLocalePayload,
} from "../../../../api/Settings/companySettingsApi";
import { getFriendlyErrorMessage } from "../../../../utils/getFriendlyErrorMessage";
import { COMPANY_SETTINGS_BASE } from "../companyModelShortcuts";

const CURRENCIES = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "INR", label: "INR - Indian Rupee" },
  { value: "LKR", label: "LKR - Sri Lankan Rupee" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "si", label: "Sinhala" },
  { value: "ta", label: "Tamil" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" },
  { value: "de", label: "German" },
];

const CurrencyLanguageSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CompanyLocalePayload>({
    currency: "USD",
    language: "en",
  });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["company-settings"],
    queryFn: getCompanySettings,
  });

  useEffect(() => {
    if (data) {
      setForm({
        currency: data.currency,
        language: data.language,
      });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: updateCompanyLocale,
    onSuccess: (updated) => {
      queryClient.setQueryData(["company-settings"], updated);
      setSaveError(null);
      setSaveMessage("Currency and language saved successfully!");
    },
    onError: (err: unknown) => {
      setSaveMessage(null);
      setSaveError(getFriendlyErrorMessage(err, "Failed to save settings"));
    },
  });

  if (isLoading) {
    return (
      <SettingsPageShell
        title="Currency & Language"
        subtitle="Select your currency and language"
        wide
        backTo={COMPANY_SETTINGS_BASE}
        backLabel="Company"
        hideSave
      >
        <CircularProgress size={32} sx={{ color: "var(--pallet-blue)" }} />
      </SettingsPageShell>
    );
  }

  if (isError) {
    return (
      <SettingsPageShell
        title="Currency & Language"
        subtitle="Select your currency and language"
        wide
        backTo={COMPANY_SETTINGS_BASE}
        backLabel="Company"
        hideSave
      >
        <Alert severity="error">
          {getFriendlyErrorMessage(error, "Failed to load settings")}
        </Alert>
      </SettingsPageShell>
    );
  }

  return (
    <SettingsPageShell
      title="Currency & Language"
      subtitle="Select your currency and language"
      wide
      backTo={COMPANY_SETTINGS_BASE}
      backLabel="Company"
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
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select your currency and language for the POS system.
      </Typography>
      <FormControl fullWidth margin="normal">
        <InputLabel>Currency</InputLabel>
        <Select
          value={form.currency}
          label="Currency"
          onChange={(e) => {
            setForm((p) => ({ ...p, currency: e.target.value }));
            setSaveMessage(null);
            setSaveError(null);
          }}
        >
          {CURRENCIES.map((c) => (
            <MenuItem key={c.value} value={c.value}>
              {c.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth margin="normal">
        <InputLabel>Language</InputLabel>
        <Select
          value={form.language}
          label="Language"
          onChange={(e) => {
            setForm((p) => ({ ...p, language: e.target.value }));
            setSaveMessage(null);
            setSaveError(null);
          }}
        >
          {LANGUAGES.map((lang) => (
            <MenuItem key={lang.value} value={lang.value}>
              {lang.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </SettingsPageShell>
  );
};

export default CurrencyLanguageSettings;
