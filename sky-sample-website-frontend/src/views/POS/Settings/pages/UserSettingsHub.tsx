import React, { useMemo } from "react";
import { Alert, Grid, Typography } from "@mui/material";
import SettingsPageShell from "../components/SettingsPageShell";
import SettingsShortcutCard from "../components/SettingsShortcutCard";
import usePosAccess from "../../../../hooks/usePosAccess";
import {
  USER_MODEL_SHORTCUTS,
  USER_SETTINGS_BASE,
} from "../userModelShortcuts";
import { SETTINGS_BASE_PATH } from "../settingsShortcuts";

const UserSettingsHub: React.FC = () => {
  const { canManageUsers, user } = usePosAccess();

  const shortcuts = useMemo(() => {
    return USER_MODEL_SHORTCUTS.filter((item) => {
      if ((item.path === "users" || item.path === "roles") && !canManageUsers) {
        return false;
      }
      return true;
    });
  }, [canManageUsers]);

  return (
    <SettingsPageShell
      title="User Settings"
      subtitle="Your profile and employee accounts"
      wide
      hideSave
      backTo={SETTINGS_BASE_PATH}
      backLabel="All Settings"
    >
      {canManageUsers && (
        <Alert severity="info" sx={{ mb: 2 }}>
          As <strong>Administrator</strong>, you can create employee logins here. Each employee signs in
          with their own email and password and only sees menus allowed by their role.
        </Alert>
      )}
      {!canManageUsers && user && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Signed in as <strong>{user.name}</strong>. Contact your admin to change your access.
        </Alert>
      )}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select an option below.
      </Typography>
      <Grid container spacing={3}>
        {shortcuts.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.path}>
            <SettingsShortcutCard
              title={item.title}
              description={item.description}
              to={`${USER_SETTINGS_BASE}/${item.path}`}
              icon={item.icon}
            />
          </Grid>
        ))}
      </Grid>
    </SettingsPageShell>
  );
};

export default UserSettingsHub;
