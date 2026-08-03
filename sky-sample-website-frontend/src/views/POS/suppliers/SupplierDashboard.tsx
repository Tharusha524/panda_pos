import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLiveQuery } from "../../../hooks/useLiveQuery";
import { invalidatePosQueries } from "../../../utils/invalidatePosQueries";
import { useSnackbar } from "notistack";
import { deleteSupplier, getSuppliers, type Supplier } from "../../../api/suppliersApi";
import { getFriendlyErrorMessage } from "../../../utils/getFriendlyErrorMessage";
import { formatDashboardRs, headerBtnSx, summaryCardSx } from "../shared/dashboardShared";
import PosConfirmDeleteDialog from "../shared/PosConfirmDeleteDialog";
import { useConfirmDelete } from "../shared/useConfirmDelete";

const SUPPLIERS_BASE = "/suppliers";

const SupplierDashboard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const deleteConfirm = useConfirmDelete();
  const [location, setLocation] = useState("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [rowMenuAnchor, setRowMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuSupplier, setMenuSupplier] = useState<Supplier | null>(null);

  const { data, isLoading, isError, error, isFetching } = useLiveQuery({
    queryKey: ["suppliers", location],
    queryFn: () => getSuppliers(location),
  });

  const suppliers = data?.suppliers ?? [];
  const summary = data?.summary ?? { total_suppliers: 0, total_payables: 0 };
  const locations = data?.locations ?? ["Main Location"];

  const paginated = useMemo(() => {
    const start = page * rowsPerPage;
    return suppliers.slice(start, start + rowsPerPage);
  }, [suppliers, page, rowsPerPage]);

  useEffect(() => { setPage(0); }, [location]);
  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(suppliers.length / rowsPerPage) - 1);
    if (page > maxPage) setPage(maxPage);
  }, [suppliers.length, page, rowsPerPage]);

  const deleteMutation = useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => {
      invalidatePosQueries(queryClient);
      enqueueSnackbar("Supplier deleted", { variant: "success" });
      setRowMenuAnchor(null);
      setMenuSupplier(null);
    },
    onError: (err: unknown) => enqueueSnackbar(getFriendlyErrorMessage(err, "Failed to delete"), { variant: "error" }),
  });

  return (
    <Box sx={{ width: "100%", p: { xs: 2, sm: 3 }, boxSizing: "border-box" }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 2, mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Supplier Dashboard
          {isFetching && !isLoading && <Typography component="span" variant="caption" sx={{ ml: 1, color: "text.secondary" }}>(updating…)</Typography>}
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="outlined" startIcon={<HelpOutlineIcon />} sx={headerBtnSx} disabled>Help</Button>
          <Button variant="outlined" startIcon={<AddIcon />} sx={headerBtnSx} onClick={() => navigate(`${SUPPLIERS_BASE}/new`)}>Add Supplier</Button>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>Suppliers used on purchases. Net balance is amount owed to the supplier.</Alert>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
        <Box sx={summaryCardSx}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase" }}>suppliers</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>{isLoading ? "—" : summary.total_suppliers}</Typography>
        </Box>
        <Box sx={summaryCardSx}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase" }}>payables</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: "error.main" }}>{isLoading ? "—" : formatDashboardRs(summary.total_payables ?? 0)}</Typography>
        </Box>
      </Box>

      <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: "var(--surface-bg-alt)" }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <FormControl size="small" fullWidth>
              <InputLabel>Branch</InputLabel>
              <Select label="Branch" value={location} onChange={(e) => setLocation(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                {locations.map((loc) => <MenuItem key={loc} value={loc}>{loc}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {isError && <Typography color="error" sx={{ mb: 2 }}>{getFriendlyErrorMessage(error, "Failed to load suppliers")}</Typography>}

      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead sx={{ bgcolor: "var(--surface-bg-alt)" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Branch</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Net Balance</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
            ) : paginated.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.secondary" }}>No suppliers.</TableCell></TableRow>
            ) : paginated.map((s) => (
              <TableRow key={s.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{s.supplier_code}</TableCell>
                <TableCell>{s.name}</TableCell>
                <TableCell>{s.phone}</TableCell>
                <TableCell>{s.location}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>{formatDashboardRs(s.net_balance)}</TableCell>
                <TableCell align="center">
                  <IconButton size="small" onClick={(e) => { setRowMenuAnchor(e.currentTarget); setMenuSupplier(s); }}><MoreHorizIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!isLoading && suppliers.length > 0 && (
          <TablePagination component="div" count={suppliers.length} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} rowsPerPageOptions={[10, 25, 50, 100]} />
        )}
      </TableContainer>

      <Menu anchorEl={rowMenuAnchor} open={Boolean(rowMenuAnchor)} onClose={() => { setRowMenuAnchor(null); setMenuSupplier(null); }}>
        <MenuItem onClick={() => { if (menuSupplier) navigate(`${SUPPLIERS_BASE}/${menuSupplier.id}/edit`); setRowMenuAnchor(null); }}><EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit</MenuItem>
        <MenuItem
          onClick={() => {
            if (!menuSupplier) return;
            setRowMenuAnchor(null);
            setMenuSupplier(null);
            deleteConfirm.requestDelete({
              title: "Delete supplier",
              message: `Delete "${menuSupplier.name}"? This cannot be undone.`,
              onConfirm: () => deleteMutation.mutate(menuSupplier.id),
            });
          }}
          sx={{ color: "error.main" }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      <PosConfirmDeleteDialog
        {...deleteConfirm.dialog}
        onCancel={deleteConfirm.close}
        onConfirm={deleteConfirm.confirm}
        loading={deleteMutation.isPending}
      />
    </Box>
  );
};

export default SupplierDashboard;
