import React from "react";
import { Alert, Typography } from "@mui/material";
import SettingsPageShell from "../components/SettingsPageShell";

const RepairSettings: React.FC = () => {
  return (
    <SettingsPageShell
      title="Repair"
      subtitle="Repair module options"
      wide
      hideSave
    >
      <Alert severity="info" sx={{ mb: 2 }}>
        The repair module is enabled per user role under <strong>User → Roles &amp; Access</strong>.
        Use the Repair menu in POS to manage repair jobs. Dedicated repair numbering and warranty
        settings will be added in a future update.
      </Alert>
      <Typography variant="body2" color="text.secondary">
        If you do not see Repair in the menu, ask an administrator to grant the{" "}
        <strong>pos.repair</strong> permission to your role.
      </Typography>
    </SettingsPageShell>
  );
};

export default RepairSettings;
