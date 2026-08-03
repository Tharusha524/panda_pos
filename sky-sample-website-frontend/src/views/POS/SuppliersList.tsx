import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
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
import BranchLocationSelect from "../../components/BranchLocationSelect";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PrintIcon from "@mui/icons-material/Print";
import RefreshIcon from "@mui/icons-material/Refresh";
import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import PageTitle from "../../components/PageTitle";
import { deleteSupplier, getSuppliers, type Supplier } from "../../api/suppliersApi";
import { getCompanyPrintHeader } from "../../api/Settings/companySettingsApi";
import { getFriendlyErrorMessage } from "../../utils/getFriendlyErrorMessage";
import { printSupplierDetails, printSuppliersTable } from "./suppliers/supplierPrint";
import PosConfirmDeleteDialog from "./shared/PosConfirmDeleteDialog";
import { useConfirmDelete } from "./shared/useConfirmDelete";

function formatBalance(amount: number): string {
  return `Rs ${amount.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const SuppliersList: React.FC = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const deleteConfirm = useConfirmDelete();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [location, setLocation] = useState("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["suppliers", location],
    queryFn: () => getSuppliers(location),
  });

  const suppliers = data?.suppliers ?? [];

  const paginatedSuppliers = useMemo(() => {
    const start = page * rowsPerPage;
    return suppliers.slice(start, start + rowsPerPage);
  }, [suppliers, page, rowsPerPage]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(suppliers.length / rowsPerPage) - 1);
    if (page > maxPage) setPage(maxPage);
  }, [suppliers.length, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [location]);

  const { data: printHeader } = useQuery({
    queryKey: ["company-print-header"],
    queryFn: getCompanyPrintHeader,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      enqueueSnackbar("Supplier deleted", { variant: "success" });
      setDeletingId(null);
    },
    onError: (err: unknown) => {
      enqueueSnackbar(getFriendlyErrorMessage(err, "Failed to delete supplier"), {
        variant: "error",
      });
      setDeletingId(null);
    },
  });

  const handleDelete = (supplier: Supplier) => {
    deleteConfirm.requestDelete({
      title: "Delete supplier",
      message: `Delete supplier "${supplier.first_name}"? This cannot be undone.`,
      onConfirm: () => {
        setDeletingId(supplier.id);
        deleteMutation.mutate(supplier.id);
      },
    });
  };

  const handlePrintAll = () => {
    if (!printHeader) {
      enqueueSnackbar("Print header not loaded yet", { variant: "warning" });
      return;
    }
    if (suppliers.length === 0) {
      enqueueSnackbar("No suppliers to print", { variant: "info" });
      return;
    }
    printSuppliersTable(suppliers, printHeader);
  };

  const handlePrintRow = (supplier: Supplier) => {
    if (!printHeader) {
      enqueueSnackbar("Print header not loaded yet", { variant: "warning" });
      return;
    }
    printSupplierDetails(supplier, printHeader);
  };

  return (
    <Box sx={{ width: "100%", p: { xs: 2, sm: 3 }, boxSizing: "border-box" }}>
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
        <PageTitle title="Suppliers" subtitle="Manage supplier information by branch" />
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
          <BranchLocationSelect
            value={location}
            onChange={setLocation}
            showAllOption
            label="Branch"
          />
          <Tooltip title="Refresh">
            <IconButton onClick={() => refetch()} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrintAll}
            disabled={isLoading || suppliers.length === 0}
          >
            Print
          </Button>
          <Button
            component={Link}
            to="/suppliers/new"
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              bgcolor: "var(--pallet-blue)",
              "&:hover": { bgcolor: "var(--pallet-main-blue)" },
            }}
          >
            Add Supplier
          </Button>
        </Box>
      </Box>

      {isError && (
        <Typography color="error" sx={{ mb: 2 }}>
          {getFriendlyErrorMessage(error, "Failed to load suppliers")}
        </Typography>
      )}

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: "1px solid var(--surface-border)", borderRadius: 1 }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "var(--surface-bg-alt)" }}>
              <TableCell sx={{ fontWeight: 700 }}>Supplier ID</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Branch</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Number</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                Net Balance
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : suppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  No suppliers yet. Click Add Supplier to create one.
                </TableCell>
              </TableRow>
            ) : (
              paginatedSuppliers.map((supplier) => (
                <TableRow key={supplier.id} hover>
                  <TableCell>{supplier.supplier_code}</TableCell>
                  <TableCell>{supplier.location}</TableCell>
                  <TableCell>{supplier.first_name}</TableCell>
                  <TableCell>{supplier.phone}</TableCell>
                  <TableCell align="right">{formatBalance(supplier.net_balance)}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Print">
                      <IconButton
                        size="small"
                        onClick={() => handlePrintRow(supplier)}
                        aria-label="Print supplier"
                      >
                        <PrintIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton
                        component={Link}
                        to={`/suppliers/${supplier.id}/edit`}
                        size="small"
                        aria-label="Edit supplier"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(supplier)}
                        disabled={deletingId === supplier.id}
                        aria-label="Delete supplier"
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
        {!isLoading && suppliers.length > 0 && (
          <TablePagination
            component="div"
            count={suppliers.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50]}
            labelRowsPerPage="Rows per page:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} of ${count}`
            }
            sx={{ borderTop: "1px solid var(--surface-border)" }}
          />
        )}
      </TableContainer>

      <PosConfirmDeleteDialog
        {...deleteConfirm.dialog}
        onCancel={deleteConfirm.close}
        onConfirm={deleteConfirm.confirm}
        loading={deleteMutation.isPending}
      />
    </Box>
  );
};

export default SuppliersList;
