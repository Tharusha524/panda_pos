import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import SettingsPageShell from "../components/SettingsPageShell";
import SubscriptionPayDialog from "../components/SubscriptionPayDialog";
import {
  getSubscriptionDetails,
  paySubscriptionOnline,
} from "../../../../api/Settings/subscriptionApi";
import { getFriendlyErrorMessage } from "../../../../utils/getFriendlyErrorMessage";
import { useSnackbar } from "notistack";

const SubscriptionManage: React.FC = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [payOpen, setPayOpen] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["subscription-details"],
    queryFn: getSubscriptionDetails,
  });

  const payMutation = useMutation({
    mutationFn: paySubscriptionOnline,
    onSuccess: (updated) => {
      queryClient.setQueryData(["subscription-details"], updated);
      queryClient.setQueryData(["subscription-status"], {
        can_access: updated.can_access,
        is_overdue: updated.is_overdue,
        next_payment_date: updated.next_payment_date,
        message: updated.message,
      });
      setPayOpen(false);
      enqueueSnackbar("Payment successful. Access restored.", { variant: "success" });
    },
    onError: (err: unknown) => {
      enqueueSnackbar(
        getFriendlyErrorMessage(err, "Payment failed"),
        { variant: "error" }
      );
    },
  });

  if (isLoading) {
    return (
      <SettingsPageShell
        title="Subscription"
        subtitle="Plan and billing"
        wide
        hideSave
        backTo="/settings/subscription"
        backLabel="Subscription"
      >
        <CircularProgress size={32} sx={{ color: "var(--pallet-blue)" }} />
      </SettingsPageShell>
    );
  }

  if (isError || !data) {
    return (
      <SettingsPageShell
        title="Subscription"
        subtitle="Plan and billing"
        wide
        hideSave
        backTo="/settings/subscription"
        backLabel="Subscription"
      >
        <Alert severity="error">
          {getFriendlyErrorMessage(error, "Failed to load subscription")}
        </Alert>
      </SettingsPageShell>
    );
  }

  const chargesDisplay = `Rs ${data.monthly_charge.toFixed(2)}`;

  return (
    <SettingsPageShell
      title="Subscription"
      subtitle="Plan, billing cycle, and online payment"
      wide
      hideSave
      backTo="/settings/subscription"
      backLabel="Subscription"
    >
      {data.is_overdue && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Your monthly payment is overdue. Pay online below to restore system access.
        </Alert>
      )}

      <Box
        sx={{
          bgcolor: "var(--tint-success-bg)",
          border: "1px solid #c8e6c9",
          borderRadius: 1,
          p: 2,
          mb: 3,
        }}
      >
        <Typography variant="body1" sx={{ fontWeight: 600, color: "success.dark" }}>
          Your Cloud ID : {data.cloud_id}
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          Subscribed license (No of Concurrent user logins allowed) : {data.license_count}
        </Typography>
      </Box>

      <Typography
        variant="subtitle2"
        sx={{ color: "success.main", fontWeight: 700, letterSpacing: 1, mb: 1.5 }}
      >
        SUBSCRIPTION PLAN
      </Typography>

      <TableContainer sx={{ mb: 2, border: "1px solid var(--surface-border)" }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "var(--surface-bg-alt)" }}>
              <TableCell>Subscription period</TableCell>
              <TableCell>Charges</TableCell>
              <TableCell>Product</TableCell>
              <TableCell>No of Licenses</TableCell>
              <TableCell>Next payment Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>
                {data.period_start_display} - {data.period_end_display}
              </TableCell>
              <TableCell>{chargesDisplay}</TableCell>
              <TableCell>{data.product_name}</TableCell>
              <TableCell>{data.license_count}</TableCell>
              <TableCell sx={{ color: "error.main", fontWeight: 600 }}>
                {data.next_payment_date_display}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
          mb: 3,
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 520 }}>
          You can upgrade to access Advanced POS &amp; Inventory, Manufacturing and
          Online Commerce on your computer.
        </Typography>
        <Button variant="contained" color="success" sx={{ textTransform: "uppercase" }}>
          Upgrade
        </Button>
      </Box>

      {data.is_overdue && (
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setPayOpen(true)}
          >
            Pay monthly subscription online
          </Button>
        </Box>
      )}

      <Typography
        variant="subtitle2"
        sx={{ color: "success.main", fontWeight: 700, letterSpacing: 1, mb: 1.5 }}
      >
        BILLING HISTORY
      </Typography>

      <TableContainer sx={{ border: "1px solid var(--surface-border)" }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "var(--surface-bg-alt)" }}>
              <TableCell>Date</TableCell>
              <TableCell>Card Type</TableCell>
              <TableCell>Card Number</TableCell>
              <TableCell align="right">Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.billing_history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3, color: "text.secondary" }}>
                  No payments recorded yet
                </TableCell>
              </TableRow>
            ) : (
              data.billing_history.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>{row.card_type ?? "—"}</TableCell>
                  <TableCell>{row.card_number}</TableCell>
                  <TableCell align="right">{row.amount_display}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <SubscriptionPayDialog
        open={payOpen}
        onClose={() => setPayOpen(false)}
        isSubmitting={payMutation.isPending}
        monthlyCharge={data.monthly_charge}
        onSubmit={(payload) => payMutation.mutate(payload)}
      />
    </SettingsPageShell>
  );
};

export default SubscriptionManage;
