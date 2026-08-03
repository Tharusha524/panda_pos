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
import CategoryIcon from "@mui/icons-material/Category";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLiveQuery } from "../../../hooks/useLiveQuery";
import { invalidatePosQueries } from "../../../utils/invalidatePosQueries";
import { useSnackbar } from "notistack";
import { deleteExpense, getExpenses, type Expense } from "../../../api/expensesApi";
import { getFriendlyErrorMessage } from "../../../utils/getFriendlyErrorMessage";
import ExpenseCategoryFormDialog from "./ExpenseCategoryFormDialog";
import ExpenseDashboardTableRow from "./ExpenseDashboardTableRow";
import { EXPENSES_BASE, formatExpenseRs } from "./expenseFormUtils";
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

const ExpensesDashboard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const deleteConfirm = useConfirmDelete();

  const initialDates = defaultDateRange();
  const [location, setLocation] = useState("all");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date>(initialDates.dateFrom);
  const [dateTo, setDateTo] = useState<Date>(initialDates.dateTo);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [rowMenuAnchor, setRowMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuExpense, setMenuExpense] = useState<Expense | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  const dateFromStr = format(dateFrom, "yyyy-MM-dd");
  const dateToStr = format(dateTo, "yyyy-MM-dd");

  const { data, isLoading, isError, error, isFetching } = useLiveQuery({
    queryKey: [
      "expenses",
      location,
      dateFromStr,
      dateToStr,
      category,
      status,
      paymentMethod,
    ],
    queryFn: () =>
      getExpenses(location, dateFromStr, dateToStr, category, status, paymentMethod),
  });

  const expenses = data?.expenses ?? [];
  const summary = data?.summary ?? {
    total_expenses: 0,
    total_expense_amount: 0,
    total_approved_amount: 0,
    pending_count: 0,
  };
  const categories = data?.categories ?? [];
  const locations = data?.locations ?? ["Main Location"];
  const statuses = data?.statuses ?? ["Approved", "Pending", "Rejected"];
  const paymentMethods = data?.payment_methods ?? ["Cash"];

  const paginated = useMemo(() => {
    const start = page * rowsPerPage;
    return expenses.slice(start, start + rowsPerPage);
  }, [expenses, page, rowsPerPage]);

  const periodLabel =
    dateFromStr === dateToStr
      ? `Today (${format(dateFrom, "dd-MM-yyyy")})`
      : `${format(dateFrom, "dd-MM-yyyy")} — ${format(dateTo, "dd-MM-yyyy")}`;

  useEffect(() => {
    setPage(0);
  }, [location, dateFromStr, dateToStr, category, status, paymentMethod]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(expenses.length / rowsPerPage) - 1);
    if (page > maxPage) setPage(maxPage);
  }, [expenses.length, page, rowsPerPage]);

  const deleteMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      invalidatePosQueries(queryClient);
      enqueueSnackbar("Expense deleted", { variant: "success" });
      setRowMenuAnchor(null);
      setMenuExpense(null);
    },
    onError: (err: unknown) => {
      enqueueSnackbar(getFriendlyErrorMessage(err, "Failed to delete expense"), {
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
          Expense Dashboard
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
            startIcon={<CategoryIcon />}
            sx={headerBtnSx}
            onClick={() => setCategoryDialogOpen(true)}
          >
            Categories
          </Button>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            sx={headerBtnSx}
            onClick={() => navigate(`${EXPENSES_BASE}/new`)}
          >
            Add Expense
          </Button>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        <strong>Approved</strong> expenses are posted to the Payment Dashboard as paid out. Pending or
        rejected expenses are not paid until approved. Expand a row for amount breakdown.
      </Alert>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
        <Box sx={summaryCardSx}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase" }}>
            approved
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Posted to payments (paid out)
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: "error.main" }}>
            {isLoading ? "—" : formatExpenseRs(summary.total_approved_amount ?? 0)}
          </Typography>
        </Box>
        <Box sx={summaryCardSx}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase" }}>
            total
          </Typography>
          <Typography variant="body2" color="text.secondary">
            All statuses · {isLoading ? "—" : summary.total_expenses ?? 0} records
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: "var(--pallet-blue)" }}>
            {isLoading ? "—" : formatExpenseRs(summary.total_expense_amount)}
          </Typography>
        </Box>
        <Box sx={summaryCardSx}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase" }}>
            pending
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Awaiting approval
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: "warning.main" }}>
            {isLoading ? "—" : summary.pending_count ?? 0}
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
          <Grid item xs={12} sm={6} md={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Category</InputLabel>
              <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                {categories.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                {statuses.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Payment Method</InputLabel>
              <Select
                label="Payment Method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
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
          {getFriendlyErrorMessage(error, "Failed to load expenses")}
        </Typography>
      )}

      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead sx={{ bgcolor: "var(--surface-bg-alt)" }}>
            <TableRow>
              <TableCell width={48} />
              <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Reference</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Method</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Branch</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Discount (Rs)
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Amount (Rs)
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} sx={{ color: "var(--pallet-blue)" }} />
                </TableCell>
              </TableRow>
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  No expenses for the selected date or filters.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((row) => (
                <ExpenseDashboardTableRow
                  key={row.id}
                  expense={row}
                  onOpenMenu={(e, expense) => {
                    setRowMenuAnchor(e.currentTarget);
                    setMenuExpense(expense);
                  }}
                />
              ))
            )}
          </TableBody>
        </Table>
        {!isLoading && expenses.length > 0 && (
          <TablePagination
            component="div"
            count={expenses.length}
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
          setMenuExpense(null);
        }}
      >
        <MenuItem
          onClick={() => {
            if (menuExpense) navigate(`${EXPENSES_BASE}/${menuExpense.id}/edit`);
            setRowMenuAnchor(null);
            setMenuExpense(null);
          }}
          disabled={!menuExpense}
        >
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (!menuExpense) return;
            setRowMenuAnchor(null);
            setMenuExpense(null);
            deleteConfirm.requestDelete({
              title: "Delete expense",
              message: `Delete expense "${menuExpense.reference_no}"? This cannot be undone.`,
              onConfirm: () => deleteMutation.mutate(menuExpense.id),
            });
          }}
          sx={{ color: "error.main" }}
          disabled={!menuExpense}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      <ExpenseCategoryFormDialog
        open={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
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

export default ExpensesDashboard;
