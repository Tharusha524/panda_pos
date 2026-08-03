import React, { useEffect, useRef, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import SettingsPageShell from "../components/SettingsPageShell";
import SettingsToggleRow from "../components/SettingsToggleRow";
import SettingsSelectRow, { SettingsTextRow } from "../components/SettingsSelectRow";
import SettingsRadioRow from "../components/SettingsRadioRow";
import {
  deleteHardwareLogo80mm,
  deleteHardwareLogoA4,
  getHardwareSettings,
  openCashDrawer,
  updateHardwareSettings,
  uploadHardwareLogo80mm,
  uploadHardwareLogoA4,
  type HardwareSettingsPayload,
} from "../../../../api/Settings/hardwareSettingsApi";
import { getFriendlyErrorMessage } from "../../../../utils/getFriendlyErrorMessage";
import { invalidatePosRuntimeSettings } from "../../../../utils/invalidatePosRuntimeSettings";
import {
  HARDWARE_PRINTING_TOGGLES,
  HARDWARE_RECEIPT_TOGGLES,
  LETTERHEAD_MARGIN_OPTIONS,
  PAPER_SIZE_OPTIONS,
  RECEIPT_STYLE_OPTIONS,
} from "../hardwareSettingFields";

const logoCardSx = {
  p: 2,
  mb: 1.5,
  bgcolor: "var(--surface-bg)",
  border: "1px solid var(--surface-border)",
  borderRadius: "4px",
};

const HardwareSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const logo80Ref = useRef<HTMLInputElement>(null);
  const logoA4Ref = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<HardwareSettingsPayload>({});
  const [logo80Url, setLogo80Url] = useState<string | null>(null);
  const [logoA4Url, setLogoA4Url] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["hardware-settings"],
    queryFn: getHardwareSettings,
  });

  useEffect(() => {
    if (data) {
      const { id: _id, logo_80mm_url, logo_a4_a5_url, ...settings } = data;
      setForm(settings);
      setLogo80Url(logo_80mm_url);
      setLogoA4Url(logo_a4_a5_url);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: updateHardwareSettings,
    onSuccess: (updated) => {
      queryClient.setQueryData(["hardware-settings"], updated);
      invalidatePosRuntimeSettings(queryClient);
      setSaveError(null);
      setSaveMessage("Hardware settings saved successfully!");
    },
    onError: (err: unknown) => {
      setSaveMessage(null);
      setSaveError(
        getFriendlyErrorMessage(err, "Failed to save hardware settings")
      );
    },
  });

  const upload80Mutation = useMutation({
    mutationFn: uploadHardwareLogo80mm,
    onSuccess: (updated) => {
      queryClient.setQueryData(["hardware-settings"], updated);
      setLogo80Url(updated.logo_80mm_url);
      enqueueSnackbar("80mm logo uploaded", { variant: "success" });
    },
    onError: (err: unknown) => {
      enqueueSnackbar(getFriendlyErrorMessage(err, "Upload failed"), {
        variant: "error",
      });
    },
  });

  const uploadA4Mutation = useMutation({
    mutationFn: uploadHardwareLogoA4,
    onSuccess: (updated) => {
      queryClient.setQueryData(["hardware-settings"], updated);
      setLogoA4Url(updated.logo_a4_a5_url);
      enqueueSnackbar("A4/A5 logo uploaded", { variant: "success" });
    },
    onError: (err: unknown) => {
      enqueueSnackbar(getFriendlyErrorMessage(err, "Upload failed"), {
        variant: "error",
      });
    },
  });

  const cashDrawerMutation = useMutation({
    mutationFn: openCashDrawer,
    onSuccess: (res) => {
      enqueueSnackbar(res.message, { variant: "success" });
    },
    onError: (err: unknown) => {
      enqueueSnackbar(getFriendlyErrorMessage(err, "Failed to open drawer"), {
        variant: "error",
      });
    },
  });

  const handleToggle = (field: keyof HardwareSettingsPayload, value: boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaveMessage(null);
    setSaveError(null);
  };

  const handleFieldChange = (field: keyof HardwareSettingsPayload, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaveMessage(null);
    setSaveError(null);
  };

  if (isLoading) {
    return (
      <SettingsPageShell title="Hardware" subtitle="Printers and peripherals" wide hideSave>
        <CircularProgress size={32} sx={{ color: "var(--pallet-blue)" }} />
      </SettingsPageShell>
    );
  }

  if (isError) {
    return (
      <SettingsPageShell title="Hardware" subtitle="Printers and peripherals" wide hideSave>
        <Alert severity="error">
          {getFriendlyErrorMessage(error, "Failed to load hardware settings")}
        </Alert>
      </SettingsPageShell>
    );
  }

  return (
    <SettingsPageShell
      title="Hardware"
      subtitle="Printers, receipt layout, and peripherals"
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

      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: "var(--pallet-blue)" }}>
        Printing
      </Typography>

      <SettingsSelectRow
        title="Printing Paper size"
        description="Select your printing paper size"
        value={form.printing_paper_size ?? "a4"}
        options={PAPER_SIZE_OPTIONS}
        onChange={(v) => handleFieldChange("printing_paper_size", v)}
        disabled={saveMutation.isPending}
      />

      <SettingsRadioRow
        title="Sales receipt printout style"
        description="Select your printing style of receipt"
        value={form.sales_receipt_printout_style ?? "style_4"}
        options={RECEIPT_STYLE_OPTIONS}
        onChange={(v) => handleFieldChange("sales_receipt_printout_style", v)}
        disabled={saveMutation.isPending}
      />

      {HARDWARE_PRINTING_TOGGLES.map((field) => (
        <SettingsToggleRow
          key={field.key}
          title={field.title}
          description={field.description}
          checked={Boolean(form[field.key])}
          onChange={(checked) => handleToggle(field.key, checked)}
          disabled={saveMutation.isPending}
        />
      ))}

      <Accordion
        sx={{ mb: 1.5, border: "1px solid var(--surface-border)", boxShadow: "none" }}
        defaultExpanded={form.allow_custom_header_on_sales_receipt}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Custom Header Details
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField
            fullWidth
            label="Company name"
            value={form.custom_header_name ?? ""}
            onChange={(e) => handleFieldChange("custom_header_name", e.target.value)}
            margin="dense"
          />
          <TextField
            fullWidth
            label="Address"
            value={form.custom_header_address ?? ""}
            onChange={(e) => handleFieldChange("custom_header_address", e.target.value)}
            margin="dense"
            multiline
            rows={2}
          />
          <TextField
            fullWidth
            label="Phone"
            value={form.custom_header_phone ?? ""}
            onChange={(e) => handleFieldChange("custom_header_phone", e.target.value)}
            margin="dense"
          />
        </AccordionDetails>
      </Accordion>

      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, mt: 2, color: "var(--pallet-blue)" }}>
        Sales receipt printout
      </Typography>

      {HARDWARE_RECEIPT_TOGGLES.map((field) => (
        <SettingsToggleRow
          key={field.key}
          title={field.title}
          description={field.description}
          checked={Boolean(form[field.key])}
          onChange={(checked) => handleToggle(field.key, checked)}
          disabled={saveMutation.isPending}
        />
      ))}

      <SettingsTextRow
        title="Customize label for discount"
        description="You can customize the label for the discount field in the sales print."
        value={form.customize_label_for_discount ?? "Your Discount"}
        onChange={(v) => handleFieldChange("customize_label_for_discount", v)}
        disabled={saveMutation.isPending}
      />

      <Box sx={logoCardSx}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
          Open cash drawer
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Open your cash drawer by clicking on the button.
        </Typography>
        <Button
          variant="outlined"
          startIcon={<PointOfSaleIcon />}
          onClick={() => cashDrawerMutation.mutate()}
          disabled={cashDrawerMutation.isPending}
          sx={{ color: "var(--pallet-blue)", borderColor: "var(--pallet-blue)" }}
        >
          {cashDrawerMutation.isPending ? "Opening…" : "Cash Drawer"}
        </Button>
      </Box>

      <SettingsSelectRow
        title="Letterhead Top Margin (cm)"
        description="Extra top space for pre-printed letterhead on A4, A5, or Letter only. Ignored for 80mm thermal. Set None for plain paper."
        value={form.letterhead_top_margin_cm ?? "none"}
        options={LETTERHEAD_MARGIN_OPTIONS}
        onChange={(v) => handleFieldChange("letterhead_top_margin_cm", v)}
        disabled={saveMutation.isPending}
      />

      <Box sx={logoCardSx}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Logo 80mm
        </Typography>
        {logo80Url && (
          <Box
            component="img"
            src={logo80Url}
            alt="80mm receipt logo"
            sx={{ height: 60, maxWidth: 160, objectFit: "contain", mb: 1, display: "block" }}
          />
        )}
        <input
          ref={logo80Ref}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload80Mutation.mutate(file);
            e.target.value = "";
          }}
        />
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            variant="contained"
            size="small"
            disabled={upload80Mutation.isPending}
            onClick={() => logo80Ref.current?.click()}
            sx={{ bgcolor: "var(--pallet-blue)" }}
          >
            Upload
          </Button>
          {logo80Url && (
            <Button
              variant="outlined"
              size="small"
              color="error"
              onClick={() =>
                deleteHardwareLogo80mm().then((updated) => {
                  queryClient.setQueryData(["hardware-settings"], updated);
                  setLogo80Url(null);
                })
              }
            >
              Remove
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={logoCardSx}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Logo A4 or A5
        </Typography>
        {logoA4Url && (
          <Box
            component="img"
            src={logoA4Url}
            alt="A4/A5 receipt logo"
            sx={{ height: 60, maxWidth: 160, objectFit: "contain", mb: 1, display: "block" }}
          />
        )}
        <input
          ref={logoA4Ref}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadA4Mutation.mutate(file);
            e.target.value = "";
          }}
        />
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            variant="contained"
            size="small"
            disabled={uploadA4Mutation.isPending}
            onClick={() => logoA4Ref.current?.click()}
            sx={{ bgcolor: "var(--pallet-blue)" }}
          >
            Upload
          </Button>
          {logoA4Url && (
            <Button
              variant="outlined"
              size="small"
              color="error"
              onClick={() =>
                deleteHardwareLogoA4().then((updated) => {
                  queryClient.setQueryData(["hardware-settings"], updated);
                  setLogoA4Url(null);
                })
              }
            >
              Remove
            </Button>
          )}
        </Box>
      </Box>
    </SettingsPageShell>
  );
};

export default HardwareSettings;
