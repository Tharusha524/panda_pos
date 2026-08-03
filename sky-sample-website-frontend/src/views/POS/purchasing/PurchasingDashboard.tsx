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
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format, startOfDay } from "date-fns";
import AddIcon from "@mui/icons-material/Add";
import ReplayIcon from "@mui/icons-material/Replay";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PrintIcon from "@mui/icons-material/Print";
import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLiveQuery } from "../../../hooks/useLiveQuery";
import { invalidatePosQueries } from "../../../utils/invalidatePosQueries";
import { useSnackbar } from "notistack";
import { deletePurchase, getPurchases, type Purchase } from "../../../api/purchasesApi";
import { getFriendlyErrorMessage } from "../../../utils/getFriendlyErrorMessage";
import { DEFAULT_PURCHASE_TYPE, PURCHASE_TYPE_PURCHASE, PURCHASE_TYPE_RETURN, canReturnPurchase, isReturnPurchase, purchaseTypeLabel } from "./purchaseConstants";
import { PURCHASES_BASE } from "./purchaseFormUtils";
import PurchasingDashboardTableRow from "./PurchasingDashboardTableRow";
import { formatDashboardRs, headerBtnSx, summaryCardSx } from "../shared/dashboardShared";
import { printPurchaseInvoiceAsync } from "./purchaseReceiptPrint";
import PosConfirmDeleteDialog from "../shared/PosConfirmDeleteDialog";
import { useConfirmDelete } from "../shared/useConfirmDelete";

const PurchasingDashboard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const deleteConfirm = useConfirmDelete();
  const [printActionBusy, setPrintActionBusy] = useState(false);

  const [purchaseType, setPurchaseType] = useState("all");
  const [location, setLocation] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [rowMenuAnchor, setRowMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuPurchase, setMenuPurchase] = useState<Purchase | null>(null);

  const dateFromStr = dateFrom ? format(dateFrom, "yyyy-MM-dd") : undefined;
  const dateToStr = dateTo ? format(dateTo, "yyyy-MM-dd") : undefined;

  const { data, isLoading, isError, error, isFetching } = useLiveQuery({
    queryKey: ["purchases", purchaseType, location, dateFromStr, dateToStr],
    queryFn: () => getPurchases(purchaseType, location, dateFromStr, dateToStr),
  });

  const purchases = data?.purchases ?? [];
  const returnedPurchaseIds = useMemo(
    () => new Set(data?.returned_purchase_ids ?? []),
    [data?.returned_purchase_ids]
  );
  const purchasesWithReturnFlags = useMemo(
    () =>
      purchases.map((purchase) => ({
        ...purchase,
        has_return: purchase.has_return === true || returnedPurchaseIds.has(purchase.id),
        has_partial_return:
          purchase.has_partial_return === true ||
          (purchase.return_status === "partial" && !returnedPurchaseIds.has(purchase.id)),
      })),
    [purchases, returnedPurchaseIds]
  );
  const displayedPurchases = useMemo(() => {
    if (purchaseType === PURCHASE_TYPE_RETURN) {
      return purchasesWithReturnFlags.filter((row) => isReturnPurchase(row.purchase_type));
    }
    if (purchaseType === PURCHASE_TYPE_PURCHASE) {
      return purchasesWithReturnFlags.filter((row) => !isReturnPurchase(row.purchase_type));
    }
    if (purchaseType === "all") {
      return purchasesWithReturnFlags;
    }
    return purchasesWithReturnFlags.filter((row) => String(row.purchase_type ?? "") === purchaseType);
  }, [purchasesWithReturnFlags, purchaseType]);
  const summary = data?.summary ?? { total_purchases: 0, total_purchase_amount: 0 };
  const purchaseTypes = data?.purchase_types ?? [DEFAULT_PURCHASE_TYPE];
  const locations = data?.locations ?? ["Main Location"];

  const paginatedPurchases = useMemo(() => {
    const start = page * rowsPerPage;
    return displayedPurchases.slice(start, start + rowsPerPage);
  }, [displayedPurchases, page, rowsPerPage]);
  const branchSummary = useMemo(() => {
    const byBranch = new Map<string, { count: number; amount: number }>();
    for (const row of displayedPurchases) {
      const key = row.location || "Unknown";
      const curr = byBranch.get(key) ?? { count: 0, amount: 0 };
      curr.count += 1;
      curr.amount += Number(row.amount ?? 0);
      byBranch.set(key, curr);
    }
    return Array.from(byBranch.entries())
      .map(([branch, vals]) => ({
        branch,
        count: vals.count,
        amount: vals.amount,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [displayedPurchases]);

  const periodLabel =
    dateFrom && dateTo
      ? dateFromStr === dateToStr
        ? `Today (${format(dateFrom, "dd-MM-yyyy")})`
        : `${format(dateFrom, "dd-MM-yyyy")} — ${format(dateTo, "dd-MM-yyyy")}`
      : "All time";

  useEffect(() => {
    setPage(0);
  }, [purchaseType, location, dateFromStr, dateToStr]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(displayedPurchases.length / rowsPerPage) - 1);
    if (page > maxPage) setPage(maxPage);
  }, [displayedPurchases.length, page, rowsPerPage]);

  const navigateToReturn = (purchase: Purchase) => {
    if (!canReturnPurchase(purchase)) {
      enqueueSnackbar(
        purchase.has_return
          ? "This invoice has been fully returned."
          : "Nothing left to return on this invoice.",
        { variant: "warning" }
      );
      return;
    }
    navigate(`${PURCHASES_BASE}/new?type=return&sourcePurchaseId=${purchase.id}`, {
      state: { returnFromPurchase: purchase },
    });
  };

  const deleteMutation = useMutation({
    mutationFn: deletePurchase,
    onSuccess: () => {
      invalidatePosQueries(queryClient);
      enqueueSnackbar("Purchase deleted", { variant: "success" });
      setRowMenuAnchor(null);
      setMenuPurchase(null);
    },
    onError: (err: unknown) => {
      enqueueSnackbar(getFriendlyErrorMessage(err, "Failed to delete purchase"), { variant: "error" });
    },
  });

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
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Purchasing Dashboard
          {isFetching && !isLoading && (
            <Typography component="span" variant="caption" sx={{ ml: 1, color: "text.secondary" }}>(updating…)</Typography>
          )}
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          <Button variant="outlined" startIcon={<HelpOutlineIcon />} sx={headerBtnSx} disabled>Help</Button>
          <Button
            variant="outlined"
            startIcon={<ReplayIcon />}
            sx={{ ...headerBtnSx, color: "error.main", borderColor: "#e57373" }}
            onClick={() => navigate(`${PURCHASES_BASE}/new?type=return`)}
          >
            Purchase Return
          </Button>
          <Button variant="outlined" startIcon={<AddIcon />} sx={headerBtnSx} onClick={() => navigate(`${PURCHASES_BASE}/new`)}>Add Purchase</Button>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        Purchases are paid out to suppliers and sync to the Payment Dashboard. Expand a row for line items.
      </Alert>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
        <Box sx={summaryCardSx}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase" }}>purchases</Typography>
          <Typography variant="body2" color="text.secondary">Count in period</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>{isLoading ? "—" : summary.total_purchases}</Typography>
        </Box>
        <Box sx={summaryCardSx}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase" }}>total</Typography>
          <Typography variant="body2" color="text.secondary">Purchase amount (paid out)</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: "error.main" }}>
            {isLoading ? "—" : formatDashboardRs(summary.total_purchase_amount)}
          </Typography>
        </Box>
      </Box>
      <Paper variant="outlined" sx={{ p: 1.5, mb: 2, bgcolor: "var(--surface-bg-alt)" }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          Branch-wise purchases
        </Typography>
        {isLoading ? (
          <Typography variant="body2" color="text.secondary">Loading...</Typography>
        ) : branchSummary.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No purchases in this period.</Typography>
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
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.count} invoices</Typography>
                <Typography variant="caption" color="error.main">{formatDashboardRs(row.amount)}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: "var(--surface-bg-alt)" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <CalendarTodayIcon fontSize="small" color="action" />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{periodLabel}</Typography>
          <Button size="small" variant="text" onClick={setToday} sx={{ ml: 1 }}>Today</Button>
          <Button size="small" variant="text" onClick={clearDates}>All</Button>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={2}>
            <DatePicker label="From" value={dateFrom} onChange={(d) => d && setDateFrom(d)} slotProps={{ textField: { size: "small", fullWidth: true } }} />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <DatePicker label="To" value={dateTo} onChange={(d) => d && setDateTo(d)} slotProps={{ textField: { size: "small", fullWidth: true } }} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Purchase Type</InputLabel>
              <Select label="Purchase Type" value={purchaseType} onChange={(e) => setPurchaseType(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                {purchaseTypes.map((t) => <MenuItem key={t} value={t}>{purchaseTypeLabel(t)}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
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

      {isError && <Typography color="error" sx={{ mb: 2 }}>{getFriendlyErrorMessage(error, "Failed to load purchases")}</Typography>}

      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead sx={{ bgcolor: "var(--surface-bg-alt)" }}>
            <TableRow>
              <TableCell width={48} />
              <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Invoice</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Supplier</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Branch</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Discount</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Payment</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={10} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
            ) : paginatedPurchases.length === 0 ? (
              <TableRow><TableCell colSpan={10} align="center" sx={{ py: 4, color: "text.secondary" }}>No purchases for the selected period.</TableCell></TableRow>
            ) : (
              paginatedPurchases.map((row) => (
                <PurchasingDashboardTableRow
                  key={row.id}
                  purchase={row}
                  onReturn={navigateToReturn}
                  onOpenMenu={(e, purchase) => {
                    setRowMenuAnchor(e.currentTarget);
                    setMenuPurchase(purchase);
                  }}
                />
              ))
            )}
          </TableBody>
        </Table>
        {!isLoading && displayedPurchases.length > 0 && (
          <TablePagination
            component="div"
            count={displayedPurchases.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        )}
      </TableContainer>

      <Menu anchorEl={rowMenuAnchor} open={Boolean(rowMenuAnchor)} onClose={() => { setRowMenuAnchor(null); setMenuPurchase(null); }}>
        <MenuItem onClick={() => { if (menuPurchase) navigate(`${PURCHASES_BASE}/${menuPurchase.id}/edit`); setRowMenuAnchor(null); }}><EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit</MenuItem>
        <MenuItem
          disabled={!menuPurchase || !canReturnPurchase(menuPurchase)}
          onClick={() => {
            if (!menuPurchase) return;
            setRowMenuAnchor(null);
            navigateToReturn(menuPurchase);
          }}
        >
          <ReplayIcon fontSize="small" sx={{ mr: 1 }} /> Return purchase
        </MenuItem>
        <MenuItem
          disabled={!menuPurchase || printActionBusy}
          onClick={async () => {
            if (!menuPurchase) return;
            setPrintActionBusy(true);
            try {
              await printPurchaseInvoiceAsync(menuPurchase.id);
            } catch (err: unknown) {
              enqueueSnackbar(
                getFriendlyErrorMessage(err, "Could not print purchase invoice"),
                { variant: "error" }
              );
            } finally {
              setPrintActionBusy(false);
              setRowMenuAnchor(null);
              setMenuPurchase(null);
            }
          }}
        >
          <PrintIcon fontSize="small" sx={{ mr: 1 }} /> Print invoice
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (!menuPurchase) return;
            setRowMenuAnchor(null);
            deleteConfirm.requestDelete({
              title: "Delete purchase",
              message: `Delete purchase "${menuPurchase.invoice_id}"? This cannot be undone.`,
              onConfirm: () => deleteMutation.mutate(menuPurchase.id),
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

export default PurchasingDashboard;
