import React from "react";
import { Grid, Typography } from "@mui/material";
import SettingsPageShell from "../components/SettingsPageShell";
import CompanyShortcutCard from "../components/CompanyShortcutCard";
import {
  COMPANY_MODEL_SHORTCUTS,
  COMPANY_SETTINGS_BASE,
} from "../companyModelShortcuts";
import { SETTINGS_BASE_PATH } from "../settingsShortcuts";

const CompanySettingsHub: React.FC = () => {
  return (
    <SettingsPageShell
      title="Company"
      subtitle="Manage company, branches, and regional settings"
      wide
      hideSave
      backTo={SETTINGS_BASE_PATH}
      backLabel="All Settings"
    >
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select an option below to manage your business setup.
      </Typography>
      <Grid container spacing={3}>
        {COMPANY_MODEL_SHORTCUTS.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.path}>
            <CompanyShortcutCard
              title={item.title}
              description={item.description}
              to={`${COMPANY_SETTINGS_BASE}/${item.path}`}
              icon={item.icon}
              actionLabel={item.actionLabel}
            />
          </Grid>
        ))}
      </Grid>
    </SettingsPageShell>
  );
};

export default CompanySettingsHub;
