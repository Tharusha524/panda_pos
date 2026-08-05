import React, { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { POS_DIALOG_PAPER_SX, POS_PRIMARY_BUTTON_SX } from "../posDialogTheme";

export interface ChequePaymentDetails {
  bank_name: string;
}

interface PosChequeBankDialogProps {
  open: boolean;
  initialBankName?: string;
  onClose: () => void;
  onConfirm: (details: ChequePaymentDetails) => void;
}

const PosChequeBankDialog: React.FC<PosChequeBankDialogProps> = ({
  open,
  initialBankName = "",
  onClose,
  onConfirm,
}) => {
  const [bankName, setBankName] = useState("");

  useEffect(() => {
    if (!open) return;
    setBankName(initialBankName);
  }, [open, initialBankName]);

  const handleConfirm = () => {
    if (!bankName.trim()) return;
    onConfirm({ bank_name: bankName.trim() });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth sx={POS_DIALOG_PAPER_SX}>
      <DialogTitle sx={{ fontWeight: 700, color: "var(--pallet-blue)" }}>
        Cheque / bank details
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Enter the bank name for this payment.
        </Typography>
        <TextField
          fullWidth
          label="Bank"
          margin="dense"
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={!bankName.trim()}
          sx={{ ...POS_PRIMARY_BUTTON_SX, textTransform: "none" }}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PosChequeBankDialog;
