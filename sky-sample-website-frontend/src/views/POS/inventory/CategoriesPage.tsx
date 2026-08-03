import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import PageTitle from "../../../components/PageTitle";
import {
  deleteItemCategory,
  deleteItemSubCategory,
  getItemCategories,
} from "../../../api/itemsApi";
import { getFriendlyErrorMessage } from "../../../utils/getFriendlyErrorMessage";
import { invalidatePosQueries } from "../../../utils/invalidatePosQueries";
import ItemCategoryFormDialog, { type CategoryEditTarget } from "./ItemCategoryFormDialog";
import PosConfirmDeleteDialog from "../shared/PosConfirmDeleteDialog";
import { useConfirmDelete } from "../shared/useConfirmDelete";

const ITEMS_BASE = "/items";

type RowKind = "category" | "subcategory";

interface CategoryTableRow {
  key: string;
  kind: RowKind;
  id: number;
  name: string;
  productType: string | null;
  parentName: string | null;
  parentCategoryId?: number;
}

const CategoriesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CategoryEditTarget | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const deleteConfirm = useConfirmDelete();

  const { data: categories = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["item-categories"],
    queryFn: getItemCategories,
    staleTime: 0,
  });

  const refreshCategoryLists = async () => {
    await queryClient.invalidateQueries({ queryKey: ["item-categories"] });
    invalidatePosQueries(queryClient);
    await refetch();
  };

  const rows = useMemo<CategoryTableRow[]>(() => {
    const list: CategoryTableRow[] = [];
    for (const cat of categories) {
      list.push({
        key: `cat-${cat.id}`,
        kind: "category",
        id: cat.id,
        name: cat.name,
        productType: cat.product_type ?? null,
        parentName: null,
      });
      for (const sub of cat.sub_categories) {
        list.push({
          key: `sub-${sub.id}`,
          kind: "subcategory",
          id: sub.id,
          name: sub.name,
          productType: null,
          parentName: cat.name,
          parentCategoryId: cat.id,
        });
      }
    }
    return list;
  }, [categories]);

  const paginatedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return rows.slice(start, start + rowsPerPage);
  }, [rows, page, rowsPerPage]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(rows.length / rowsPerPage) - 1);
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [rows.length, page, rowsPerPage]);

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteItemCategory,
    onSuccess: async () => {
      await refreshCategoryLists();
      enqueueSnackbar("Category deleted", { variant: "success" });
    },
    onError: (err: unknown) => {
      enqueueSnackbar(getFriendlyErrorMessage(err, "Failed to delete category"), {
        variant: "error",
      });
    },
  });

  const deleteSubMutation = useMutation({
    mutationFn: deleteItemSubCategory,
    onSuccess: async () => {
      await refreshCategoryLists();
      enqueueSnackbar("Sub category deleted", { variant: "success" });
    },
    onError: (err: unknown) => {
      enqueueSnackbar(getFriendlyErrorMessage(err, "Failed to delete sub category"), {
        variant: "error",
      });
    },
  });

  const openAdd = () => {
    setEditTarget(null);
    setDialogOpen(true);
  };

  const openEdit = (row: CategoryTableRow) => {
    if (row.kind === "category") {
      setEditTarget({
        kind: "category",
        id: row.id,
        name: row.name,
        product_type: row.productType,
      });
    } else {
      setEditTarget({
        kind: "subcategory",
        id: row.id,
        name: row.name,
        parentCategoryId: row.parentCategoryId,
      });
    }
    setDialogOpen(true);
  };

  const handleDelete = (row: CategoryTableRow) => {
    const label = row.kind === "category" ? "category" : "sub category";
    deleteConfirm.requestDelete({
      title: `Delete ${label}`,
      message: `Delete ${label} "${row.name}"? This cannot be undone.`,
      onConfirm: () => {
        if (row.kind === "category") {
          deleteCategoryMutation.mutate(row.id);
        } else {
          deleteSubMutation.mutate(row.id);
        }
      },
    });
  };

  const headerBtnSx = {
    textTransform: "none" as const,
    fontWeight: 600,
    borderColor: "var(--surface-border)",
    color: "text.primary",
    bgcolor: "var(--surface-bg)",
    "&:hover": { bgcolor: "var(--surface-bg-alt)", borderColor: "var(--surface-text-muted)" },
  };

  return (
    <Box sx={{ width: "100%", p: { xs: 2, sm: 3 }, boxSizing: "border-box" }}>
      <Button
        component={Link}
        to={ITEMS_BASE}
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 1, color: "text.secondary", textTransform: "none" }}
      >
        Back to Items
      </Button>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
          mb: 2,
        }}
      >
        <PageTitle title="View category" subtitle="Manage categories and sub categories" />
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={openAdd}
            sx={headerBtnSx}
          >
            Add category
          </Button>
        </Box>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Categories are shared across all branches. New categories appear here immediately after
        save — assign them to items on the item form.
      </Typography>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: "1px solid var(--surface-border)", borderRadius: 1 }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "var(--surface-bg-alt)" }}>
              <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Product Type</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Parent Category</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, width: 120 }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} sx={{ color: "var(--pallet-blue)" }} />
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ py: 3 }}>
                  <Typography color="error">
                    {getFriendlyErrorMessage(error, "Failed to load categories")}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ py: 3 }}>
                  <Typography color="text.secondary">No categories yet. Click Add category.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((row) => (
                <TableRow key={row.key} hover>
                  <TableCell>
                    <Chip
                      size="small"
                      label={row.kind === "category" ? "Category" : "Subcategory"}
                      color={row.kind === "category" ? "primary" : "default"}
                      variant={row.kind === "category" ? "filled" : "outlined"}
                      sx={
                        row.kind === "category"
                          ? { bgcolor: "var(--pallet-blue)", color: "#fff" }
                          : undefined
                      }
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: row.kind === "category" ? 600 : 400 }}>
                    {row.name}
                  </TableCell>
                  <TableCell>{row.productType ?? "—"}</TableCell>
                  <TableCell>{row.parentName ?? "—"}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEdit(row)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(row)}
                        disabled={
                          deleteCategoryMutation.isPending || deleteSubMutation.isPending
                        }
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {!isLoading && !isError && rows.length > 0 && (
          <TablePagination
            component="div"
            count={rows.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="Rows per page:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} of ${count !== -1 ? count : `more than ${to}`}`
            }
            sx={{ borderTop: "1px solid var(--surface-border)" }}
          />
        )}
      </TableContainer>

      <ItemCategoryFormDialog
        key={
          dialogOpen
            ? editTarget
              ? `edit-${editTarget.kind}-${editTarget.id}`
              : "add"
            : "closed"
        }
        open={dialogOpen}
        categories={categories}
        editTarget={editTarget}
        parentCategoryId={editTarget?.parentCategoryId}
        defaultKind={editTarget?.kind ?? "category"}
        onClose={() => {
          setDialogOpen(false);
          setEditTarget(null);
        }}
        onSaved={async () => {
          const wasEdit = Boolean(editTarget);
          await refreshCategoryLists();
          enqueueSnackbar(wasEdit ? "Updated successfully" : "Category saved", {
            variant: "success",
          });
          setEditTarget(null);
        }}
      />

      <PosConfirmDeleteDialog
        {...deleteConfirm.dialog}
        onCancel={deleteConfirm.close}
        onConfirm={deleteConfirm.confirm}
        loading={deleteCategoryMutation.isPending || deleteSubMutation.isPending}
      />
    </Box>
  );
};

export default CategoriesPage;
