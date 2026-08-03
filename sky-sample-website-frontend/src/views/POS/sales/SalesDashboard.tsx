import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format, startOfDay } from "date-fns";
import AddIcon from "@mui/icons-material/Add";
import ReplayIcon from "@mui/icons-material/Replay";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";
import PrintIcon from "@mui/icons-material/Print";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { useNavigate, useLocation } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLiveQuery } from "../../../hooks/useLiveQuery";
import { invalidatePosQueries } from "../../../utils/invalidatePosQueries";
import { useSnackbar } from "notistack";
import { deleteSale, getSaleReceipt, getSales, type OrderStatus, type Sale } from "../../../api/salesApi";
import { downloadSaleReceiptImageFromApi } from "./saleReceiptImageDownload";
import { printSaleReceiptFromApi } from "./saleReceiptPrint";
import { getFriendlyErrorMessage } from "../../../utils/getFriendlyErrorMessage";
import { DEFAULT_TRANSACTION_TYPE, TRANSACTION_TYPE_RETURN, canReturnSale, isReturnTransaction, transactionTypeLabel } from "./saleConstants";
import { SALES_BASE } from "./saleFormUtils";
import SalesDashboardTableRow from "./SalesDashboardTableRow";
import PosConfirmDeleteDialog from "../shared/PosConfirmDeleteDialog";
import { useConfirmDelete } from "../shared/useConfirmDelete";

function formatRs(amount: number): string {
  return `Rs ${amount.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const headerBtnSx = {
  textTransform: "none" as const,
  fontWeight: 600,
  borderColor: "var(--surface-border)",
  color: "text.primary",
  bgcolor: "var(--surface-bg)",
  "&:hover": { bgcolor: "var(--surface-bg-alt)", borderColor: "var(--surface-text-muted)" },
};

const summaryCardSx = {
  flex: 1,
  minWidth: 200,
  p: 2,
  border: "1px solid var(--surface-border)",
  borderRadius: 1,
  bgcolor: "var(--surface-bg)",
};

const SalesDashboard: React.FC = () => {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [transactionType, setTransactionType] = useState(DEFAULT_TRANSACTION_TYPE);
  const [location, setLocation] = useState("all");
  const [orderStatus, setOrderStatus] = useState<OrderStatus | "all">("all");
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [rowMenuAnchor, setRowMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuSale, setMenuSale] = useState<Sale | null>(null);
  const [receiptActionBusy, setReceiptActionBusy] = useState(false);
  const deleteConfirm = useConfirmDelete();
  const [deletePinOpen, setDeletePinOpen] = useState(false);
  const [deletePin, setDeletePin] = useState("");
  const [pendingDeleteSale, setPendingDeleteSale] = useState<Sale | null>(null);

  const navigateToReturn = (sale: Sale) => {
    if (!canReturnSale(sale)) {
      enqueueSnackbar(
        sale.has_return
          ? "This invoice has been fully returned."
          : "Nothing left to return on this invoice.",
        { variant: "warning" }
      );
      return;
    }
    navigate(`${SALES_BASE}/new/edit?type=return&sourceSaleId=${sale.id}`, {
      state: { returnFromSale: sale },
    });
  };

  const printReceiptForSale = async (sale: Sale) => {
    setReceiptActionBusy(true);
    try {
      const receipt = await getSaleReceipt(sale.id);
      printSaleReceiptFromApi(receipt);
    } catch (err: unknown) {
      enqueueSnackbar(getFriendlyErrorMessage(err, "Could not print receipt"), {
        variant: "error",
      });
    } finally {
      setReceiptActionBusy(false);
    }
  };

  const transactionTypeSelectLabel = (value: string) =>
    value === "all" ? "All (Sales + Returns)" : transactionTypeLabel(value);
  const dateFromStr = dateFrom ? format(dateFrom, "yyyy-MM-dd") : undefined;
  const dateToStr = dateTo ? format(dateTo, "yyyy-MM-dd") : undefined;

  const { data, isLoading, isError, error, isFetching } = useLiveQuery({
    queryKey: ["sales", transactionType, location, orderStatus, dateFromStr, dateToStr],
    queryFn: () => getSales(transactionType, location, dateFromStr, dateToStr, orderStatus),
  });

  const sales = data?.sales ?? [];
  const returnedSaleIds = useMemo(
    () => new Set(data?.returned_sale_ids ?? []),
    [data?.returned_sale_ids]
  );
  const salesWithReturnFlags = useMemo(
    () =>
      sales.map((sale) => ({
        ...sale,
        has_return: sale.has_return === true || returnedSaleIds.has(sale.id),
      })),
    [sales, returnedSaleIds]
  );
  const summary = data?.summary ?? {
    total_orders: 0,
    total_sales_amount: 0,
    total_returns_amount: 0,
    net_sales_amount: 0,
    hold_orders_count: 0,
  };
  const transactionTypes = data?.transaction_types ?? [DEFAULT_TRANSACTION_TYPE];
  const locations = data?.locations ?? ["Main Location"];

  const transactionTypeOptions = useMemo(() => {
    const merged = new Set([
      DEFAULT_TRANSACTION_TYPE,
      TRANSACTION_TYPE_RETURN,
      ...transactionTypes,
    ]);
    return Array.from(merged);
  }, [transactionTypes]);

  /** Sale = sales only; Return = return docs only; All = both with correct status labels. */
  const displayedSales = useMemo(() => {
    if (transactionType === TRANSACTION_TYPE_RETURN) {
      return salesWithReturnFlags.filter((row) => isReturnTransaction(row.transaction_type));
    }
    if (transactionType === DEFAULT_TRANSACTION_TYPE) {
      return salesWithReturnFlags.filter((row) => !isReturnTransaction(row.transaction_type));
    }
    if (transactionType === "all") {
      return salesWithReturnFlags;
    }
    return salesWithReturnFlags.filter((row) => String(row.transaction_type ?? "") === transactionType);
  }, [salesWithReturnFlags, transactionType]);

  const paginatedSales = useMemo(() => {
    const start = page * rowsPerPage;
    return displayedSales.slice(start, start + rowsPerPage);
  }, [displayedSales, page, rowsPerPage]);
  const branchSummary = useMemo(() => {
    const byBranch = new Map<string, { count: number; amount: number }>();
    for (const row of displayedSales) {
      if (isReturnTransaction(row.transaction_type)) continue;
      const key = row.location || "Unknown";
      const curr = byBranch.get(key) ?? { count: 0, amount: 0 };
      curr.count += 1;
      curr.amount += Number(row.net_amount ?? 0);
      byBranch.set(key, curr);
    }
    return Array.from(byBranch.entries())
      .map(([branch, vals]) => ({
        branch,
        count: vals.count,
        amount: vals.amount,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [displayedSales]);

  const periodLabel =
    dateFrom && dateTo
      ? dateFromStr === dateToStr
        ? `Today (${format(dateFrom, "dd-MM-yyyy")})`
        : `${format(dateFrom, "dd-MM-yyyy")} — ${format(dateTo, "dd-MM-yyyy")}`
      : "All time";

  useEffect(() => {
    const state = routerLocation.state as { transactionTypeFilter?: string } | null;
    if (state?.transactionTypeFilter) {
      setTransactionType(state.transactionTypeFilter);
      navigate(routerLocation.pathname, { replace: true, state: {} });
    }
  }, [routerLocation.state, routerLocation.pathname, navigate]);

  useEffect(() => {
    setPage(0);
  }, [transactionType, location, orderStatus, dateFromStr, dateToStr]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(displayedSales.length / rowsPerPage) - 1);
    if (page > maxPage) setPage(maxPage);
  }, [displayedSales.length, page, rowsPerPage]);

  const deleteMutation = useMutation({
    mutationFn: ({ id, pin }: { id: number; pin?: string }) => deleteSale(id, pin),
    onSuccess: () => {
      invalidatePosQueries(queryClient);
      enqueueSnackbar("Sale deleted", { variant: "success" });
      setRowMenuAnchor(null);
      setMenuSale(null);
      setDeletePinOpen(false);
      setDeletePin("");
      setPendingDeleteSale(null);
    },
    onError: (err: unknown) => {
      enqueueSnackbar(getFriendlyErrorMessage(err, "Failed to delete sale"), {
        variant: "error",
      });
    },
  });

  const requestDelete = (sale: Sale) => {
    if (sale.order_status === "hold") {
      setPendingDeleteSale(sale);
      setDeletePinOpen(true);
      setRowMenuAnchor(null);
      setMenuSale(null);
      return;
    }
    setRowMenuAnchor(null);
    setMenuSale(null);
    deleteConfirm.requestDelete({
      title: "Delete sale",
      message: `Delete sale "${sale.sales_id}"? This cannot be undone.`,
      onConfirm: () => deleteMutation.mutate({ id: sale.id }),
    });
  };

  const setToday = () => {
    const today = startOfDay(new Date());
    setDateFrom(today);
    setDateTo(today);
  };
  const clearDates = () => {
    setDateFrom(null);
    setDateTo(null);
  };

  return (
    <Box sx={{ width: "100%", p: { xs: 2, sm: 3 }, boxSizing: "border-box" }}>
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
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Sales Dashboard
          {isFetching && !isLoading && (
            <Typography component="span" variant="caption" sx={{ ml: 1, color: "text.secondary" }}>
              (updating…)
            </Typography>
          )}
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          <Button variant="outlined" startIcon={<HelpOutlineIcon />} sx={headerBtnSx} disabled>
            Help
          </Button>
          <Button
            variant="outlined"
            startIcon={<ReplayIcon />}
            sx={{ ...headerBtnSx, color: "error.main", borderColor: "#e57373" }}
            onClick={() => navigate(`${SALES_BASE}/new/edit?type=return`)}
          >
            Sales Return
          </Button>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            sx={headerBtnSx}
            onClick={() => navigate(`${SALES_BASE}/new`)}
          >
            Add Sale
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
        <Box sx={summaryCardSx}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase" }}>
            total
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No of Total Order(s)
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>
            {isLoading ? "—" : summary.total_orders}
          </Typography>
        </Box>
        <Box sx={summaryCardSx}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase" }}>
            total
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total Sales{transactionType === "all" ? " (gross)" : ""}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color: "var(--pallet-blue)" }}>
            {isLoading ? "—" : formatRs(summary.total_sales_amount)}
          </Typography>
        </Box>
        {transactionType === "all" && (
          <Box sx={summaryCardSx}>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase" }}>
              returns
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sales Returns
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color: "error.main" }}>
              {isLoading ? "—" : formatRs(summary.total_returns_amount ?? 0)}
            </Typography>
          </Box>
        )}
        {transactionType === "all" && (
          <Box sx={summaryCardSx}>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase" }}>
              net
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Net Sales
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color: "#0d9488" }}>
              {isLoading ? "—" : formatRs(summary.net_sales_amount ?? 0)}
            </Typography>
          </Box>
        )}
        <Box
          sx={{
            ...summaryCardSx,
            cursor: "pointer",
            borderColor: orderStatus === "hold" ? "#ed6c02" : "#e0e0e0",
          }}
          onClick={() => setOrderStatus((prev) => (prev === "hold" ? "all" : "hold"))}
        >
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase" }}>
            hold
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Hold Orders
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color: "#ed6c02" }}>
            {isLoading ? "—" : summary.hold_orders_count ?? 0}
          </Typography>
        </Box>
      </Box>
      <Paper variant="outlined" sx={{ p: 1.5, mb: 2, bgcolor: "var(--surface-bg-alt)" }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          Branch-wise sales
        </Typography>
        {isLoading ? (
          <Typography variant="body2" color="text.secondary">Loading...</Typography>
        ) : branchSummary.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No sales in this period.</Typography>
        ) : (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {branchSummary.map((row) => (
              <Box
                key={row.branch}
                sx={{
                  px: 1.25,
                  py: 0.9,
                  border: "1px solid #e5e7eb",
                  borderRadius: 1,
                  bgcolor: "var(--surface-bg)",
                }}
              >
                <Typography variant="caption" color="text.secondary">{row.branch}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.count} orders</Typography>
                <Typography variant="caption" color="primary.main">{formatRs(row.amount)}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: "var(--surface-bg-alt)" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <CalendarTodayIcon fontSize="small" color="action" />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {periodLabel}
          </Typography>
          <Button size="small" variant="text" onClick={setToday} sx={{ ml: 1 }}>
            Today
          </Button>
          <Button size="small" variant="text" onClick={clearDates}>
            All
          </Button>
        </Box>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2.5}>
            <DatePicker
              label="From"
              value={dateFrom}
              onChange={(d) => d && setDateFrom(d)}
              slotProps={{ textField: { size: "small", fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.5}>
            <DatePicker
              label="To"
              value={dateTo}
              onChange={(d) => d && setDateTo(d)}
              slotProps={{ textField: { size: "small", fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.5}>
            <FormControl size="small" fullWidth>
              <InputLabel>Transaction Type</InputLabel>
              <Select
                label="Transaction Type"
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value)}
                renderValue={(value) => transactionTypeSelectLabel(String(value))}
              >
                <MenuItem value="all">All (Sales + Returns)</MenuItem>
                {transactionTypeOptions.map((t) => (
                  <MenuItem key={t} value={t}>
                    {transactionTypeLabel(t)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2.5}>
            <FormControl size="small" fullWidth>
              <InputLabel>Branch</InputLabel>
              <Select label="Branch" value={location} onChange={(e) => setLocation(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                {locations.map((loc) => (
                  <MenuItem key={loc} value={loc}>
                    {loc}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2.5}>
            <FormControl size="small" fullWidth>
              <InputLabel>Order Status</InputLabel>
              <Select
                label="Order Status"
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value as OrderStatus | "all")}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="hold">Hold</MenuItem>
                <MenuItem value="quotation">Quotation</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {isError && (
        <Typography color="error" sx={{ mb: 2 }}>
          {getFriendlyErrorMessage(error, "Failed to load sales")}
        </Typography>
      )}

      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead sx={{ bgcolor: "var(--surface-bg-alt)" }}>
            <TableRow>
              <TableCell width={48} />
              <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Sales ID</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Branch</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Sales Type</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Sub Total (Rs)
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Discount (Rs)
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Net Amount (Rs)
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} sx={{ color: "var(--pallet-blue)" }} />
                </TableCell>
              </TableRow>
            ) : paginatedSales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  {transactionType === TRANSACTION_TYPE_RETURN
                    ? "No return transactions for the selected filters."
                    : transactionType === "all"
                      ? "No transactions for the selected filters."
                      : "No sales for the selected filters."}
                </TableCell>
              </TableRow>
            ) : (
              paginatedSales.map((row) => (
                <SalesDashboardTableRow
                  key={row.id}
                  sale={row}
                  onReturn={navigateToReturn}
                  onPrintReceipt={printReceiptForSale}
                  receiptBusy={receiptActionBusy}
                  onOpenMenu={(e, sale) => {
                    setRowMenuAnchor(e.currentTarget);
                    setMenuSale(sale);
                  }}
                />
              ))
            )}
          </TableBody>
        </Table>
        {!isLoading && displayedSales.length > 0 && (
          <TablePagination
            component="div"
            count={displayedSales.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Rows per page:"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} of ${count}`}
            sx={{ borderTop: "1px solid #e5e7eb" }}
          />
        )}
      </TableContainer>

      <Menu
        anchorEl={rowMenuAnchor}
        open={Boolean(rowMenuAnchor)}
        onClose={() => {
          setRowMenuAnchor(null);
          setMenuSale(null);
        }}
      >
        <MenuItem
          onClick={() => {
            if (menuSale?.order_status === "hold") {
              navigate(`${SALES_BASE}/new?holdId=${menuSale.id}`);
            } else if (menuSale && !isReturnTransaction(menuSale.transaction_type)) {
              navigate(`${SALES_BASE}/${menuSale.id}/edit`);
            }
            setRowMenuAnchor(null);
            setMenuSale(null);
          }}
          disabled={
            !menuSale ||
            receiptActionBusy ||
            (menuSale != null && isReturnTransaction(menuSale.transaction_type))
          }
        >
          {menuSale?.order_status === "hold" ? (
            <>
              <PlayArrowIcon fontSize="small" sx={{ mr: 1 }} />
              Resume in POS
            </>
          ) : (
            <>
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              Edit
            </>
          )}
        </MenuItem>
        <MenuItem
          disabled={!menuSale || !canReturnSale(menuSale)}
          onClick={() => {
            if (menuSale) navigateToReturn(menuSale);
            setRowMenuAnchor(null);
            setMenuSale(null);
          }}
          sx={{ color: "error.main" }}
        >
          <ReplayIcon fontSize="small" sx={{ mr: 1 }} />
          Return sale
        </MenuItem>
        <MenuItem
          disabled={!menuSale || receiptActionBusy || menuSale?.order_status === "hold"}
          onClick={async () => {
            if (!menuSale) return;
            setReceiptActionBusy(true);
            try {
              const receipt = await getSaleReceipt(menuSale.id);
              await downloadSaleReceiptImageFromApi(receipt);
              enqueueSnackbar("Receipt downloaded as PNG", { variant: "success" });
            } catch (err: unknown) {
              enqueueSnackbar(
                getFriendlyErrorMessage(err, "Could not download receipt image"),
                { variant: "error" }
              );
            } finally {
              setReceiptActionBusy(false);
              setRowMenuAnchor(null);
              setMenuSale(null);
            }
          }}
        >
          <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
          Download receipt image
        </MenuItem>
        <MenuItem
          disabled={!menuSale || receiptActionBusy || menuSale?.order_status === "hold"}
          onClick={async () => {
            if (!menuSale) return;
            await printReceiptForSale(menuSale);
            setRowMenuAnchor(null);
            setMenuSale(null);
          }}
        >
          <PrintIcon fontSize="small" sx={{ mr: 1 }} />
          {menuSale && isReturnTransaction(menuSale.transaction_type)
            ? "Print return receipt"
            : "Print receipt"}
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuSale) requestDelete(menuSale);
          }}
          sx={{ color: "error.main" }}
          disabled={!menuSale}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      <Dialog open={deletePinOpen} onClose={() => setDeletePinOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Hold order PIN</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter PIN to delete hold order {pendingDeleteSale?.sales_id ?? ""}.
          </Typography>
          <TextField
            fullWidth
            size="small"
            label="PIN"
            type="password"
            value={deletePin}
            onChange={(e) => setDeletePin(e.target.value)}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeletePinOpen(false)} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={!deletePin.trim() || deleteMutation.isPending}
            onClick={() => {
              if (pendingDeleteSale) {
                deleteMutation.mutate({ id: pendingDeleteSale.id, pin: deletePin.trim() });
              }
            }}
            sx={{ textTransform: "none" }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <PosConfirmDeleteDialog
        {...deleteConfirm.dialog}
        onCancel={deleteConfirm.close}
        onConfirm={deleteConfirm.confirm}
        loading={deleteMutation.isPending}
      />
    </Box>
  );
};

export default SalesDashboard;
