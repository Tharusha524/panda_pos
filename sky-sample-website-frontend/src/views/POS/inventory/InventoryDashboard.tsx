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
  TextField,
  Typography,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import VisibilityIcon from "@mui/icons-material/Visibility";
import HistoryIcon from "@mui/icons-material/History";
import EditIcon from "@mui/icons-material/Edit";
import PriceCheckIcon from "@mui/icons-material/PriceCheck";
import TuneIcon from "@mui/icons-material/Tune";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import AddBoxIcon from "@mui/icons-material/AddBox";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidatePosQueries } from "../../../utils/invalidatePosQueries";
import { useLiveQuery } from "../../../hooks/useLiveQuery";
import { getItems, updateItemPurchasePrice, type Item } from "../../../api/itemsApi";
import { getFriendlyErrorMessage } from "../../../utils/getFriendlyErrorMessage";
import { formatDashboardRs, headerBtnSx, summaryCardSx } from "../shared/dashboardShared";
import ItemInventoryActionDialogs, { type ItemActionDialogKind } from "./ItemInventoryActionDialogs";
import { ItemExpiryChip } from "./ItemExpiryChip";
import InventoryStockQtyCell from "./InventoryStockQtyCell";
import { formatItemQty, filterItemsByExpiry, isItemExpired, type ExpiryFilter } from "./itemInventoryUtils";

const ITEMS_BASE = "/items";

const InventoryDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [productType, setProductType] = useState("all");
  const [location, setLocation] = useState("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [purchaseInput, setPurchaseInput] = useState("");
  const [rowMenuAnchor, setRowMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuItem, setMenuItem] = useState<Item | null>(null);
  const [dialogKind, setDialogKind] = useState<ItemActionDialogKind>(null);
  const [expiryFilter, setExpiryFilter] = useState<ExpiryFilter>("all");

  useEffect(() => {
    const param = searchParams.get("expiry");
    if (param === "expired" || param === "expiring_soon") {
      setExpiryFilter(param);
    }
  }, [searchParams]);

  const refreshLists = () => {
    invalidatePosQueries(queryClient);
    queryClient.invalidateQueries({ queryKey: ["inventory-dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["items-dashboard"] });
  };

  const { data, isLoading, isError, error, isFetching } = useLiveQuery({
    queryKey: ["inventory-dashboard", productType, location],
    queryFn: () => getItems(productType, location),
  });

  const items = data?.items ?? [];
  const summary = data?.summary ?? {
    total_items: 0,
    total_inventory_value: 0,
    low_stock_count: 0,
    oversold_count: 0,
    active_items: 0,
    expired_count: 0,
    expiring_soon_count: 0,
  };
  const productTypes = data?.product_types ?? [];
  const locations = data?.locations ?? ["Main Location"];
  const allowEditPurchase = data?.item_settings?.allow_editing_purchase_price_in_inventory_dashboard !== false;

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => (a.qty ?? 0) - (b.qty ?? 0));
  }, [items]);

  const filtered = useMemo(
    () => filterItemsByExpiry(sorted, expiryFilter),
    [sorted, expiryFilter]
  );

  const paginated = useMemo(() => {
    const start = page * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  useEffect(() => { setPage(0); }, [productType, location, expiryFilter]);
  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(filtered.length / rowsPerPage) - 1);
    if (page > maxPage) setPage(maxPage);
  }, [filtered.length, page, rowsPerPage]);

  const purchaseMutation = useMutation({
    mutationFn: ({ id, price }: { id: number; price: number }) => updateItemPurchasePrice(id, price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["items-dashboard"] });
      setEditingId(null);
    },
  });

  const isLowStock = (item: Item) => {
    const qty = item.qty ?? 0;
    const reorder = item.reorder_qty ?? 0;
    return reorder > 0 && qty <= reorder;
  };

  return (
    <Box sx={{ width: "100%", p: { xs: 2, sm: 3 }, boxSizing: "border-box" }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 2, mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Inventory Dashboard
          {isFetching && !isLoading && <Typography component="span" variant="caption" sx={{ ml: 1, color: "text.secondary" }}>(updating…)</Typography>}
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="outlined" startIcon={<HelpOutlineIcon />} sx={headerBtnSx} disabled>Help</Button>
          <Button component={Link} to="/inventory/settings" variant="outlined" startIcon={<SettingsIcon />} sx={headerBtnSx}>Settings</Button>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        Stock quantities show with their <strong>unit of measure</strong> (pcs, kg, g, l, ml, etc.).
        To add new unit types: <strong>Items → Item Settings → Units of measure</strong>.
        To assign a unit to an item: <strong>Edit item → Stock Details → Unit of Measure</strong>.
      </Alert>

      {(summary.oversold_count ?? 0) > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <strong>{summary.oversold_count}</strong> item
          {summary.oversold_count === 1 ? " was" : "s were"} sold below zero stock. Qty shows{" "}
          <strong>0 on hand</strong> with a red <strong>Short</strong> line for the amount to
          receive. Add stock via <strong>Purchase</strong> or <strong>Inventory adjustment</strong>.
          To block this in future sales, turn off{" "}
          <strong>Allow sales for items with negative inventory</strong> in{" "}
          <strong>Settings → Order Settings</strong>.
        </Alert>
      )}

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
        <Box sx={summaryCardSx}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase" }}>stock value</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: "var(--pallet-blue)" }}>{isLoading ? "—" : formatDashboardRs(summary.total_inventory_value)}</Typography>
        </Box>
        <Box sx={summaryCardSx}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase" }}>items</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>{isLoading ? "—" : summary.total_items}</Typography>
        </Box>
        <Box sx={summaryCardSx}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase" }}>low stock</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: "warning.main" }}>{isLoading ? "—" : summary.low_stock_count}</Typography>
        </Box>
        {(summary.expiring_soon_count ?? 0) > 0 && (
          <Box
            sx={{
              ...summaryCardSx,
              cursor: "pointer",
              outline: expiryFilter === "expiring_soon" ? "2px solid #ed6c02" : undefined,
            }}
            onClick={() => setExpiryFilter((f) => (f === "expiring_soon" ? "all" : "expiring_soon"))}
          >
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase" }}>expiring soon</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: "warning.dark" }}>{summary.expiring_soon_count}</Typography>
          </Box>
        )}
        {(summary.expired_count ?? 0) > 0 && (
          <Box
            sx={{
              ...summaryCardSx,
              cursor: "pointer",
              outline: expiryFilter === "expired" ? "2px solid #d32f2f" : undefined,
            }}
            onClick={() => setExpiryFilter((f) => (f === "expired" ? "all" : "expired"))}
          >
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase" }}>expired</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: "error.main" }}>{summary.expired_count}</Typography>
          </Box>
        )}
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
          <Grid item xs={12} sm={4}>
            <FormControl size="small" fullWidth>
              <InputLabel>Expiry</InputLabel>
              <Select
                label="Expiry"
                value={expiryFilter}
                onChange={(e) => setExpiryFilter(e.target.value as ExpiryFilter)}
              >
                <MenuItem value="all">All items</MenuItem>
                <MenuItem value="expired">Expired only</MenuItem>
                <MenuItem value="expiring_soon">Expiring soon</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {expiryFilter !== "all" ? (
        <Alert severity={expiryFilter === "expired" ? "error" : "warning"} sx={{ mb: 2 }}>
          Showing {expiryFilter === "expired" ? "expired" : "expiring soon"} items only.
          Expired stock cannot be sold — use row menu <strong>Write-off items</strong> to remove it.
        </Alert>
      ) : null}

      {isError && <Typography color="error" sx={{ mb: 2 }}>{getFriendlyErrorMessage(error, "Failed to load inventory")}</Typography>}

      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid var(--surface-border)", borderRadius: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead sx={{ bgcolor: "var(--surface-bg-alt)" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Item No</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Branch</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>UOM</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Real stock</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Reorder</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Expiry</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Purchase (Rs)</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Unit Cost</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Value</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={11} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
            ) : paginated.length === 0 ? (
              <TableRow><TableCell colSpan={11} align="center" sx={{ py: 4, color: "text.secondary" }}>No inventory records.</TableCell></TableRow>
            ) : paginated.map((item) => (
              <TableRow
                key={item.id}
                hover
                sx={{
                  bgcolor: isItemExpired(item)
                    ? "var(--tint-danger-bg)"
                    : isLowStock(item)
                      ? "var(--tint-warning-bg)"
                      : undefined,
                }}
              >
                <TableCell sx={{ fontWeight: 600 }}>{item.item_number}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell>{item.location}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, textTransform: "uppercase" }}>
                  {item.uom ?? "pcs"}
                </TableCell>
                <TableCell align="right">
                  <InventoryStockQtyCell item={item} emphasizeLowStock={isLowStock(item)} />
                </TableCell>
                <TableCell align="right">{formatItemQty(item.reorder_qty ?? 0, item.uom)}</TableCell>
                <TableCell align="center">
                  <ItemExpiryChip item={item} />
                </TableCell>
                <TableCell align="right">
                  {allowEditPurchase && editingId === item.id ? (
                    <TextField
                      size="small"
                      value={purchaseInput}
                      onChange={(e) => setPurchaseInput(e.target.value)}
                      onBlur={() => {
                        const p = parseFloat(purchaseInput);
                        if (!Number.isNaN(p) && p >= 0) purchaseMutation.mutate({ id: item.id, price: p });
                        else setEditingId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      autoFocus
                      sx={{ width: 100 }}
                    />
                  ) : (
                    <Typography
                      component="span"
                      sx={{ cursor: allowEditPurchase ? "pointer" : "default", textDecoration: allowEditPurchase ? "underline" : "none" }}
                      onClick={() => {
                        if (!allowEditPurchase) return;
                        setEditingId(item.id);
                        setPurchaseInput(String(item.purchase_price ?? 0));
                      }}
                    >
                      {formatDashboardRs(item.purchase_price ?? 0)}
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">{formatDashboardRs(item.unit_cost ?? 0)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  {formatDashboardRs(Math.max(0, item.inventory_value ?? 0))}
                </TableCell>
                <TableCell align="center">
                  <IconButton size="small" onClick={(e) => { setRowMenuAnchor(e.currentTarget); setMenuItem(item); }}>
                    <MoreHorizIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!isLoading && sorted.length > 0 && (
          <TablePagination component="div" count={filtered.length} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} rowsPerPageOptions={[10, 25, 50, 100]} />
        )}
      </TableContainer>

      <Menu anchorEl={rowMenuAnchor} open={Boolean(rowMenuAnchor)} onClose={() => setRowMenuAnchor(null)}>
        <MenuItem onClick={() => { setDialogKind("view"); setRowMenuAnchor(null); }}><VisibilityIcon fontSize="small" sx={{ mr: 1 }} /> View</MenuItem>
        <MenuItem onClick={() => { setDialogKind("history"); setRowMenuAnchor(null); }}><HistoryIcon fontSize="small" sx={{ mr: 1 }} /> History</MenuItem>
        <MenuItem onClick={() => { if (menuItem) navigate(`${ITEMS_BASE}/${menuItem.id}/edit`); setRowMenuAnchor(null); }}><EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit</MenuItem>
        <MenuItem onClick={() => { setDialogKind("cost"); setRowMenuAnchor(null); }}><PriceCheckIcon fontSize="small" sx={{ mr: 1 }} /> Cost view</MenuItem>
        <MenuItem onClick={() => { setDialogKind("adjust"); setRowMenuAnchor(null); }}><TuneIcon fontSize="small" sx={{ mr: 1 }} /> Inventory adjustment</MenuItem>
        <MenuItem onClick={() => { setDialogKind("batches"); setRowMenuAnchor(null); }}><AddBoxIcon fontSize="small" sx={{ mr: 1 }} /> Add expiry stock (batch)</MenuItem>
        <MenuItem onClick={() => { setDialogKind("writeOff"); setRowMenuAnchor(null); }} sx={{ color: "error.main" }}><DeleteSweepIcon fontSize="small" sx={{ mr: 1 }} /> Write-off items</MenuItem>
      </Menu>

      <ItemInventoryActionDialogs
        item={menuItem}
        kind={dialogKind}
        onClose={() => setDialogKind(null)}
        onSaved={refreshLists}
      />
    </Box>
  );
};

export default InventoryDashboard;
