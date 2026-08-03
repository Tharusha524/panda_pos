import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from "@mui/material";
import { POS_DIALOG_PAPER_SX, POS_PRIMARY_BUTTON_SX } from "../../posDialogTheme";

interface SubscriptionPayDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    card_type: string;
    card_number: string;
    amount?: number;
  }) => void;
  isSubmitting?: boolean;
  monthlyCharge: number;
}

const SubscriptionPayDialog: React.FC<SubscriptionPayDialogProps> = ({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  monthlyCharge,
}) => {
  const [cardType, setCardType] = useState("Visa");
  const [cardNumber, setCardNumber] = useState("");

  const handlePay = () => {
    onSubmit({
      card_type: cardType,
      card_number: cardNumber,
      amount: monthlyCharge > 0 ? monthlyCharge : undefined,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      sx={POS_DIALOG_PAPER_SX}
    >
      <DialogTitle sx={{ fontWeight: 700, color: "var(--pallet-blue)", px: 3, pt: 2.5 }}>
        Pay subscription online
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1, px: 3, pb: 2 }}>
        <TextField
          select
          label="Card type"
          value={cardType}
          onChange={(e) => setCardType(e.target.value)}
          fullWidth
        >
          <MenuItem value="Visa">Visa</MenuItem>
          <MenuItem value="Mastercard">Mastercard</MenuItem>
          <MenuItem value="Card">Other</MenuItem>
        </TextField>
        <TextField
          label="Card number"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
          placeholder="4242 4242 4242 4242"
          fullWidth
        />
        <TextField
          label="Amount (Rs)"
          value={monthlyCharge.toFixed(2)}
          disabled
          fullWidth
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handlePay}
          disabled={isSubmitting || cardNumber.replace(/\D/g, "").length < 4}
          sx={{ ...POS_PRIMARY_BUTTON_SX, textTransform: "none", minWidth: 100 }}
        >
          Pay now
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SubscriptionPayDialog;
