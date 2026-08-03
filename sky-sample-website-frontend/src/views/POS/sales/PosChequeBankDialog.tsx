import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { fetchBanks, type Bank } from "../../../api/Settings/bankApi";
import { POS_DIALOG_PAPER_SX, POS_PRIMARY_BUTTON_SX } from "../posDialogTheme";

export interface ChequePaymentDetails {
  bank_id: number;
  bank_name: string;
  cheque_number: string;
}

interface PosChequeBankDialogProps {
  open: boolean;
  initialBankId?: number | null;
  initialChequeNumber?: string;
  onClose: () => void;
  onConfirm: (details: ChequePaymentDetails) => void;
}

const PosChequeBankDialog: React.FC<PosChequeBankDialogProps> = ({
  open,
  initialBankId,
  initialChequeNumber = "",
  onClose,
  onConfirm,
}) => {
  const [bankId, setBankId] = useState<number | "">("");
  const [chequeNumber, setChequeNumber] = useState("");

  const { data: banks = [], isLoading } = useQuery({
    queryKey: ["banks"],
    queryFn: fetchBanks,
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    setBankId(initialBankId ?? "");
    setChequeNumber(initialChequeNumber);
  }, [open, initialBankId, initialChequeNumber]);

  const handleConfirm = () => {
    const id = typeof bankId === "number" ? bankId : Number(bankId);
    const bank = banks.find((b: Bank) => b.id === id);
    if (!id || !bank) return;
    if (!chequeNumber.trim()) return;
    onConfirm({
      bank_id: id,
      bank_name: bank.name,
      cheque_number: chequeNumber.trim(),
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth sx={POS_DIALOG_PAPER_SX}>
      <DialogTitle sx={{ fontWeight: 700, color: "var(--pallet-blue)" }}>
        Cheque / bank details
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select the bank and enter the cheque number for this payment.
        </Typography>
        {banks.length === 0 && !isLoading && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            No banks configured. Add banks in Settings → Bank first.
          </Alert>
        )}
        <FormControl fullWidth margin="dense" disabled={isLoading}>
          <InputLabel>Bank</InputLabel>
          <Select
            label="Bank"
            value={bankId}
            onChange={(e) => setBankId(e.target.value as number)}
          >
            {banks.map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.name} ({b.bank_code})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          fullWidth
          label="Cheque number"
          margin="dense"
          value={chequeNumber}
          onChange={(e) => setChequeNumber(e.target.value)}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={!bankId || !chequeNumber.trim() || banks.length === 0}
          sx={{ ...POS_PRIMARY_BUTTON_SX, textTransform: "none" }}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PosChequeBankDialog;
