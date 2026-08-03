import React from "react";
import { Typography } from "@mui/material";
import SettingsPageShell from "../components/SettingsPageShell";
import SubscriptionShortcutCard from "../components/SubscriptionShortcutCard";

const SUBSCRIPTION_MANAGE_PATH = "/settings/subscription/manage";

const SubscriptionSettingsHub: React.FC = () => (
  <SettingsPageShell
    title="Subscription"
    subtitle="Your subscriptions and payment information"
    wide
    hideSave
  >
    <Typography
      variant="h6"
      align="center"
      sx={{ mb: 3, fontWeight: 600 }}
    >
      Your subscriptions and payment information
    </Typography>
    <SubscriptionShortcutCard
      title="Subscriptions"
      description="Your subscriptions information."
      to={SUBSCRIPTION_MANAGE_PATH}
      actionLabel="Manage purchases and subscriptions"
    />
  </SettingsPageShell>
);

export default SubscriptionSettingsHub;
