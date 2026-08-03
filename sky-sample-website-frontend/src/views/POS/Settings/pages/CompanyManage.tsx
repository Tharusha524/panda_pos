import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import SettingsPageShell from "../components/SettingsPageShell";
import {
  deleteCompanyLogo,
  getCompanySettings,
  updateCompanySettings,
  uploadCompanyLogo,
  type CompanySettingsPayload,
} from "../../../../api/Settings/companySettingsApi";
import { getFriendlyErrorMessage } from "../../../../utils/getFriendlyErrorMessage";
import { COMPANY_SETTINGS_BASE } from "../companyModelShortcuts";
import { APP_INFO } from "../../../../config/appInfo";

const CompanyManage: React.FC = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CompanySettingsPayload>({
    name: "",
    industry: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    tax_id: "",
    registration_number: "",
  });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [logoMessage, setLogoMessage] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["company-settings"],
    queryFn: getCompanySettings,
  });

  useEffect(() => {
    if (data) {
      setForm({
        name: data.name,
        industry: data.industry,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        zip: data.zip,
        country: data.country,
        tax_id: data.tax_id,
        registration_number: data.registration_number,
      });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: updateCompanySettings,
    onSuccess: (updated) => {
      queryClient.setQueryData(["company-settings"], updated);
      setSaveError(null);
      setSaveMessage("Company saved successfully!");
    },
    onError: (err: unknown) => {
      setSaveMessage(null);
      setSaveError(getFriendlyErrorMessage(err, "Failed to save company"));
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: uploadCompanyLogo,
    onSuccess: (updated) => {
      queryClient.setQueryData(["company-settings"], updated);
      queryClient.invalidateQueries({ queryKey: ["company-print-header"] });
      setLogoError(null);
      setLogoMessage("Logo uploaded. It will appear on all printed reports.");
    },
    onError: (err: unknown) => {
      setLogoMessage(null);
      setLogoError(getFriendlyErrorMessage(err, "Failed to upload logo"));
    },
  });

  const deleteLogoMutation = useMutation({
    mutationFn: deleteCompanyLogo,
    onSuccess: (updated) => {
      queryClient.setQueryData(["company-settings"], updated);
      queryClient.invalidateQueries({ queryKey: ["company-print-header"] });
      setLogoError(null);
      setLogoMessage("Logo removed.");
    },
    onError: (err: unknown) => {
      setLogoMessage(null);
      setLogoError(getFriendlyErrorMessage(err, "Failed to remove logo"));
    },
  });

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoMessage(null);
    setLogoError(null);
    uploadLogoMutation.mutate(file);
    e.target.value = "";
  };

  const handleChange = (field: keyof CompanySettingsPayload, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaveMessage(null);
    setSaveError(null);
  };

  if (isLoading) {
    return (
      <SettingsPageShell
        title="Manage Company"
        subtitle="Add your industry and company information"
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
        title="Manage Company"
        subtitle="Add your industry and company information"
        wide
        backTo={COMPANY_SETTINGS_BASE}
        backLabel="Company"
        hideSave
      >
        <Alert severity="error">
          {getFriendlyErrorMessage(error, "Failed to load company settings")}
        </Alert>
      </SettingsPageShell>
    );
  }

  return (
    <SettingsPageShell
      title="Manage Company"
      subtitle="Add your industry and company information"
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
      <Typography variant="h6" sx={{ mb: 2, color: "var(--pallet-blue)" }}>
        Company Logo
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Upload your logo. It appears on receipts and all printed reports with your
        company name, address, email, and phone.
      </Typography>
      {logoMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {logoMessage}
        </Alert>
      )}
      {logoError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {logoError}
        </Alert>
      )}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
          mb: 3,
          p: 2,
          border: "1px dashed #ccc",
          borderRadius: 1,
        }}
      >
        {data?.logo_url ? (
          <Box
            component="img"
            src={data.logo_url}
            alt="Company logo"
            sx={{ height: 80, maxWidth: 160, objectFit: "contain" }}
          />
        ) : (
          <Box
            sx={{
              width: 120,
              height: 80,
              bgcolor: "var(--surface-bg-alt)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 1,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              No logo
            </Typography>
          </Box>
        )}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            hidden
            onChange={handleLogoSelect}
          />
          <Button
            variant="contained"
            disabled={uploadLogoMutation.isPending}
            onClick={() => fileInputRef.current?.click()}
            sx={{ bgcolor: "var(--pallet-blue)" }}
          >
            {uploadLogoMutation.isPending ? "Uploading…" : "Upload Logo"}
          </Button>
          {data?.logo_url && (
            <Button
              variant="outlined"
              color="error"
              disabled={deleteLogoMutation.isPending}
              onClick={() => deleteLogoMutation.mutate()}
            >
              Remove
            </Button>
          )}
        </Box>
      </Box>

      <Typography variant="h6" sx={{ mb: 2, color: "var(--pallet-blue)" }}>
        Company Information
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {APP_INFO.applicationName} supports different industries. Enter your company details below.
      </Typography>
      <TextField
        fullWidth
        label="Company Name"
        value={form.name ?? ""}
        onChange={(e) => handleChange("name", e.target.value)}
        margin="normal"
        required
      />
      <TextField
        fullWidth
        label="Industry"
        value={form.industry ?? ""}
        onChange={(e) => handleChange("industry", e.target.value)}
        margin="normal"
        placeholder="e.g. Retail, Restaurant, Pharmacy"
      />
      <TextField
        fullWidth
        label="Email"
        type="email"
        value={form.email ?? ""}
        onChange={(e) => handleChange("email", e.target.value)}
        margin="normal"
      />
      <TextField
        fullWidth
        label="Phone"
        value={form.phone ?? ""}
        onChange={(e) => handleChange("phone", e.target.value)}
        margin="normal"
      />
      <TextField
        fullWidth
        label="Address"
        value={form.address ?? ""}
        onChange={(e) => handleChange("address", e.target.value)}
        margin="normal"
      />
      <Grid container spacing={2} sx={{ mt: 0 }}>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="City"
            value={form.city ?? ""}
            onChange={(e) => handleChange("city", e.target.value)}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="State"
            value={form.state ?? ""}
            onChange={(e) => handleChange("state", e.target.value)}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="ZIP Code"
            value={form.zip ?? ""}
            onChange={(e) => handleChange("zip", e.target.value)}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Country"
            value={form.country ?? ""}
            onChange={(e) => handleChange("country", e.target.value)}
          />
        </Grid>
      </Grid>
      <TextField
        fullWidth
        label="Tax ID"
        value={form.tax_id ?? ""}
        onChange={(e) => handleChange("tax_id", e.target.value)}
        margin="normal"
      />
      <TextField
        fullWidth
        label="Registration Number"
        value={form.registration_number ?? ""}
        onChange={(e) => handleChange("registration_number", e.target.value)}
        margin="normal"
      />
    </SettingsPageShell>
  );
};

export default CompanyManage;
