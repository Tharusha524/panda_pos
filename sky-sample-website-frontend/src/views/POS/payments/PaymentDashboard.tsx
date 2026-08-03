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
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLiveQuery } from "../../../hooks/useLiveQuery";
import { invalidatePosQueries } from "../../../utils/invalidatePosQueries";
import { useSnackbar } from "notistack";
import { deletePayment, getPayments, type Payment } from "../../../api/paymentsApi";
import { getFriendlyErrorMessage } from "../../../utils/getFriendlyErrorMessage";
import {
  DEFAULT_PAYMENT_TYPE,
  PAYMENT_METHOD_ALL,
} from "./paymentConstants";
import { formatPaymentRs, PAYMENTS_BASE } from "./paymentFormUtils";
import PaymentDashboardTableRow from "./PaymentDashboardTableRow";
import PosConfirmDeleteDialog from "../shared/PosConfirmDeleteDialog";
import { useConfirmDelete } from "../shared/useConfirmDelete";

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
  minWidth: 180,
  p: 2,
  border: "1px solid var(--surface-border)",
  borderRadius: 1,
  bgcolor: "var(--surface-bg)",
};

function defaultDateRange() {
  const today = startOfDay(new Date());
  return { dateFrom: today, dateTo: today };
}

const PaymentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const deleteConfirm = useConfirmDelete();

  const initialDates = defaultDateRange();
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHOD_ALL);
  const [paymentType, setPaymentType] = useState(DEFAULT_PAYMENT_TYPE);
  const [location, setLocation] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date>(initialDates.dateFrom);
  const [dateTo, setDateTo] = useState<Date>(initialDates.dateTo);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [rowMenuAnchor, setRowMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuPayment, setMenuPayment] = useState<Payment | null>(null);

  const dateFromStr = format(dateFrom, "yyyy-MM-dd");
  const dateToStr = format(dateTo, "yyyy-MM-dd");

  const { data, isLoading, isError, error, isFetching } = useLiveQuery({
    queryKey: ["payments", paymentMethod, paymentType, location, dateFromStr, dateToStr],
    queryFn: () => getPayments(paymentMethod, paymentType, location, dateFromStr, dateToStr),
  });

  const payments = data?.payments ?? [];
  const summary = data?.summary ?? {
    total_payment_amount: 0,
    total_received: 0,
    total_paid_out: 0,
    payment_count: 0,
  };
  const paymentTypes = data?.payment_types ?? [DEFAULT_PAYMENT_TYPE];
  const paymentMethods = data?.payment_methods ?? ["Cash"];
  const locations = data?.locations ?? ["Main Location"];

  const paginatedPayments = useMemo(() => {
    const start = page * rowsPerPage;
    return payments.slice(start, start + rowsPerPage);
  }, [payments, page, rowsPerPage]);

  const periodLabel =
    dateFromStr === dateToStr
      ? `Today (${format(dateFrom, "dd-MM-yyyy")})`
      : `${format(dateFrom, "dd-MM-yyyy")} — ${format(dateTo, "dd-MM-yyyy")}`;

  useEffect(() => {
    setPage(0);
  }, [paymentMethod, paymentType, location, dateFromStr, dateToStr]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(payments.length / rowsPerPage) - 1);
    if (page > maxPage) setPage(maxPage);
  }, [payments.length, page, rowsPerPage]);

  const deleteMutation = useMutation({
    mutationFn: deletePayment,
    onSuccess: () => {
      invalidatePosQueries(queryClient);
      enqueueSnackbar("Payment deleted", { variant: "success" });
      setRowMenuAnchor(null);
      setMenuPayment(null);
    },
    onError: (err: unknown) => {
      enqueueSnackbar(getFriendlyErrorMessage(err, "Failed to delete payment"), {
        variant: "error",
      });
    },
  });

  const setToday = () => {
    const today = startOfDay(new Date());
    setDateFrom(today);
    setDateTo(today);
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
          Payment Dashboard
          {isFetching && !isLoading && (
            <Typography component="span" variant="caption" sx={{ ml: 1, color: "text.secondary" }}>
              (updating…)
            </Typography>
          )}
        </Typography>
        <Button variant="outlined" startIcon={<HelpOutlineIcon />} sx={headerBtnSx} disabled>
          Help
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        Customer sales show as <strong>Income</strong>. Sales returns, purchases, expenses, and
        salaries show as <strong>Paid Out</strong> (money going out — like expenses). Expand a row for
        line details.
      </Alert>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
        <Box sx={summaryCardSx}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase" }}>
            received
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Customer sales only (not returns)
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: "success.main" }}>
            {isLoading ? "—" : formatPaymentRs(summary.total_received ?? 0)}
          </Typography>
        </Box>
        <Box sx={summaryCardSx}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase" }}>
            paid out
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Returns / Purchase / Expense / Salary
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: "error.main" }}>
            {isLoading ? "—" : formatPaymentRs(summary.total_paid_out ?? 0)}
          </Typography>
        </Box>
        <Box sx={summaryCardSx}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase" }}>
            total
          </Typography>
          <Typography variant="body2" color="text.secondary">
            All Payments · {isLoading ? "—" : summary.payment_count ?? 0} records
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: "var(--pallet-blue)" }}>
            {isLoading ? "—" : formatPaymentRs(summary.total_payment_amount)}
          </Typography>
        </Box>
      </Box>

      <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: "var(--surface-bg-alt)" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <CalendarTodayIcon fontSize="small" color="action" />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {periodLabel}
          </Typography>
          <Button size="small" variant="text" onClick={setToday} sx={{ ml: 1 }}>
            Today
          </Button>
        </Box>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2}>
            <DatePicker
              label="From"
              value={dateFrom}
              onChange={(d) => d && setDateFrom(d)}
              slotProps={{ textField: { size: "small", fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <DatePicker
              label="To"
              value={dateTo}
              onChange={(d) => d && setDateTo(d)}
              slotProps={{ textField: { size: "small", fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.5}>
            <FormControl size="small" fullWidth>
              <InputLabel>Payment Method</InputLabel>
              <Select
                label="Payment Method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <MenuItem value={PAYMENT_METHOD_ALL}>All methods</MenuItem>
                {paymentMethods.map((m) => (
                  <MenuItem key={m} value={m}>
                    {m}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Payment Type</InputLabel>
              <Select
                label="Payment Type"
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                {paymentTypes.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
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
        </Grid>
      </Paper>

      {isError && (
        <Typography color="error" sx={{ mb: 2 }}>
          {getFriendlyErrorMessage(error, "Failed to load payments")}
        </Typography>
      )}

      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead sx={{ bgcolor: "var(--surface-bg-alt)" }}>
            <TableRow>
              <TableCell width={48} />
              <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Reference</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Direction</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Receipt Type</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Source</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Method</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Branch</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Discount (Rs)
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Amount (Rs)
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
            ) : paginatedPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  No payments for the selected date or filters.
                </TableCell>
              </TableRow>
            ) : (
              paginatedPayments.map((row) => (
                <PaymentDashboardTableRow
                  key={row.id}
                  payment={row}
                  onOpenMenu={(e, payment) => {
                    setRowMenuAnchor(e.currentTarget);
                    setMenuPayment(payment);
                  }}
                />
              ))
            )}
          </TableBody>
        </Table>
        {!isLoading && payments.length > 0 && (
          <TablePagination
            component="div"
            count={payments.length}
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
          setMenuPayment(null);
        }}
      >
        <MenuItem
          onClick={() => {
            if (menuPayment) navigate(`${PAYMENTS_BASE}/${menuPayment.id}/edit`);
            setRowMenuAnchor(null);
            setMenuPayment(null);
          }}
          disabled={!menuPayment}
        >
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          {menuPayment?.source_type ? "View" : "Edit"}
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (!menuPayment) return;
            setRowMenuAnchor(null);
            setMenuPayment(null);
            deleteConfirm.requestDelete({
              title: "Delete payment",
              message: `Delete payment "${menuPayment.sales_no}"? This cannot be undone.`,
              onConfirm: () => deleteMutation.mutate(menuPayment.id),
            });
          }}
          sx={{ color: "error.main" }}
          disabled={!menuPayment}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
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

export default PaymentDashboard;
