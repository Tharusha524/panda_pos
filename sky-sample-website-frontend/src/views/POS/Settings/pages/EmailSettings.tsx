import React from "react";
import { Alert, Button, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router";
import SettingsPageShell from "../components/SettingsPageShell";
import { SETTINGS_BASE_PATH } from "../settingsShortcuts";
import { NOTIFICATION_SETTINGS_BASE } from "../notificationModelShortcuts";
import { COMPANY_SETTINGS_BASE } from "../companyModelShortcuts";

const EmailSettings: React.FC = () => {
  return (
    <SettingsPageShell
      title="Email Settings"
      subtitle="Email & SMS for alerts and customers"
      wide
      hideSave
    >
      <Alert severity="info" sx={{ mb: 2 }}>
        <strong>Staff & owner inventory alerts</strong> (expired stock, low stock, etc.) — configure SMTP
        and SMS in{" "}
        <RouterLink to={`${COMPANY_SETTINGS_BASE}/notifications`}>
          Settings → Company → Alert notifications
        </RouterLink>
        . Full setup instructions are on that page.
      </Alert>
      <Alert severity="info" sx={{ mb: 2 }}>
        <strong>Customer emails</strong> (sales receipts, payment confirmations) — configure templates under{" "}
        <strong>Email &amp; SMS Notification</strong>.
      </Alert>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Choose what you want to set up:
      </Typography>
      <Button
        component={RouterLink}
        to={`${COMPANY_SETTINGS_BASE}/notifications`}
        variant="contained"
        sx={{
          mr: 1.5,
          mb: 1,
          bgcolor: "var(--pallet-blue)",
          "&:hover": { bgcolor: "var(--pallet-main-blue)" },
        }}
      >
        Owner alert setup (SMTP + SMS)
      </Button>
      <Button
        component={RouterLink}
        to={NOTIFICATION_SETTINGS_BASE}
        variant="outlined"
        sx={{ mr: 1.5, mb: 1 }}
      >
        Customer notification templates
      </Button>
      <Button
        component={RouterLink}
        to={`${SETTINGS_BASE_PATH}/alert`}
        variant="outlined"
        sx={{ mb: 1 }}
      >
        My alerts (employee)
      </Button>
    </SettingsPageShell>
  );
};

export default EmailSettings;
