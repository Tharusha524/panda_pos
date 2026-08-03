import React, { useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { useForm } from "react-hook-form";
import type { Bank } from "../../../../api/Settings/bankApi";
import { POS_DIALOG_PAPER_SX, POS_PRIMARY_BUTTON_SX } from "../../posDialogTheme";

interface BankFormDialogProps {
  open: boolean;
  bank: Bank | null;
  onClose: () => void;
  onSubmit: (data: {
    bank_code: string;
    name: string;
    address: string;
  }) => void;
  onDelete?: () => void;
  isSaving?: boolean;
  isDeleting?: boolean;
}

const BankFormDialog: React.FC<BankFormDialogProps> = ({
  open,
  bank,
  onClose,
  onSubmit,
  onDelete,
  isSaving = false,
  isDeleting = false,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      bank_code: "",
      name: "",
      address: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        bank_code: bank?.bank_code ?? "",
        name: bank?.name ?? "",
        address: bank?.address ?? "",
      });
    }
  }, [open, bank, reset]);

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
        {bank ? "Edit Bank" : "Add Bank"}
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ pt: 1, px: 3, pb: 2 }}>
          <TextField
            fullWidth
            label="Bank ID"
            margin="dense"
            placeholder={bank ? undefined : "Leave empty for auto number"}
            helperText={
              bank ? undefined : "Auto Number is a unique code assigned internally"
            }
            {...register("bank_code")}
          />
          <TextField
            fullWidth
            label="Bank Name"
            margin="dense"
            required
            error={!!errors.name}
            helperText={errors.name?.message}
            {...register("name", { required: "Bank name is required" })}
          />
          <TextField
            fullWidth
            label="Bank Address"
            margin="dense"
            multiline
            rows={2}
            {...register("address")}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: "space-between" }}>
          <Box>
            {onDelete && (
              <Button
                color="error"
                onClick={onDelete}
                disabled={isSaving || isDeleting}
              >
                {isDeleting ? "Deleting…" : "Delete"}
              </Button>
            )}
          </Box>
          <Box>
            <Button onClick={onClose} disabled={isSaving || isDeleting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSaving || isDeleting}
              sx={{ ...POS_PRIMARY_BUTTON_SX, ml: 1, textTransform: "none", minWidth: 100 }}
            >
              {isSaving ? "Saving…" : bank ? "Update" : "Add"}
            </Button>
          </Box>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default BankFormDialog;
