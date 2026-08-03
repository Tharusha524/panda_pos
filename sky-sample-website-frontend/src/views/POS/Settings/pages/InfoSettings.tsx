import React from "react";
import { CircularProgress, Grid, TextField, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import SettingsPageShell from "../components/SettingsPageShell";
import { APP_INFO, formatStoreId } from "../../../../config/appInfo";
import { getSubscriptionDetails } from "../../../../api/Settings/subscriptionApi";

const InfoSettings: React.FC = () => {
  const { data: subscription, isLoading } = useQuery({
    queryKey: ["subscription-details"],
    queryFn: getSubscriptionDetails,
  });

  const storeId = formatStoreId(subscription?.cloud_id);

  return (
    <SettingsPageShell
      title="Info Settings"
      subtitle="System version and application details"
      hideSave
    >
      <Typography variant="h6" sx={{ mb: 2 }}>
        System Information
      </Typography>
      {isLoading ? (
        <CircularProgress size={28} sx={{ color: "var(--pallet-blue)" }} />
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Application Name"
              value={APP_INFO.applicationName}
              margin="normal"
              InputProps={{ readOnly: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Version"
              value={APP_INFO.version}
              margin="normal"
              InputProps={{ readOnly: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Environment"
              value={APP_INFO.environment}
              margin="normal"
              InputProps={{ readOnly: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="License"
              value={subscription?.product_name ?? APP_INFO.licenseType}
              margin="normal"
              InputProps={{ readOnly: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Developer"
              value={APP_INFO.developer}
              margin="normal"
              InputProps={{ readOnly: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Store ID"
              value={storeId}
              margin="normal"
              InputProps={{ readOnly: true }}
            />
          </Grid>
        </Grid>
      )}
    </SettingsPageShell>
  );
};

export default InfoSettings;
