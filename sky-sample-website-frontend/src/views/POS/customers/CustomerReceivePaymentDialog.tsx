import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import {
  receiveCustomerPayment,
  type Customer,
  type ReceiveCustomerPaymentPayload,
} from "../../../api/customersApi";
import { getFriendlyErrorMessage } from "../../../utils/getFriendlyErrorMessage";
import { formatDashboardRs } from "../shared/dashboardShared";
import { POS_DIALOG_PAPER_SX, POS_PRIMARY_BUTTON_SX } from "../posDialogTheme";

const PAYMENT_METHODS = ["Cash", "Card", "Cheque", "Bank Transfer", "Online"] as const;

export interface CustomerReceivePaymentDialogProps {
  open: boolean;
  customer: Customer | null;
  onClose: () => void;
  onSuccess: (result: { new_balance: number; payment_received: number }) => void;
}

const CustomerReceivePaymentDialog: React.FC<CustomerReceivePaymentDialogProps> = ({
  open,
  customer,
  onClose,
  onSuccess,
}) => {
  const outstanding = customer?.net_balance ?? 0;
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && customer) {
      setAmount(0);
      setPaymentMethod("Cash");
      setNotes("");
      setError(null);
    }
  }, [open, customer]);

  const canSubmit = useMemo(
    () => outstanding > 0 && amount > 0 && amount <= outstanding + 0.01,
    [amount, outstanding]
  );

  const saveMutation = useMutation({
    mutationFn: (payload: ReceiveCustomerPaymentPayload) =>
      receiveCustomerPayment(customer!.id, payload),
    onSuccess: (data) => {
      onSuccess({
        new_balance: data.new_balance,
        payment_received: data.payment_received,
      });
      onClose();
    },
    onError: (err: unknown) => {
      setError(getFriendlyErrorMessage(err, "Failed to record payment"));
    },
  });

  const handleSubmit = () => {
    if (!customer) return;
    if (amount <= 0) {
      setError("Enter a payment amount");
      return;
    }
    if (amount > outstanding + 0.01) {
      setError(`Amount cannot exceed outstanding balance (${formatDashboardRs(outstanding)})`);
      return;
    }
    setError(null);
    saveMutation.mutate({
      amount,
      payment_method: paymentMethod,
      notes: notes.trim() || undefined,
      location: customer.inventory_location ?? customer.location ?? undefined,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper" sx={POS_DIALOG_PAPER_SX}>
      <DialogTitle sx={{ fontWeight: 700, color: "var(--pallet-blue)" }}>
        Receive Payment
      </DialogTitle>
      <DialogContent>
        {customer ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 0.5 }}>
            <Box sx={{ p: 1.5, bgcolor: "var(--surface-bg-alt)", borderRadius: 1, border: "1px solid var(--surface-border)" }}>
              <Typography variant="body2" color="text.secondary">
                Customer
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {customer.customer_name}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Outstanding balance:{" "}
                <strong style={{ color: "var(--pallet-blue)" }}>{formatDashboardRs(outstanding)}</strong>
              </Typography>
            </Box>

            {outstanding <= 0 ? (
              <Alert severity="info">This customer has no credit balance to collect.</Alert>
            ) : (
              <>
                <TextField
                  fullWidth
                  size="small"
                  label="Amount Received"
                  type="number"
                  value={amount || ""}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  InputProps={{ startAdornment: <InputAdornment position="start">Rs</InputAdornment> }}
                  inputProps={{ min: 0, max: outstanding, step: "0.01" }}
                  InputLabelProps={{ shrink: true }}
                />

                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setAmount(outstanding)}
                  sx={{ alignSelf: "flex-start", textTransform: "none" }}
                >
                  Settle full balance ({formatDashboardRs(outstanding)})
                </Button>

                <FormControl fullWidth size="small">
                  <InputLabel shrink>Payment Method</InputLabel>
                  <Select
                    label="Payment Method"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    notched
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <MenuItem key={method} value={method}>
                        {method}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  size="small"
                  label="Note (optional)"
                  multiline
                  minRows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </>
            )}

            {error ? <Alert severity="error">{error}</Alert> : null}
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!customer || outstanding <= 0 || !canSubmit || saveMutation.isPending}
          sx={{ ...POS_PRIMARY_BUTTON_SX, textTransform: "none" }}
        >
          {saveMutation.isPending ? "Saving…" : "Record Payment"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerReceivePaymentDialog;
