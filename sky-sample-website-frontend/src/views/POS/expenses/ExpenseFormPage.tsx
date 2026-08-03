import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import { Link, useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import PageTitle from "../../../components/PageTitle";
import {
  createExpense,
  getExpense,
  getExpenses,
  getNextExpenseReferenceNo,
  updateExpense,
  type ExpensePayload,
} from "../../../api/expensesApi";
import { getFriendlyErrorMessage } from "../../../utils/getFriendlyErrorMessage";
import { getExpenseCategories } from "../../../api/expenseCategoriesApi";
import ExpenseCategoryFormDialog from "./ExpenseCategoryFormDialog";
import { ExpenseSection, fieldSx } from "./ExpenseFormComponents";
import { emptyExpenseForm, EXPENSES_BASE, formatExpenseRs } from "./expenseFormUtils";

const pageSx = {
  width: "100%",
  p: { xs: 2, sm: 3 },
  pb: 10,
  boxSizing: "border-box" as const,
};

const ExpenseFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const expenseId = isNew ? null : Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [form, setForm] = useState<ExpensePayload>(emptyExpenseForm());
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [errors, setErrors] = useState<{
    reference_no?: string;
    category?: string;
    description?: string;
    amount?: string;
    expense_date?: string;
  }>({});

  const { data: filterData } = useQuery({
    queryKey: ["expenses", "form-filters"],
    queryFn: () => getExpenses("all"),
  });

  const { data: categoryRows = [] } = useQuery({
    queryKey: ["expense-categories"],
    queryFn: getExpenseCategories,
  });

  const categories = useMemo(() => {
    const names = categoryRows.map((c) => c.name);
    if (form.category && !names.includes(form.category)) {
      return [...names, form.category];
    }
    return names.length > 0 ? names : ["Other"];
  }, [categoryRows, form.category]);
  const locations = useMemo(() => {
    const locs = filterData?.locations ?? ["Main Location"];
    if (form.location && !locs.includes(form.location)) {
      return [...locs, form.location];
    }
    return locs;
  }, [filterData?.locations, form.location]);
  const paymentMethods = filterData?.payment_methods ?? ["Cash"];
  const statuses = filterData?.statuses ?? ["Approved", "Pending", "Rejected"];

  const {
    data: existing,
    isLoading: loadingExpense,
    isError: loadError,
    error: loadErr,
  } = useQuery({
    queryKey: ["expense", expenseId],
    queryFn: () => getExpense(expenseId!),
    enabled: expenseId != null && !Number.isNaN(expenseId),
  });

  useEffect(() => {
    if (!isNew) return;
    getNextExpenseReferenceNo()
      .then((ref) => setForm((prev) => ({ ...prev, reference_no: ref })))
      .catch(() => {});
  }, [isNew]);

  useEffect(() => {
    if (!existing) return;
    setForm({
      location: existing.location,
      expense_date: existing.expense_date,
      reference_no: existing.reference_no,
      category: existing.category,
      description: existing.description,
      amount: existing.amount,
      discount: existing.discount,
      payment_method: existing.payment_method,
      status: existing.status,
      notes: existing.notes ?? "",
    });
  }, [existing]);

  const paidAmount = Math.max(0, (form.amount ?? 0) - (form.discount ?? 0));

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isNew) return createExpense(form);
      return updateExpense(expenseId!, form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      enqueueSnackbar(isNew ? "Expense saved" : "Expense updated", { variant: "success" });
      navigate(EXPENSES_BASE);
    },
    onError: (err: unknown) => {
      enqueueSnackbar(getFriendlyErrorMessage(err, "Failed to save expense"), {
        variant: "error",
      });
    },
  });

  const setField = <K extends keyof ExpensePayload>(key: K, value: ExpensePayload[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!form.reference_no?.trim()) next.reference_no = "Reference is required";
    if (!form.category?.trim()) next.category = "Category is required";
    if (!form.description?.trim()) next.description = "Description is required";
    if (!form.expense_date) next.expense_date = "Date is required";
    if (!form.amount || form.amount <= 0) next.amount = "Amount must be greater than zero";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  if (!isNew && loadingExpense) {
    return (
      <Box sx={{ ...pageSx, display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress sx={{ color: "var(--pallet-blue)" }} />
      </Box>
    );
  }

  if (!isNew && loadError) {
    return (
      <Box sx={pageSx}>
        <Alert severity="error">
          {getFriendlyErrorMessage(loadErr, "Expense not found")}
        </Alert>
        <Button component={Link} to={EXPENSES_BASE} sx={{ mt: 2 }}>
          Back to expenses
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={pageSx}>
      <PageTitle
        title={isNew ? "Add Expense" : "Edit Expense"}
        subtitle={isNew ? "Payment posts automatically when status is Approved" : form.reference_no}
      />

      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <Button
          component={Link}
          to={EXPENSES_BASE}
          startIcon={<ArrowBackIcon />}
          variant="outlined"
          sx={{ textTransform: "none" }}
        >
          Back
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={() => {
            if (validate()) saveMutation.mutate();
          }}
          disabled={saveMutation.isPending}
          sx={{ textTransform: "none", bgcolor: "var(--pallet-blue)" }}
        >
          {saveMutation.isPending ? "Saving…" : "Save"}
        </Button>
      </Box>

      {form.status !== "Approved" && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Only <strong>Approved</strong> expenses appear on the Payment Dashboard.
        </Alert>
      )}

      <ExpenseSection title="Expense details">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Reference No"
              value={form.reference_no}
              onChange={(e) => setField("reference_no", e.target.value)}
              error={Boolean(errors.reference_no)}
              helperText={errors.reference_no}
              sx={fieldSx}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Date"
              type="date"
              value={form.expense_date ?? ""}
              onChange={(e) => setField("expense_date", e.target.value)}
              InputLabelProps={{ shrink: true }}
              error={Boolean(errors.expense_date)}
              helperText={errors.expense_date}
              sx={fieldSx}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small" sx={fieldSx}>
              <InputLabel>Location</InputLabel>
              <Select
                label="Location"
                value={form.location ?? "Main Location"}
                onChange={(e) => setField("location", e.target.value)}
              >
                {locations.map((loc) => (
                  <MenuItem key={loc} value={loc}>
                    {loc}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 0.5,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Category
                </Typography>
                <Button
                  type="button"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => setCategoryDialogOpen(true)}
                  sx={{ textTransform: "none", minWidth: 0, py: 0 }}
                >
                  Add category
                </Button>
              </Box>
              <FormControl fullWidth size="small" sx={fieldSx} error={Boolean(errors.category)}>
                <InputLabel>Category</InputLabel>
                <Select
                  label="Category"
                  value={categories.includes(form.category) ? form.category : ""}
                  onChange={(e) => setField("category", e.target.value)}
                >
                  {categories.map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </Select>
                {errors.category && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                    {errors.category}
                  </Typography>
                )}
              </FormControl>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Description"
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              error={Boolean(errors.description)}
              helperText={errors.description}
              sx={fieldSx}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small" sx={fieldSx}>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={form.status ?? "Approved"}
                onChange={(e) => setField("status", e.target.value)}
              >
                {statuses.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small" sx={fieldSx}>
              <InputLabel>Payment Method</InputLabel>
              <Select
                label="Payment Method"
                value={form.payment_method ?? "Cash"}
                onChange={(e) => setField("payment_method", e.target.value)}
              >
                {paymentMethods.map((m) => (
                  <MenuItem key={m} value={m}>
                    {m}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </ExpenseSection>

      <ExpenseSection title="Amount">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Amount (Rs)"
              type="number"
              value={form.amount ?? 0}
              onChange={(e) => setField("amount", parseFloat(e.target.value) || 0)}
              InputProps={{
                startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
              }}
              inputProps={{ min: 0.01, step: 0.01 }}
              error={Boolean(errors.amount)}
              helperText={errors.amount}
              sx={fieldSx}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Discount (Rs)"
              type="number"
              value={form.discount ?? 0}
              onChange={(e) => setField("discount", parseFloat(e.target.value) || 0)}
              InputProps={{
                startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
              }}
              inputProps={{ min: 0, step: 0.01 }}
              sx={fieldSx}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body2" color="text.secondary" sx={{ pt: 1 }}>
              Paid to payment table: <strong>{formatExpenseRs(paidAmount)}</strong>
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Notes"
              multiline
              minRows={2}
              value={form.notes ?? ""}
              onChange={(e) => setField("notes", e.target.value)}
              sx={fieldSx}
            />
          </Grid>
        </Grid>
      </ExpenseSection>

      <ExpenseCategoryFormDialog
        open={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        onSaved={({ name }) => {
          setField("category", name);
          enqueueSnackbar("Category added", { variant: "success" });
        }}
      />
    </Box>
  );
};

export default ExpenseFormPage;
