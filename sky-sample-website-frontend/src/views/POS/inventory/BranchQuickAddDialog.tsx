import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { createBranch } from "../../../api/Settings/branchApi";
import { getFriendlyErrorMessage } from "../../../utils/getFriendlyErrorMessage";
import { CATEGORY_DIALOG_PAPER_SX, POS_PRIMARY_BUTTON_SX } from "../posDialogTheme";

interface BranchQuickAddDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const BranchQuickAddDialog: React.FC<BranchQuickAddDialogProps> = ({
  open,
  onClose,
  onSaved,
}) => {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setAddress("");
      setCity("");
      setPhone("");
      setError(null);
    }
  }, [open]);

  const saveMutation = useMutation({
    mutationFn: () =>
      createBranch({
        name: name.trim(),
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        phone: phone.trim() || undefined,
      }),
    onSuccess: () => {
      onSaved();
      onClose();
    },
    onError: (err: unknown) => {
      setError(getFriendlyErrorMessage(err, "Failed to add shop location"));
    },
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth scroll="paper" sx={CATEGORY_DIALOG_PAPER_SX}>
      <DialogTitle sx={{ fontWeight: 700, color: "var(--pallet-blue)", px: 3, pt: 2.5 }}>
        Add Inventory Location
      </DialogTitle>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          if (!name.trim()) {
            setError("Location name is required");
            return;
          }
          saveMutation.mutate();
        }}
      >
        <DialogContent sx={{ px: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Shop / Branch Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saveMutation.isPending}
            sx={POS_PRIMARY_BUTTON_SX}
          >
            {saveMutation.isPending ? "Saving…" : "Add Location"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default BranchQuickAddDialog;
