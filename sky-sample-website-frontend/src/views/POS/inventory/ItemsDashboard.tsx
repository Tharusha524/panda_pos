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
import CategoryIcon from "@mui/icons-material/Category";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import SettingsIcon from "@mui/icons-material/Settings";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AddBoxIcon from "@mui/icons-material/AddBox";
import LayersIcon from "@mui/icons-material/Layers";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLiveQuery } from "../../../hooks/useLiveQuery";
import { invalidatePosQueries } from "../../../utils/invalidatePosQueries";
import { useSnackbar } from "notistack";
import { deleteItem, getItems, type Item } from "../../../api/itemsApi";
import { getFriendlyErrorMessage } from "../../../utils/getFriendlyErrorMessage";
import { formatDashboardRs, headerBtnSx, summaryCardSx } from "../shared/dashboardShared";
import ItemInventoryActionDialogs, { type ItemActionDialogKind } from "./ItemInventoryActionDialogs";
import { ItemExpiryChip } from "./ItemExpiryChip";
import InventoryStockQtyCell from "./InventoryStockQtyCell";
import PosConfirmDeleteDialog from "../shared/PosConfirmDeleteDialog";
import { useConfirmDelete } from "../shared/useConfirmDelete";

const ITEMS_BASE = "/items";

const ItemsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [productType, setProductType] = useState("all");
  const [location, setLocation] = useState("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const deleteConfirm = useConfirmDelete();
  const [rowMenuAnchor, setRowMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuItem, setMenuItem] = useState<Item | null>(null);
  const [dialogKind, setDialogKind] = useState<ItemActionDialogKind>(null);

  const { data, isLoading, isError, error, isFetching } = useLiveQuery({
    queryKey: ["items-dashboard", productType, location],
    queryFn: () => getItems(productType, location),
  });

  const items = data?.items ?? [];
  const summary = data?.summary ?? {
    total_items: 0,
    total_inventory_value: 0,
    low_stock_count: 0,
    active_items: 0,
    expired_count: 0,
    expiring_soon_count: 0,
  };
  const productTypes = data?.product_types ?? [];
  const locations = data?.locations ?? ["Main Location"];

  const paginated = useMemo(() => {
    const start = page * rowsPerPage;
    return items.slice(start, start + rowsPerPage);
  }, [items, page, rowsPerPage]);

  useEffect(() => { setPage(0); }, [productType, location]);
  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(items.length / rowsPerPage) - 1);
    if (page > maxPage) setPage(maxPage);
  }, [items.length, page, rowsPerPage]);

  const deleteMutation = useMutation({
    mutationFn: deleteItem,
    onSuccess: () => {
      invalidatePosQueries(queryClient);
      enqueueSnackbar("Item deleted", { variant: "success" });
      setRowMenuAnchor(null);
      setMenuItem(null);
    },
    onError: (err: unknown) => enqueueSnackbar(getFriendlyErrorMessage(err, "Failed to delete"), { variant: "error" }),
  });

  return (
    <Box sx={{ width: "100%", p: { xs: 2, sm: 3 }, boxSizing: "border-box" }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 2, mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Items Dashboard
          {isFetching && !isLoading && <Typography component="span" variant="caption" sx={{ ml: 1, color: "text.secondary" }}>(updating…)</Typography>}
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          <Button variant="outlined" startIcon={<HelpOutlineIcon />} sx={headerBtnSx} disabled>Help</Button>
          <Button variant="outlined" startIcon={<CategoryIcon />} sx={headerBtnSx} onClick={() => navigate(`${ITEMS_BASE}/categories`)}>Categories</Button>
          <Button variant="outlined" startIcon={<SettingsIcon />} sx={headerBtnSx} onClick={() => navigate(`${ITEMS_BASE}/settings`)}>Settings</Button>
          <Button variant="outlined" startIcon={<AddIcon />} sx={headerBtnSx} onClick={() => navigate(`${ITEMS_BASE}/new`)}>Add Item</Button>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>Product catalog — selling prices and categories. Use <strong>Inventory Dashboard</strong> for stock quantities.</Alert>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
        <Box sx={summaryCardSx}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase" }}>items</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>{isLoading ? "—" : summary.total_items}</Typography>
        </Box>
        <Box sx={summaryCardSx}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase" }}>active</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: "success.main" }}>{isLoading ? "—" : summary.active_items}</Typography>
        </Box>
        <Box sx={summaryCardSx}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase" }}>low stock</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: "warning.main" }}>{isLoading ? "—" : summary.low_stock_count}</Typography>
        </Box>
        <Box sx={summaryCardSx}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase" }}>expiring soon</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: "warning.dark" }}>{isLoading ? "—" : summary.expiring_soon_count ?? 0}</Typography>
        </Box>
        <Box sx={summaryCardSx}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase" }}>expired</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: "error.main" }}>{isLoading ? "—" : summary.expired_count ?? 0}</Typography>
        </Box>
      </Box>

      <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: "var(--surface-bg-alt)" }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl size="small" fullWidth>
              <InputLabel>Product Type</InputLabel>
              <Select label="Product Type" value={productType} onChange={(e) => setProductType(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                {productTypes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
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

      {isError && <Typography color="error" sx={{ mb: 2 }}>{getFriendlyErrorMessage(error, "Failed to load items")}</Typography>}

      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid var(--surface-border)", borderRadius: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead sx={{ bgcolor: "var(--surface-bg-alt)" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Item No</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Branch</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">UOM</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Selling (Rs)</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Real stock</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Expiry</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={10} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
            ) : paginated.length === 0 ? (
              <TableRow><TableCell colSpan={10} align="center" sx={{ py: 4, color: "text.secondary" }}>No items.</TableCell></TableRow>
            ) : paginated.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{item.item_number}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell>{item.category ?? "—"}</TableCell>
                <TableCell>{item.location}</TableCell>
                <TableCell align="center">{(item.uom ?? "pcs").toUpperCase()}</TableCell>
                <TableCell align="right">{formatDashboardRs(item.selling_price)}</TableCell>
                <TableCell align="right">
                  <InventoryStockQtyCell item={item} />
                </TableCell>
                <TableCell align="center">
                  {(item.nearest_expiry_date ?? item.expiry_date) && item.expiry_status !== "none" ? (
                    <ItemExpiryChip item={item} />
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell><Chip label={item.status} size="small" color={item.is_active ? "success" : "default"} variant="outlined" /></TableCell>
                <TableCell align="center">
                  <IconButton size="small" onClick={(e) => { setRowMenuAnchor(e.currentTarget); setMenuItem(item); }}><MoreHorizIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!isLoading && items.length > 0 && (
          <TablePagination component="div" count={items.length} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} rowsPerPageOptions={[10, 25, 50, 100]} />
        )}
      </TableContainer>

      <Menu anchorEl={rowMenuAnchor} open={Boolean(rowMenuAnchor)} onClose={() => setRowMenuAnchor(null)}>
        <MenuItem onClick={() => { setDialogKind("view"); setRowMenuAnchor(null); }}><VisibilityIcon fontSize="small" sx={{ mr: 1 }} /> View item master</MenuItem>
        <MenuItem onClick={() => { setDialogKind("batches"); setRowMenuAnchor(null); }}><AddBoxIcon fontSize="small" sx={{ mr: 1 }} /> Add expiry stock (batch)</MenuItem>
        <MenuItem onClick={() => { setDialogKind("batchVariants"); setRowMenuAnchor(null); }}><LayersIcon fontSize="small" sx={{ mr: 1 }} /> Item batch & variants</MenuItem>
        <MenuItem onClick={() => { setDialogKind("charges"); setRowMenuAnchor(null); }}><AttachMoneyIcon fontSize="small" sx={{ mr: 1 }} /> Add or modify additional charge</MenuItem>
        <MenuItem onClick={() => { if (menuItem) navigate(`${ITEMS_BASE}/${menuItem.id}/edit`); setRowMenuAnchor(null); }}><EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit item master</MenuItem>
        <MenuItem
          onClick={() => {
            if (!menuItem) return;
            setRowMenuAnchor(null);
            deleteConfirm.requestDelete({
              title: "Delete item",
              message: `Delete "${menuItem.description}"? This cannot be undone.`,
              onConfirm: () => deleteMutation.mutate(menuItem.id),
            });
          }}
          sx={{ color: "error.main" }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      <ItemInventoryActionDialogs
        item={menuItem}
        kind={dialogKind}
        onClose={() => setDialogKind(null)}
        onSaved={() => invalidatePosQueries(queryClient)}
      />

      <PosConfirmDeleteDialog
        {...deleteConfirm.dialog}
        onCancel={deleteConfirm.close}
        onConfirm={deleteConfirm.confirm}
        loading={deleteMutation.isPending}
      />
    </Box>
  );
};

export default ItemsDashboard;
