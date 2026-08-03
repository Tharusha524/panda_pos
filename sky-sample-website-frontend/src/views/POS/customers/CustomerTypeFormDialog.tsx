import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { createCustomerType } from "../../../api/customersApi";
import { getFriendlyErrorMessage } from "../../../utils/getFriendlyErrorMessage";
import { CATEGORY_DIALOG_PAPER_SX, POS_PRIMARY_BUTTON_SX } from "../posDialogTheme";

interface CustomerTypeFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const CustomerTypeFormDialog: React.FC<CustomerTypeFormDialogProps> = ({
  open,
  onClose,
  onSaved,
}) => {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setError(null);
    }
  }, [open]);

  const saveMutation = useMutation({
    mutationFn: () => createCustomerType(name.trim()),
    onSuccess: () => {
      onSaved();
      onClose();
    },
    onError: (err: unknown) => {
      setError(getFriendlyErrorMessage(err, "Failed to save customer type"));
    },
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth scroll="paper" sx={CATEGORY_DIALOG_PAPER_SX}>
      <DialogTitle sx={{ fontWeight: 700, color: "var(--pallet-blue)", px: 3, pt: 2.5 }}>
        Add Customer Type
      </DialogTitle>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          saveMutation.mutate();
        }}
      >
        <DialogContent sx={{ px: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            fullWidth
            label="Customer Type"
            placeholder="Customer Type"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={onClose} sx={{ textTransform: "none" }}>
            Close
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!name.trim() || saveMutation.isPending}
            sx={{ ...POS_PRIMARY_BUTTON_SX, textTransform: "none" }}
          >
            {saveMutation.isPending ? "Saving…" : "Add"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CustomerTypeFormDialog;
