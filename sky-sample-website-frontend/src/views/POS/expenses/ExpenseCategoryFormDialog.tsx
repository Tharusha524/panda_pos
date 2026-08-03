import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createExpenseCategory,
  deleteExpenseCategory,
  getExpenseCategories,
  updateExpenseCategory,
  type ExpenseCategory,
} from "../../../api/expenseCategoriesApi";
import { getFriendlyErrorMessage } from "../../../utils/getFriendlyErrorMessage";
import {
  CATEGORY_DIALOG_PAPER_SX,
  POS_PRIMARY_BUTTON_SX,
} from "../posDialogTheme";
import PosConfirmDeleteDialog from "../shared/PosConfirmDeleteDialog";
import { useConfirmDelete } from "../shared/useConfirmDelete";

export interface ExpenseCategorySavedResult {
  name: string;
}

interface ExpenseCategoryFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved?: (result: ExpenseCategorySavedResult) => void;
}

const ExpenseCategoryFormDialog: React.FC<ExpenseCategoryFormDialogProps> = ({
  open,
  onClose,
  onSaved,
}) => {
  const queryClient = useQueryClient();
  const deleteConfirm = useConfirmDelete();
  const wasOpenRef = useRef(false);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<ExpenseCategory | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["expense-categories"],
    queryFn: getExpenseCategories,
    enabled: open,
  });

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      return;
    }
    if (wasOpenRef.current) return;
    wasOpenRef.current = true;
    setName("");
    setEditing(null);
    setError(null);
  }, [open]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const trimmed = name.trim();
      if (!trimmed) {
        throw new Error("Category name is required");
      }
      if (editing) {
        return updateExpenseCategory(editing.id, trimmed);
      }
      return createExpenseCategory(trimmed);
    },
    onSuccess: (cat) => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      onSaved?.({ name: cat.name });
      setName("");
      setEditing(null);
      setError(null);
    },
    onError: (err: unknown) => {
      setError(getFriendlyErrorMessage(err, "Failed to save category"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExpenseCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      if (editing) {
        setEditing(null);
        setName("");
      }
    },
    onError: (err: unknown) => {
      setError(getFriendlyErrorMessage(err, "Failed to delete category"));
    },
  });

  const startEdit = (cat: ExpenseCategory) => {
    setEditing(cat);
    setName(cat.name);
    setError(null);
  };

  const cancelEdit = () => {
    setEditing(null);
    setName("");
    setError(null);
  };

  return (
    <>
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
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
        Expense categories
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
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {editing ? "Update the category name below." : "Add a new category for expenses."}
          </Typography>

          <TextField
            fullWidth
            label="Category name"
            placeholder="e.g. Utilities, Rent"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
            <Button
              type="submit"
              variant="contained"
              startIcon={<AddIcon />}
              disabled={saveMutation.isPending || !name.trim()}
              sx={{ ...POS_PRIMARY_BUTTON_SX, textTransform: "none" }}
            >
              {saveMutation.isPending
                ? "Saving…"
                : editing
                  ? "Update category"
                  : "Add category"}
            </Button>
            {editing && (
              <Button variant="outlined" onClick={cancelEdit} sx={{ textTransform: "none" }}>
                Cancel edit
              </Button>
            )}
          </Box>

          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Existing categories
          </Typography>
          {isLoading ? (
            <Typography variant="body2" color="text.secondary">
              Loading…
            </Typography>
          ) : categories.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No categories yet.
            </Typography>
          ) : (
            <List dense disablePadding sx={{ border: "1px solid var(--surface-border)", borderRadius: 1 }}>
              {categories.map((cat) => (
                <ListItem key={cat.id} divider>
                  <ListItemText primary={cat.name} />
                  <ListItemSecondaryAction>
                    <IconButton
                      size="small"
                      aria-label="Edit"
                      onClick={() => startEdit(cat)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      aria-label="Delete"
                      color="error"
                      onClick={() => {
                        if (deleteMutation.isPending) return;
                        deleteConfirm.requestDelete({
                          title: "Delete category",
                          message: `Delete category "${cat.name}"? This cannot be undone.`,
                          onConfirm: () => deleteMutation.mutate(cat.id),
                        });
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
          <Button onClick={onClose} variant="outlined" sx={{ textTransform: "none" }}>
            Close
          </Button>
        </DialogActions>
      </form>
    </Dialog>

    <PosConfirmDeleteDialog
      {...deleteConfirm.dialog}
      onCancel={deleteConfirm.close}
      onConfirm={deleteConfirm.confirm}
      loading={deleteMutation.isPending}
    />
  </>
  );
};

export default ExpenseCategoryFormDialog;
