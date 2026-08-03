import React from "react";
import { Link } from "react-router";
import { Box, Button, Card, CardContent, CircularProgress } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import PageTitle from "../../../../components/PageTitle";
import { SETTINGS_BASE_PATH } from "../settingsShortcuts";

interface SettingsPageShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onSave?: () => void;
  isSaving?: boolean;
  wide?: boolean;
  backTo?: string;
  backLabel?: string;
  hideSave?: boolean;
}

const SettingsPageShell: React.FC<SettingsPageShellProps> = ({
  title,
  subtitle,
  children,
  onSave,
  isSaving = false,
  wide = false,
  backTo = SETTINGS_BASE_PATH,
  backLabel = "All Settings",
  hideSave = false,
}) => {
  const showSaveButton = !hideSave && Boolean(onSave);

  return (
    <Box sx={{ p: 3 }}>
      <Button
        component={Link}
        to={backTo}
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2 }}
      >
        {backLabel}
      </Button>
      <PageTitle title={title} subtitle={subtitle} />
      <Card
        elevation={0}
        sx={{
          mb: 3,
          maxWidth: wide ? "100%" : 720,
          backgroundColor: "var(--surface-bg)",
          boxShadow: "0 0 10px rgba(0,0,0,0.1)",
          borderRadius: "0.3rem",
          border: "1px solid var(--pallet-border-blue)",
        }}
      >
        <CardContent sx={{ p: 3 }}>{children}</CardContent>
      </Card>
      {showSaveButton && (
        <Button
          variant="contained"
          startIcon={isSaving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
          onClick={onSave}
          disabled={isSaving}
          sx={{
            bgcolor: "var(--pallet-blue)",
            "&:hover": { bgcolor: "var(--pallet-main-blue)" },
          }}
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      )}
    </Box>
  );
};

export default SettingsPageShell;
