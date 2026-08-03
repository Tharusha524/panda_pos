import React from "react";
import {
  Alert,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import type { Bank } from "../../../api/Settings/bankApi";

interface PurchaseChequeFieldsProps {
  banks: Bank[];
  loadingBanks?: boolean;
  bankId: number | null;
  chequeNumber: string;
  chequeAmount: number;
  bankError?: string;
  chequeNumberError?: string;
  amountError?: string;
  onBankChange: (bankId: number | null) => void;
  onChequeNumberChange: (chequeNumber: string) => void;
  onChequeAmountChange: (amount: number) => void;
  onClearError?: (key: "bank_id" | "cheque_number" | "amount") => void;
}

const PurchaseChequeFields: React.FC<PurchaseChequeFieldsProps> = ({
  banks,
  loadingBanks = false,
  bankId,
  chequeNumber,
  chequeAmount,
  bankError,
  chequeNumberError,
  amountError,
  onBankChange,
  onChequeNumberChange,
  onChequeAmountChange,
  onClearError,
}) => {
  return (
    <>
      {banks.length === 0 && !loadingBanks ? (
        <Alert severity="warning" sx={{ py: 0.5 }}>
          No banks configured. Add banks in Settings → Bank first.
        </Alert>
      ) : null}

      <FormControl fullWidth size="small" error={!!bankError}>
        <InputLabel shrink>Bank</InputLabel>
        <Select
          label="Bank"
          value={bankId ?? ""}
          onChange={(e) => {
            const value = e.target.value;
            onBankChange(value === "" ? null : Number(value));
            onClearError?.("bank_id");
          }}
          disabled={loadingBanks}
          notched
        >
          {banks.map((bank) => (
            <MenuItem key={bank.id} value={bank.id}>
              {bank.name} ({bank.bank_code})
            </MenuItem>
          ))}
        </Select>
        {bankError ? (
          <span style={{ color: "#d32f2f", fontSize: "0.75rem", marginTop: 4 }}>{bankError}</span>
        ) : null}
      </FormControl>

      <Grid container spacing={1}>
        <Grid item xs={6}>
          <TextField
            fullWidth
            size="small"
            label="Cheque ID"
            value={chequeNumber}
            onChange={(e) => {
              onChequeNumberChange(e.target.value);
              onClearError?.("cheque_number");
            }}
            placeholder="Cheque number"
            error={!!chequeNumberError}
            helperText={chequeNumberError}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            size="small"
            label="Cheque Amount"
            type="number"
            value={chequeAmount}
            onChange={(e) => {
              onChequeAmountChange(parseFloat(e.target.value) || 0);
              onClearError?.("amount");
            }}
            error={!!amountError}
            helperText={amountError ?? "Amount on the cheque"}
            InputProps={{ startAdornment: <InputAdornment position="start">Rs</InputAdornment> }}
            inputProps={{ min: 0, step: "0.01" }}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
      </Grid>
    </>
  );
};

export default PurchaseChequeFields;
