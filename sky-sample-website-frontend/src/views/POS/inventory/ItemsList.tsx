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
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import PrintIcon from "@mui/icons-material/Print";
import SettingsIcon from "@mui/icons-material/Settings";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { Link, useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { deleteItem, getItemCategories, getItems, type Item } from "../../../api/itemsApi";
import { getCompanyPrintHeader } from "../../../api/Settings/companySettingsApi";
import BranchLocationSelect from "../../../components/BranchLocationSelect";
import { useBranchLocations } from "../../../hooks/useBranchLocations";
import { getFriendlyErrorMessage } from "../../../utils/getFriendlyErrorMessage";
import { getActiveLocation, setActiveLocation } from "../../../utils/posActiveLocation";
import ItemCategoryFormDialog from "./ItemCategoryFormDialog";
import { exportItemsCsv, printItemsTable } from "./itemPrint";
import { ItemExpiryChip } from "./ItemExpiryChip";
import InventoryStockQtyCell from "./InventoryStockQtyCell";
import PosConfirmDeleteDialog from "../shared/PosConfirmDeleteDialog";
import { useConfirmDelete } from "../shared/useConfirmDelete";

const ITEMS_BASE = "/items";

type ColumnKey =
  | "item_number"
  | "location"
  | "description"
  | "category"
  | "sub_category"
  | "uom"
  | "qty"
  | "expiry"
  | "selling_price"
  | "status";

const ALL_COLUMNS: { key: ColumnKey; label: string; align?: "right" | "center" }[] = [
  { key: "item_number", label: "Item Number" },
  { key: "location", label: "Branch" },
  { key: "description", label: "Description" },
  { key: "category", label: "Category" },
  { key: "sub_category", label: "Sub Category" },
  { key: "uom", label: "UOM", align: "center" },
  { key: "qty", label: "Qty", align: "right" },
  { key: "expiry", label: "Expiry", align: "center" },
  { key: "selling_price", label: "Selling Price (Rs)", align: "right" },
  { key: "status", label: "Status", align: "center" },
];

function formatPrice(amount: number): string {
  return amount.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const ItemsList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const deleteConfirm = useConfirmDelete();

  const [productType, setProductType] = useState("all");
  const [location, setLocation] = useState(getActiveLocation);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(
    () => new Set(ALL_COLUMNS.map((c) => c.key))
  );
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null);
  const [rowMenuAnchor, setRowMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuItem, setMenuItem] = useState<Item | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["items", productType, location],
    queryFn: () => getItems(productType, location),
  });

  const items = data?.items ?? [];
  const productTypes = data?.product_types ?? [];
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

  const branchSummary = useMemo(() => {
    const totalQty = items.reduce((sum, i) => sum + Number(i.qty ?? 0), 0);
    const expired = items.filter((i) => i.expiry_status === "expired").length;
    const expiringSoon = items.filter((i) => i.expiry_status === "expiring_soon").length;
    const label = location === "all" ? "All branches" : location || defaultLocation;
    return { label, count: items.length, totalQty, expired, expiringSoon };
  }, [items, location, defaultLocation]);

  const { data: printHeader } = useQuery({
    queryKey: ["company-print-header"],
    queryFn: getCompanyPrintHeader,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["item-categories"],
    queryFn: getItemCategories,
  });

  const paginatedItems = useMemo(() => {
    const start = page * rowsPerPage;
    return items.slice(start, start + rowsPerPage);
  }, [items, page, rowsPerPage]);

  const deleteMutation = useMutation({
    mutationFn: deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      enqueueSnackbar("Item deleted", { variant: "success" });
      setRowMenuAnchor(null);
      setMenuItem(null);
    },
    onError: (err: unknown) => {
      enqueueSnackbar(getFriendlyErrorMessage(err, "Failed to delete item"), { variant: "error" });
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(paginatedItems.map((i) => i.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handlePrint = () => {
    if (!printHeader) {
      enqueueSnackbar("Print header not loaded", { variant: "warning" });
      return;
    }
    const toPrint =
      selectedIds.size > 0 ? items.filter((i) => selectedIds.has(i.id)) : items;
    if (toPrint.length === 0) {
      enqueueSnackbar("No items to print", { variant: "info" });
      return;
    }
    printItemsTable(toPrint, printHeader);
  };

  const handleExport = () => {
    const toExport =
      selectedIds.size > 0 ? items.filter((i) => selectedIds.has(i.id)) : items;
    if (toExport.length === 0) {
      enqueueSnackbar("No items to export", { variant: "info" });
      return;
    }
    exportItemsCsv(toExport);
  };

  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const visibleColList = ALL_COLUMNS.filter((c) => visibleColumns.has(c.key));
  const colSpan = visibleColList.length + 2;

  const headerBtnSx = {
    textTransform: "none",
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
        to="/inventory"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 1, color: "text.secondary", textTransform: "none" }}
      >
        Back to Inventory
      </Button>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Item
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
              label={`Stock qty: ${branchSummary.totalQty.toFixed(2)} (mixed UOM)`}
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
          </Box>
        </Box>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            sx={headerBtnSx}
            onClick={() => navigate(`${ITEMS_BASE}/new`)}
          >
            Add
          </Button>
          <Button
            component={Link}
            to={`${ITEMS_BASE}/categories`}
            variant="outlined"
            startIcon={<AddIcon />}
            sx={headerBtnSx}
          >
            View category
          </Button>
          <Button
            component={Link}
            to={`${ITEMS_BASE}/settings`}
            variant="outlined"
            startIcon={<SettingsIcon />}
            sx={headerBtnSx}
          >
            Item Settings
          </Button>
          <Button variant="outlined" sx={headerBtnSx} disabled>
            Take a tour
          </Button>
          <Button variant="outlined" startIcon={<HelpOutlineIcon />} sx={headerBtnSx} disabled>
            Help
          </Button>
          <Button variant="outlined" endIcon={<KeyboardArrowDownIcon />} sx={headerBtnSx} disabled>
            View summary
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 2,
          mb: 1,
        }}
      >
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setCategoryDialogOpen(true)}
          sx={{
            textTransform: "none",
            borderColor: "var(--surface-border)",
            bgcolor: "var(--surface-bg)",
            fontWeight: 600,
          }}
        >
          Add category
        </Button>
        <FormControl size="small" sx={{ minWidth: 160 }}>
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
        {manageMultiple ? (
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
        ) : (
          <Chip size="small" label="Main Location" sx={{ alignSelf: "center" }} />
        )}
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title="Column visibility">
            <IconButton size="small" onClick={(e) => setColumnMenuAnchor(e.currentTarget)}>
              <ViewColumnIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export CSV">
            <IconButton size="small" onClick={handleExport} disabled={items.length === 0}>
              <FileDownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print table">
            <IconButton size="small" onClick={handlePrint} disabled={items.length === 0}>
              <PrintIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Menu
        anchorEl={columnMenuAnchor}
        open={Boolean(columnMenuAnchor)}
        onClose={() => setColumnMenuAnchor(null)}
      >
        {ALL_COLUMNS.map((col) => (
          <MenuItem key={col.key} onClick={() => toggleColumn(col.key)} dense>
            <Checkbox size="small" checked={visibleColumns.has(col.key)} />
            {col.label}
          </MenuItem>
        ))}
      </Menu>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Item master list. Item master can be used to create new batches or variants of an item.
      </Typography>

      {isError && (
        <Typography color="error" sx={{ mb: 2 }}>
          {getFriendlyErrorMessage(error, "Failed to load items")}
        </Typography>
      )}

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: "1px solid var(--surface-border)", borderRadius: 1 }}
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
              {visibleColList.map((col) => (
                <TableCell key={col.key} align={col.align} sx={{ fontWeight: 700 }}>
                  {col.label}
                </TableCell>
              ))}
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={colSpan} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : paginatedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  No items found. Click Add to create an item.
                </TableCell>
              </TableRow>
            ) : (
              paginatedItems.map((item) => (
                <TableRow key={item.id} hover selected={selectedIds.has(item.id)}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      size="small"
                      checked={selectedIds.has(item.id)}
                      onChange={(e) => handleSelectOne(item.id, e.target.checked)}
                    />
                  </TableCell>
                  {visibleColList.map((col) => {
                    if (col.key === "item_number") {
                      return <TableCell key={col.key}>{item.item_number}</TableCell>;
                    }
                    if (col.key === "location") {
                      return (
                        <TableCell key={col.key}>
                          <Chip label={item.location ?? "—"} size="small" sx={{ fontWeight: 600 }} />
                        </TableCell>
                      );
                    }
                    if (col.key === "description") {
                      return (
                        <TableCell key={col.key} sx={{ fontWeight: 500 }}>
                          {item.description}
                        </TableCell>
                      );
                    }
                    if (col.key === "category") {
                      return <TableCell key={col.key}>{item.category ?? "—"}</TableCell>;
                    }
                    if (col.key === "sub_category") {
                      return <TableCell key={col.key}>{item.sub_category ?? "—"}</TableCell>;
                    }
                    if (col.key === "uom") {
                      return (
                        <TableCell key={col.key} align="center">
                          {(item.uom ?? "pcs").toUpperCase()}
                        </TableCell>
                      );
                    }
                    if (col.key === "qty") {
                      return (
                        <TableCell key={col.key} align="right">
                          <InventoryStockQtyCell item={item} />
                        </TableCell>
                      );
                    }
                    if (col.key === "expiry") {
                      return (
                        <TableCell key={col.key} align="center">
                          {(item.nearest_expiry_date ?? item.expiry_date) &&
                          item.expiry_status !== "none" ? (
                            <ItemExpiryChip item={item} />
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      );
                    }
                    if (col.key === "selling_price") {
                      return (
                        <TableCell key={col.key} align="right">
                          {formatPrice(item.selling_price)}
                        </TableCell>
                      );
                    }
                    if (col.key === "status") {
                      return (
                        <TableCell key={col.key} align="center">
                          <FiberManualRecordIcon
                            sx={{
                              fontSize: 14,
                              color: item.is_active ? "#4caf50" : "#bdbdbd",
                            }}
                          />
                        </TableCell>
                      );
                    }
                    return null;
                  })}
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        setRowMenuAnchor(e.currentTarget);
                        setMenuItem(item);
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
          count={items.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50]}
          labelRowsPerPage="Rows per page:"
          labelDisplayedRows={({ page }) => `Page: ${page + 1}`}
          sx={{ borderTop: "1px solid var(--surface-border)" }}
        />
      </TableContainer>

      <Menu
        anchorEl={rowMenuAnchor}
        open={Boolean(rowMenuAnchor)}
        onClose={() => {
          setRowMenuAnchor(null);
          setMenuItem(null);
        }}
      >
        <MenuItem
          onClick={() => {
            if (menuItem) {
              navigate(`${ITEMS_BASE}/${menuItem.id}/edit`);
            }
            setRowMenuAnchor(null);
          }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
        </MenuItem>
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

      <ItemCategoryFormDialog
        open={categoryDialogOpen}
        categories={categories}
        onClose={() => setCategoryDialogOpen(false)}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["item-categories"] });
          enqueueSnackbar("Category saved", { variant: "success" });
        }}
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

export default ItemsList;
