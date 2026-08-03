import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import BusinessIcon from "@mui/icons-material/Business";
import StorefrontIcon from "@mui/icons-material/Storefront";
import SearchIcon from "@mui/icons-material/Search";
import type { Supplier } from "../../../api/suppliersApi";
import { WALK_IN_SUPPLIER_LABEL } from "./purchaseConstants";

export function supplierDisplayName(s: Supplier): string {
  return s.first_name || s.name || s.supplier_code || "Supplier";
}

function formatRs(amount: number): string {
  return Number(amount ?? 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface PurchaseSupplierSelectAreaProps {
  suppliers: Supplier[];
  isLoading?: boolean;
  selectedSupplierId: number | null;
  selectedSupplierName?: string | null;
  onSelect: (supplier: Supplier | null) => void;
  error?: string;
}

const PurchaseSupplierSelectArea: React.FC<PurchaseSupplierSelectAreaProps> = ({
  suppliers,
  isLoading = false,
  selectedSupplierId,
  selectedSupplierName,
  onSelect,
  error,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const isWalkIn = selectedSupplierId == null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter((s) => {
      const name = supplierDisplayName(s).toLowerCase();
      const phone = (s.phone ?? "").toLowerCase();
      const code = (s.supplier_code ?? "").toLowerCase();
      const branch = (s.location ?? "").toLowerCase();
      return name.includes(q) || phone.includes(q) || code.includes(q) || branch.includes(q);
    });
  }, [suppliers, search]);

  const paginated = useMemo(() => {
    const start = page * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  const openDialog = () => {
    setSearch("");
    setPage(0);
    setDialogOpen(true);
  };

  const closeDialog = () => setDialogOpen(false);

  const pickSupplier = (supplier: Supplier | null) => {
    onSelect(supplier);
    closeDialog();
  };

  return (
    <>
      <Paper
        sx={{
          p: 1.5,
          mb: 2,
          borderRadius: 2,
          border: error ? "1px solid #d32f2f" : "1px solid #e0e0e0",
          bgcolor: "var(--surface-bg)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <BusinessIcon sx={{ color: "var(--pallet-blue)" }} />
        <Box sx={{ flex: 1, minWidth: 140 }}>
          <Typography variant="caption" color="text.secondary">
            Supplier
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
            {isWalkIn ? WALK_IN_SUPPLIER_LABEL : selectedSupplierName || "—"}
          </Typography>
          {error && (
            <Typography variant="caption" color="error">
              {error}
            </Typography>
          )}
        </Box>
        <Button
          variant="contained"
          size="small"
          startIcon={<StorefrontIcon />}
          onClick={openDialog}
          disabled={isLoading}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            bgcolor: "var(--pallet-blue)",
            "&:hover": { bgcolor: "var(--pallet-main-blue)" },
          }}
        >
          Select supplier
        </Button>
        {!isWalkIn && (
          <Button
            variant="outlined"
            size="small"
            onClick={() => onSelect(null)}
            sx={{ textTransform: "none", borderColor: "var(--surface-border)" }}
          >
            Walk-in
          </Button>
        )}
      </Paper>

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pb: 1,
          }}
        >
          <Typography variant="h6" component="span" sx={{ fontWeight: 700 }}>
            Select supplier
          </Typography>
          <IconButton aria-label="Close" onClick={closeDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 2 }}>
          <TextField
            fullWidth
            size="small"
            autoFocus
            placeholder="Search by name, code, phone, or branch…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />

          <TableContainer sx={{ border: "1px solid var(--surface-border)", borderRadius: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)" }}>Supplier ID</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)" }}>Branch</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)" }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)" }}>Contact</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)" }} align="right">
                    Net Balance (Rs)
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
                ) : (
                  <>
                    <TableRow
                      hover
                      selected={isWalkIn}
                      sx={{ cursor: "pointer", bgcolor: isWalkIn ? "#e8f1ff" : undefined }}
                      onClick={() => pickSupplier(null)}
                    >
                      <TableCell colSpan={2} sx={{ fontWeight: 600 }}>
                        {WALK_IN_SUPPLIER_LABEL}
                      </TableCell>
                      <TableCell colSpan={3}>
                        <Typography variant="body2" color="text.secondary">
                          No supplier account
                        </Typography>
                      </TableCell>
                    </TableRow>
                    {paginated.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 3, color: "text.secondary" }}>
                          {search ? `No suppliers match "${search}"` : "No suppliers found"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginated.map((s) => {
                        const selected = selectedSupplierId === s.id;
                        return (
                          <TableRow
                            key={s.id}
                            hover
                            selected={selected}
                            sx={{ cursor: "pointer" }}
                            onClick={() => pickSupplier(s)}
                          >
                            <TableCell>{s.supplier_code}</TableCell>
                            <TableCell>{s.location || "—"}</TableCell>
                            <TableCell sx={{ fontWeight: 500 }}>{supplierDisplayName(s)}</TableCell>
                            <TableCell>{s.phone_display || s.phone || "—"}</TableCell>
                            <TableCell align="right">{formatRs(s.net_balance)}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {!isLoading && filtered.length > 0 && (
            <TablePagination
              component="div"
              count={filtered.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50]}
              sx={{ borderTop: "1px solid var(--surface-border)" }}
            />
          )}
        </DialogContent>

        <DialogActions sx={{ px: 2, py: 1.5 }}>
          <Button onClick={closeDialog} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PurchaseSupplierSelectArea;
