import React, { useEffect } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  Switch,
  TextField,
} from "@mui/material";
import { useForm } from "react-hook-form";
import type { Item, ItemPayload } from "../../../api/itemsApi";
import { POS_DIALOG_PAPER_SX, POS_PRIMARY_BUTTON_SX } from "../posDialogTheme";

interface ItemFormDialogProps {
  open: boolean;
  item: Item | null;
  onClose: () => void;
  onSubmit: (data: ItemPayload) => void;
  isSaving?: boolean;
}

const ItemFormDialog: React.FC<ItemFormDialogProps> = ({
  open,
  item,
  onClose,
  onSubmit,
  isSaving = false,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ItemPayload>({
    defaultValues: {
      item_number: "",
      description: "",
      category: "",
      sub_category: "",
      location: "Main Location",
      selling_price: 0,
      is_active: true,
      product_type: null,
    },
  });

  const isActive = watch("is_active");

  useEffect(() => {
    if (open) {
      reset({
        item_number: item?.item_number ?? "",
        description: item?.description ?? "",
        category: item?.category ?? "",
        sub_category: item?.sub_category ?? "",
        location: item?.location ?? "Main Location",
        selling_price: item?.selling_price ?? 0,
        is_active: item?.is_active ?? true,
        product_type: item?.product_type ?? null,
      });
    }
  }, [open, item, reset]);

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
        {item ? "Edit Item" : "Add Item"}
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ pt: 1, px: 3, pb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Item Number"
                size="small"
                required
                error={!!errors.item_number}
                helperText={errors.item_number?.message}
                {...register("item_number", { required: "Item number is required" })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Selling Price (Rs)"
                type="number"
                size="small"
                inputProps={{ min: 0, step: "0.01" }}
                {...register("selling_price", { valueAsNumber: true })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                size="small"
                required
                error={!!errors.description}
                helperText={errors.description?.message}
                {...register("description", { required: "Description is required" })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Category" size="small" {...register("category")} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Sub Category"
                size="small"
                {...register("sub_category")}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Location" size="small" {...register("location")} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isActive}
                    onChange={(e) => setValue("is_active", e.target.checked)}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1.5 }}>
          <Button onClick={onClose} disabled={isSaving} size="large" sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isSaving}
            sx={{ ...POS_PRIMARY_BUTTON_SX, textTransform: "none", minWidth: 120 }}
          >
            {isSaving ? "Saving…" : item ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ItemFormDialog;
