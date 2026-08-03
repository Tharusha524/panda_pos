import React, { useMemo } from "react";
import { Box, Grid, Typography } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import PageTitle from "../../../components/PageTitle";
import SettingsShortcutCard from "./components/SettingsShortcutCard";
import usePosAccess from "../../../hooks/usePosAccess";
import {
  SETTINGS_BASE_PATH,
  SETTINGS_SHORTCUTS,
} from "./settingsShortcuts";

const SettingsHub: React.FC = () => {
  const { canManageUsers } = usePosAccess();

  const shortcuts = useMemo(
    () =>
      SETTINGS_SHORTCUTS.filter((s) => {
        if ((s.path === "api" || s.path === "backup") && !canManageUsers) return false;
        return true;
      }),
    [canManageUsers]
  );
  return (
    <Box sx={{ p: 3 }}>
      <PageTitle title="Settings" subtitle="Configure your POS system" />

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 2,
          mt: 1,
        }}
      >
        <SettingsIcon sx={{ color: "var(--pallet-blue)" }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Settings Categories
        </Typography>
      </Box>
      <Typography
        variant="body2"
        sx={{ color: "var(--pallet-text-secondary)", mb: 3 }}
      >
        Select a card below to open that settings page.
      </Typography>

      <Grid container spacing={3}>
        {shortcuts.map((shortcut) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={shortcut.path}>
            <SettingsShortcutCard
              title={shortcut.title}
              description={shortcut.description}
              to={`${SETTINGS_BASE_PATH}/${shortcut.path}`}
              icon={shortcut.icon}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default SettingsHub;
