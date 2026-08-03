import React from "react";
import { Typography } from "@mui/material";
import SettingsPageShell from "../components/SettingsPageShell";
import NotificationShortcutCard from "../components/NotificationShortcutCard";
import {
  NOTIFICATION_MODEL_SHORTCUTS,
  NOTIFICATION_SETTINGS_BASE,
} from "../notificationModelShortcuts";
import { SETTINGS_BASE_PATH } from "../settingsShortcuts";

const NotificationSettingsHub: React.FC = () => {
  return (
    <SettingsPageShell
      title="Email & SMS Notification"
      subtitle="Customer notifications by email and SMS"
      wide
      hideSave
      backTo={SETTINGS_BASE_PATH}
      backLabel="All Settings"
    >
      <Typography
        variant="h6"
        align="center"
        sx={{ mb: 3, fontWeight: 600 }}
      >
        Your Customer notifications
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure email and SMS together for each notification type. Both channels
        are managed in one place — not separate settings.
      </Typography>
      {NOTIFICATION_MODEL_SHORTCUTS.map((item) => (
        <NotificationShortcutCard
          key={item.path}
          title={item.title}
          description={item.description}
          to={`${NOTIFICATION_SETTINGS_BASE}/${item.path}`}
          icon={item.icon}
          actionLabel={item.actionLabel}
        />
      ))}
    </SettingsPageShell>
  );
};

export default NotificationSettingsHub;
