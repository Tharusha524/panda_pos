import React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { POS_DIALOG_PAPER_SX } from "../posDialogTheme";

export interface PosConfirmDeleteState {
  open: boolean;
  title: string;
  message: string;
}

export const CLOSED_DELETE_DIALOG: PosConfirmDeleteState = {
  open: false,
  title: "",
  message: "",
};

interface PosConfirmDeleteDialogProps extends PosConfirmDeleteState {
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
  confirmLabel?: string;
}

const PosConfirmDeleteDialog: React.FC<PosConfirmDeleteDialogProps> = ({
  open,
  title,
  message,
  onCancel,
  onConfirm,
  loading = false,
  confirmLabel = "Delete",
}) => (
  <Dialog
    open={open}
    onClose={loading ? undefined : onCancel}
    maxWidth="xs"
    fullWidth
    sx={POS_DIALOG_PAPER_SX}
    aria-labelledby="pos-delete-dialog-title"
  >
    <DialogTitle id="pos-delete-dialog-title" sx={{ fontWeight: 700, color: "error.main" }}>
      {title || "Confirm delete"}
    </DialogTitle>
    <DialogContent>
      <DialogContentText sx={{ color: "text.primary" }}>{message}</DialogContentText>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
      <Button onClick={onCancel} disabled={loading} sx={{ textTransform: "none" }}>
        Cancel
      </Button>
      <Button
        variant="contained"
        color="error"
        startIcon={<DeleteOutlineIcon />}
        onClick={onConfirm}
        disabled={loading}
        sx={{ textTransform: "none" }}
      >
        {loading ? "Deleting…" : confirmLabel}
      </Button>
    </DialogActions>
  </Dialog>
);

export default PosConfirmDeleteDialog;
