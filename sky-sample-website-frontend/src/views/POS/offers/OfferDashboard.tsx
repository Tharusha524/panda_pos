import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
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
import { deleteOffer, getOffers, type Offer } from "../../../api/offersApi";
import { getFriendlyErrorMessage } from "../../../utils/getFriendlyErrorMessage";
import { headerBtnSx, summaryCardSx } from "../shared/dashboardShared";
import PosConfirmDeleteDialog from "../shared/PosConfirmDeleteDialog";
import { useConfirmDelete } from "../shared/useConfirmDelete";

const OFFERS_BASE = "/offers";

const OfferDashboard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const deleteConfirm = useConfirmDelete();
  const [discountType, setDiscountType] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [rowMenuAnchor, setRowMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuOffer, setMenuOffer] = useState<Offer | null>(null);

  const { data, isLoading, isError, error, isFetching } = useLiveQuery({
    queryKey: ["offers", discountType, status],
    queryFn: () => getOffers(discountType, status),
  });

  const offers = data?.offers ?? [];
  const summary = data?.summary ?? { total_offers: 0, active_offers: 0, product_offers: 0, order_offers: 0 };

  const paginated = useMemo(() => {
    const start = page * rowsPerPage;
    return offers.slice(start, start + rowsPerPage);
  }, [offers, page, rowsPerPage]);

  useEffect(() => { setPage(0); }, [discountType, status]);
  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(offers.length / rowsPerPage) - 1);
    if (page > maxPage) setPage(maxPage);
  }, [offers.length, page, rowsPerPage]);

  const deleteMutation = useMutation({
    mutationFn: deleteOffer,
    onSuccess: () => {
      invalidatePosQueries(queryClient);
      enqueueSnackbar("Offer deleted", { variant: "success" });
      setRowMenuAnchor(null);
      setMenuOffer(null);
    },
    onError: (err: unknown) => enqueueSnackbar(getFriendlyErrorMessage(err, "Failed to delete"), { variant: "error" }),
  });

  return (
    <Box sx={{ width: "100%", p: { xs: 2, sm: 3 }, boxSizing: "border-box" }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 2, mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Offer Dashboard
          {isFetching && !isLoading && <Typography component="span" variant="caption" sx={{ ml: 1, color: "text.secondary" }}>(updating…)</Typography>}
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="outlined" startIcon={<HelpOutlineIcon />} sx={headerBtnSx} disabled>Help</Button>
          <Button variant="outlined" startIcon={<AddIcon />} sx={headerBtnSx} onClick={() => navigate(`${OFFERS_BASE}/new`)}>Add Offer</Button>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>Product and order-level promotional offers applied at POS checkout.</Alert>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
        <Box sx={summaryCardSx}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase" }}>
            Total offers
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>{isLoading ? "—" : summary.total_offers}</Typography>
          <Typography variant="caption" color="text.secondary">Product + order</Typography>
        </Box>
        <Box sx={summaryCardSx}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase" }}>Active</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: "success.main" }}>{isLoading ? "—" : summary.active_offers}</Typography>
        </Box>
        <Box sx={summaryCardSx}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase" }}>
            Product offers
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>{isLoading ? "—" : summary.product_offers}</Typography>
        </Box>
        <Box sx={summaryCardSx}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase" }}>
            Order offers
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>{isLoading ? "—" : summary.order_offers}</Typography>
        </Box>
      </Box>

      <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: "var(--surface-bg-alt)" }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl size="small" fullWidth>
              <InputLabel>Type</InputLabel>
              <Select label="Type" value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="product">Product</MenuItem>
                <MenuItem value="order">Order</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {isError && <Typography color="error" sx={{ mb: 2 }}>{getFriendlyErrorMessage(error, "Failed to load offers")}</Typography>}

      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead sx={{ bgcolor: "var(--surface-bg-alt)" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Pricing</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Scope</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
            ) : paginated.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>No offers.</TableCell></TableRow>
            ) : paginated.map((o) => (
              <TableRow key={o.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{o.name}</TableCell>
                <TableCell>{o.discount_type_label ?? o.discount_type}</TableCell>
                <TableCell>{o.pricing_mode_label ?? "Retail & Wholesale"}</TableCell>
                <TableCell>{o.offer_items ?? "—"}</TableCell>
                <TableCell>{o.created_at_display ?? "—"}</TableCell>
                <TableCell>
                  <Chip label={o.status ?? (o.is_active ? "Active" : "Inactive")} size="small" color={o.is_active ? "success" : "default"} variant="outlined" />
                </TableCell>
                <TableCell align="center">
                  <IconButton size="small" onClick={(e) => { setRowMenuAnchor(e.currentTarget); setMenuOffer(o); }}><MoreHorizIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!isLoading && offers.length > 0 && (
          <TablePagination component="div" count={offers.length} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} rowsPerPageOptions={[10, 25, 50, 100]} />
        )}
      </TableContainer>

      <Menu anchorEl={rowMenuAnchor} open={Boolean(rowMenuAnchor)} onClose={() => { setRowMenuAnchor(null); setMenuOffer(null); }}>
        <MenuItem onClick={() => { if (menuOffer) navigate(`${OFFERS_BASE}/${menuOffer.id}/edit`); setRowMenuAnchor(null); }}><EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit</MenuItem>
        <MenuItem
          onClick={() => {
            if (!menuOffer) return;
            setRowMenuAnchor(null);
            setMenuOffer(null);
            deleteConfirm.requestDelete({
              title: "Delete offer",
              message: `Delete "${menuOffer.name}"? This cannot be undone.`,
              onConfirm: () => deleteMutation.mutate(menuOffer.id),
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

export default OfferDashboard;
