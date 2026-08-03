import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import {
  createItemCategory,
  createItemSubCategory,
  updateItemCategory,
  updateItemSubCategory,
  type ItemCategory,
} from "../../../api/itemsApi";
import { getFriendlyErrorMessage } from "../../../utils/getFriendlyErrorMessage";
import {
  CATEGORY_DIALOG_PAPER_SX,
  POS_PRIMARY_BUTTON_SX,
  POS_RADIO_SX,
  POS_SELECT_MENU_PROPS,
} from "../posDialogTheme";
import { DEFAULT_ITEM_PRODUCT_TYPE, ITEM_PRODUCT_TYPES } from "./itemProductTypes";

export type CategoryFormKind = "category" | "subcategory";

export interface CategoryEditTarget {
  kind: CategoryFormKind;
  id: number;
  name: string;
  product_type?: string | null;
  parentCategoryId?: number;
}

export interface CategorySavedResult {
  kind: CategoryFormKind;
  categoryId: number;
  subCategoryId?: number;
}

interface ItemCategoryFormDialogProps {
  open: boolean;
  categories: ItemCategory[];
  defaultKind?: CategoryFormKind;
  parentCategoryId?: number | null;
  editTarget?: CategoryEditTarget | null;
  onClose: () => void;
  onSaved: (result: CategorySavedResult) => void;
}

const ItemCategoryFormDialog: React.FC<ItemCategoryFormDialogProps> = ({
  open,
  categories,
  defaultKind = "category",
  parentCategoryId,
  editTarget = null,
  onClose,
  onSaved,
}) => {
  const isEdit = Boolean(editTarget);
  const [kind, setKind] = useState<CategoryFormKind>(defaultKind);
  const [name, setName] = useState("");
  const [productType, setProductType] = useState(DEFAULT_ITEM_PRODUCT_TYPE);
  const [parentId, setParentId] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);
  const wasOpenRef = useRef(false);
  const editKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      editKeyRef.current = null;
      return;
    }

    const editKey = editTarget
      ? `${editTarget.kind}-${editTarget.id}`
      : `new-${defaultKind}-${parentCategoryId ?? ""}`;

    // Reset when dialog opens or when switching add/edit target
    if (wasOpenRef.current && editKeyRef.current === editKey) return;
    wasOpenRef.current = true;
    editKeyRef.current = editKey;

    if (editTarget) {
      setKind(editTarget.kind);
      setName(editTarget.name ?? "");
      setProductType(editTarget.product_type ?? DEFAULT_ITEM_PRODUCT_TYPE);
      setParentId(editTarget.parentCategoryId ?? "");
      setError(null);
      return;
    }

    setKind(defaultKind);
    setName("");
    setProductType(DEFAULT_ITEM_PRODUCT_TYPE);
    setError(null);
    if (defaultKind === "subcategory") {
      setParentId(parentCategoryId ?? categories[0]?.id ?? "");
    } else {
      setParentId(parentCategoryId ?? "");
    }
  }, [open, editTarget, defaultKind, parentCategoryId, categories]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const trimmed = name.trim();
      if (!trimmed) {
        throw new Error(
          kind === "category" ? "Category name is required" : "Sub category name is required"
        );
      }

      if (isEdit && editTarget) {
        if (editTarget.kind === "category") {
          const cat = await updateItemCategory(editTarget.id, {
            name: trimmed,
            product_type: productType,
          });
          return { kind: "category" as const, categoryId: cat.id };
        }
        const pid = typeof parentId === "number" ? parentId : Number(parentId);
        if (!pid) {
          throw new Error("Select a main category to link this sub category");
        }
        const sub = await updateItemSubCategory(editTarget.id, {
          name: trimmed,
          parent_category_id: pid,
        });
        return {
          kind: "subcategory" as const,
          categoryId: sub.item_category_id,
          subCategoryId: sub.id,
        };
      }

      if (kind === "category") {
        const cat = await createItemCategory(trimmed, productType);
        return { kind: "category" as const, categoryId: cat.id };
      }
      const pid = typeof parentId === "number" ? parentId : Number(parentId);
      if (!pid) {
        throw new Error("Select a main category to link this sub category");
      }
      const sub = await createItemSubCategory(trimmed, pid);
      return {
        kind: "subcategory" as const,
        categoryId: sub.item_category_id,
        subCategoryId: sub.id,
      };
    },
    onSuccess: (result) => {
      onSaved(result);
      onClose();
    },
    onError: (err: unknown) => {
      setError(getFriendlyErrorMessage(err, "Failed to save"));
    },
  });

  const title = isEdit
    ? editTarget?.kind === "subcategory"
      ? "Edit subcategory"
      : "Edit category"
    : "Add category and subcategory";

  const fieldGap = 2.5;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      scroll="paper"
      sx={CATEGORY_DIALOG_PAPER_SX}
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          fontSize: "1.25rem",
          color: "var(--pallet-blue)",
          pb: 1,
          pt: 2.5,
          px: 3,
        }}
      >
        {title}
      </DialogTitle>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          saveMutation.mutate();
        }}
      >
        <DialogContent sx={{ pt: 0, px: 3, pb: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: fieldGap }}>
              {error}
            </Alert>
          )}

          {!isEdit && (
            <RadioGroup
              row
              value={kind}
              onChange={(e) => setKind(e.target.value as CategoryFormKind)}
              sx={{ mb: fieldGap, gap: 2 }}
            >
              <FormControlLabel
                value="category"
                control={<Radio sx={POS_RADIO_SX} />}
                label={<Typography variant="body1">Category</Typography>}
              />
              <FormControlLabel
                value="subcategory"
                control={<Radio sx={POS_RADIO_SX} />}
                label={<Typography variant="body1">Subcategory</Typography>}
              />
            </RadioGroup>
          )}

          {(kind === "subcategory" || (isEdit && editTarget?.kind === "subcategory")) && (
            <FormControl fullWidth sx={{ mb: fieldGap }}>
              <InputLabel id="parent-cat-label" shrink>
                Category (main)
              </InputLabel>
              <Select
                labelId="parent-cat-label"
                label="Category (main)"
                value={parentId}
                onChange={(e) => setParentId(e.target.value as number)}
                required
                MenuProps={POS_SELECT_MENU_PROPS}
                sx={{ minHeight: 48 }}
              >
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id} sx={{ py: 1.25 }}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Link this sub category to a main category
              </Typography>
            </FormControl>
          )}

          <TextField
            fullWidth
            label={kind === "category" ? "Category name" : "Sub category name"}
            placeholder={kind === "category" ? "Category" : "Sub Category"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mb: fieldGap }}
            autoFocus={!isEdit}
            required
            InputLabelProps={{ shrink: true }}
            inputProps={{ style: { fontSize: "1rem" } }}
          />

          {(kind === "category" || (isEdit && editTarget?.kind === "category")) && (
            <FormControl fullWidth sx={{ mb: fieldGap }}>
              <InputLabel id="product-type-label" shrink>
                Product Type
              </InputLabel>
              <Select
                labelId="product-type-label"
                label="Product Type"
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                MenuProps={POS_SELECT_MENU_PROPS}
                sx={{ minHeight: 48 }}
              >
                {ITEM_PRODUCT_TYPES.map((pt) => (
                  <MenuItem key={pt.value} value={pt.value} sx={{ py: 1.25 }}>
                    {pt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1.5 }}>
          <Box sx={{ flex: 1 }} />
          <Button
            onClick={onClose}
            disabled={saveMutation.isPending}
            variant="outlined"
            size="large"
            sx={{ textTransform: "none", minWidth: 100, borderColor: "var(--surface-border)" }}
          >
            Close
          </Button>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={
              saveMutation.isPending ||
              !name.trim() ||
              ((kind === "subcategory" || editTarget?.kind === "subcategory") &&
                (parentId === "" || categories.length === 0))
            }
            sx={{ ...POS_PRIMARY_BUTTON_SX, textTransform: "none", minWidth: 120 }}
          >
            {saveMutation.isPending ? "Saving…" : isEdit ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ItemCategoryFormDialog;
