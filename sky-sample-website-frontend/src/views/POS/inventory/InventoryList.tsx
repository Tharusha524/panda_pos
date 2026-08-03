import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControl,
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
  Tooltip,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import SettingsIcon from "@mui/icons-material/Settings";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import PrintIcon from "@mui/icons-material/Print";
import { Link, useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getItems, updateItemPurchasePrice } from "../../../api/itemsApi";
import BranchLocationSelect from "../../../components/BranchLocationSelect";
import { useBranchLocations } from "../../../hooks/useBranchLocations";
import { getFriendlyErrorMessage } from "../../../utils/getFriendlyErrorMessage";
import { getActiveLocation, setActiveLocation } from "../../../utils/posActiveLocation";
import { INVENTORY_BASE_PATH } from "./inventoryShortcuts";
import { ItemExpiryChip } from "./ItemExpiryChip";
import InventoryStockQtyCell from "./InventoryStockQtyCell";

type SortByQty = "all" | "asc" | "desc";

const TABLE_COL_COUNT_BASE = 11; // checkbox + 10 data columns (without branch)

function formatMoney(value: number | undefined): string {
  const amount = Number(value ?? 0);
  return amount.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const InventoryList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [productType, setProductType] = useState("all");
  const [editingPurchaseId, setEditingPurchaseId] = useState<number | null>(null);
  const [purchaseInput, setPurchaseInput] = useState("");
  const [location, setLocation] = useState(getActiveLocation);
  const [sortByQty, setSortByQty] = useState<SortByQty>("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null);
  const [rowMenuAnchor, setRowMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuItemId, setMenuItemId] = useState<number | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["inventory-list", productType, location],
    queryFn: () => getItems(productType, location),
  });

  const settings = data?.inventory_settings;
  const itemSettings = data?.item_settings;
  const costingMethod = settings?.costing_method ?? data?.items?.[0]?.costing_method ?? "FIFO";
  const { manageMultiple, defaultLocation, locations: branchOptions } = useBranchLocations(
    data?.locations ?? []
  );

  useEffect(() => {
    if (!manageMultiple) {
      setLocation("Main Location");
      return;
    }
    if (location !== "all" && !branchOptions.includes(location)) {
      setLocation(defaultLocation);
    }
  }, [manageMultiple, branchOptions, defaultLocation, location]);
  const showLocationFilter =
    manageMultiple || (settings?.allow_inventory_location_filter ?? true);
  const showBranchColumn = location === "all" && manageMultiple;
  const tableColCount = TABLE_COL_COUNT_BASE + (showBranchColumn ? 1 : 0);
  const allowEditPurchasePrice =
    itemSettings?.allow_editing_purchase_price_in_inventory_dashboard !== false;

  const purchasePriceMutation = useMutation({
    mutationFn: ({ id, price }: { id: number; price: number }) =>
      updateItemPurchasePrice(id, price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-list"] });
      setEditingPurchaseId(null);
    },
  });

  const items = data?.items ?? [];
  const productTypes = data?.product_types ?? [];

  const branchSummary = useMemo(() => {
    const totalQty = items.reduce((sum, i) => sum + Number(i.qty ?? 0), 0);
    const expired = items.filter((i) => i.expiry_status === "expired").length;
    const expiringSoon = items.filter((i) => i.expiry_status === "expiring_soon").length;
    const label =
      location === "all" ? "All branches" : location || defaultLocation;
    return { label, count: items.length, totalQty, expired, expiringSoon };
  }, [items, location, defaultLocation]);

  const sortedItems = useMemo(() => {
    const list = [...items];
    if (sortByQty === "asc") list.sort((a, b) => Number(a.qty ?? 0) - Number(b.qty ?? 0));
    if (sortByQty === "desc") list.sort((a, b) => Number(b.qty ?? 0) - Number(a.qty ?? 0));
    return list;
  }, [items, sortByQty]);

  const paginatedItems = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedItems.slice(start, start + rowsPerPage);
  }, [sortedItems, page, rowsPerPage]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(paginatedItems.map((i) => i.id)));
      return;
    }
    setSelectedIds(new Set());
  };

  return (
    <Box sx={{ width: "100%", p: { xs: 2, sm: 3 }, boxSizing: "border-box" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Inventory Dashboard
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
            <Chip
              size="small"
              label={`Branch: ${branchSummary.label}`}
              sx={{ bgcolor: "var(--tint-info-bg)", fontWeight: 600 }}
            />
            <Chip size="small" label={`${branchSummary.count} item(s)`} variant="outlined" />
            <Chip
              size="small"
              label={`Qty: ${branchSummary.totalQty.toFixed(2)} (mixed UOM)`}
              variant="outlined"
            />
            {branchSummary.expired > 0 && (
              <Chip size="small" label={`Expired: ${branchSummary.expired}`} color="error" variant="outlined" />
            )}
            {branchSummary.expiringSoon > 0 && (
              <Chip
                size="small"
                label={`Expiring soon: ${branchSummary.expiringSoon}`}
                color="warning"
                variant="outlined"
              />
            )}
            <Chip size="small" label={`Costing: ${costingMethod}`} sx={{ bgcolor: "var(--tint-info-bg)" }} />
            {settings?.allow_tog && (
              <Chip size="small" label="TOG enabled" variant="outlined" color="primary" />
            )}
            {settings?.allow_request_for_quotation && (
              <Chip size="small" label="RFQ enabled" variant="outlined" color="primary" />
            )}
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Button
            component={Link}
            to={`${INVENTORY_BASE_PATH}/settings`}
            size="small"
            startIcon={<SettingsIcon />}
            sx={{ textTransform: "none", mr: 1 }}
          >
            Settings
          </Button>
          <Tooltip title="Columns">
            <IconButton size="small" onClick={(e) => setColumnMenuAnchor(e.currentTarget)}>
              <ViewColumnIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print">
            <IconButton size="small">
              <PrintIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          flexWrap: "wrap",
          gap: 1.5,
          mb: 1.5,
        }}
      >
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Product Type</InputLabel>
          <Select
            label="Product Type"
            value={productType}
            onChange={(e) => {
              setProductType(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="all">All</MenuItem>
            {productTypes.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Sort By Qty</InputLabel>
          <Select
            label="Sort By Qty"
            value={sortByQty}
            onChange={(e) => {
              setSortByQty(e.target.value as SortByQty);
              setPage(0);
            }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="asc">Low to High</MenuItem>
            <MenuItem value="desc">High to Low</MenuItem>
          </Select>
        </FormControl>
        {showLocationFilter && manageMultiple && (
          <BranchLocationSelect
            value={location}
            onChange={(loc) => {
              setLocation(loc);
              if (loc !== "all") setActiveLocation(loc);
              setPage(0);
            }}
            label="Branch"
            showAllOption
            minWidth={200}
          />
        )}
        {showLocationFilter && !manageMultiple && (
          <Chip size="small" label="Main Location" sx={{ alignSelf: "center" }} />
        )}
      </Box>

      {isError && (
        <Typography color="error" sx={{ mb: 2 }}>
          {getFriendlyErrorMessage(error, "Failed to load inventory")}
        </Typography>
      )}

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: "1px solid #e5e7eb", borderRadius: 1 }}
      >
        <Table size="small">
          <TableHead sx={{ bgcolor: "var(--surface-bg-alt)" }}>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  size="small"
                  indeterminate={
                    selectedIds.size > 0 && selectedIds.size < paginatedItems.length
                  }
                  checked={
                    paginatedItems.length > 0 && selectedIds.size === paginatedItems.length
                  }
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Item Number</TableCell>
              {showBranchColumn && (
                <TableCell sx={{ fontWeight: 700 }}>Branch</TableCell>
              )}
              <TableCell sx={{ fontWeight: 700 }}>Item Description</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">UOM</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Bid</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Real stock
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                Expiry
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Last Purchase Price (Rs)
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Selling Price (Rs)
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={tableColCount} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} sx={{ color: "var(--pallet-blue)" }} />
                </TableCell>
              </TableRow>
            ) : paginatedItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={tableColCount}
                  align="center"
                  sx={{ py: 4, color: "text.secondary" }}
                >
                  No inventory records found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedItems.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      size="small"
                      checked={selectedIds.has(row.id)}
                      onChange={(e) => {
                        setSelectedIds((prev) => {
                          const next = new Set(prev);
                          if (e.target.checked) next.add(row.id);
                          else next.delete(row.id);
                          return next;
                        });
                      }}
                    />
                  </TableCell>
                  <TableCell>{row.item_number}</TableCell>
                  {showBranchColumn && (
                    <TableCell>
                      <Chip label={row.location ?? "—"} size="small" sx={{ fontWeight: 600 }} />
                    </TableCell>
                  )}
                  <TableCell>{row.description}</TableCell>
                  <TableCell align="center">{(row.uom ?? "pcs").toUpperCase()}</TableCell>
                  <TableCell>{row.bid ?? row.item_number}</TableCell>
                  <TableCell align="right">
                    <InventoryStockQtyCell item={row} />
                  </TableCell>
                  <TableCell align="center">
                    {(row.nearest_expiry_date ?? row.expiry_date) && row.expiry_status !== "none" ? (
                      <ItemExpiryChip item={row} />
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{row.category ?? "—"}</TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    {allowEditPurchasePrice && editingPurchaseId === row.id ? (
                      <TextField
                        size="small"
                        type="number"
                        value={purchaseInput}
                        onChange={(e) => setPurchaseInput(e.target.value)}
                        onBlur={() => {
                          const price = parseFloat(purchaseInput);
                          if (!Number.isNaN(price)) {
                            purchasePriceMutation.mutate({ id: row.id, price });
                          } else {
                            setEditingPurchaseId(null);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const price = parseFloat(purchaseInput);
                            if (!Number.isNaN(price)) {
                              purchasePriceMutation.mutate({ id: row.id, price });
                            }
                          }
                        }}
                        autoFocus
                        sx={{ width: 110 }}
                        inputProps={{ min: 0, step: "0.01" }}
                      />
                    ) : (
                      <Typography
                        variant="body2"
                        component="span"
                        sx={
                          allowEditPurchasePrice
                            ? {
                                cursor: "pointer",
                                textDecoration: "underline",
                                color: "var(--pallet-blue)",
                              }
                            : undefined
                        }
                        onClick={() => {
                          if (!allowEditPurchasePrice) return;
                          setEditingPurchaseId(row.id);
                          setPurchaseInput(
                            String(row.last_purchase_price ?? row.purchase_price ?? 0)
                          );
                        }}
                      >
                        {formatMoney(row.last_purchase_price ?? row.purchase_price)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">{formatMoney(row.selling_price)}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit item">
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/items/${row.id}/edit`)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        setRowMenuAnchor(e.currentTarget);
                        setMenuItemId(row.id);
                      }}
                    >
                      <MoreHorizIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={sortedItems.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50]}
          labelRowsPerPage="Rows per page:"
          sx={{ borderTop: "1px solid #e5e7eb" }}
        />
      </TableContainer>

      <Menu
        anchorEl={columnMenuAnchor}
        open={Boolean(columnMenuAnchor)}
        onClose={() => setColumnMenuAnchor(null)}
      >
        <MenuItem disabled>Default columns enabled</MenuItem>
      </Menu>
      <Menu
        anchorEl={rowMenuAnchor}
        open={Boolean(rowMenuAnchor)}
        onClose={() => {
          setRowMenuAnchor(null);
          setMenuItemId(null);
        }}
      >
        <MenuItem
          onClick={() => {
            if (menuItemId) navigate(`/items/${menuItemId}/edit`);
            setRowMenuAnchor(null);
          }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit item
        </MenuItem>
        {settings?.allow_tog && <MenuItem disabled>Transfer (TOG) — coming soon</MenuItem>}
        {settings?.allow_request_for_quotation && (
          <MenuItem disabled>Request for Quotation — coming soon</MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default InventoryList;
