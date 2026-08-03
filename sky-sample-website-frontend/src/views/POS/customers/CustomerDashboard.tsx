import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
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
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import PaymentsIcon from "@mui/icons-material/Payments";
import PeopleIcon from "@mui/icons-material/People";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { useNavigate } from "react-router";
import { buildPosSaleUrl, savePosSelectedCustomer } from "../sales/posCustomerSelection";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLiveQuery } from "../../../hooks/useLiveQuery";
import { invalidatePosQueries } from "../../../utils/invalidatePosQueries";
import { useSnackbar } from "notistack";
import {
  deleteCustomer,
  getCustomers,
  type Customer,
  type CustomerOrderBy,
  type CustomerSort,
} from "../../../api/customersApi";
import { getFriendlyErrorMessage } from "../../../utils/getFriendlyErrorMessage";
import { formatDashboardRs } from "../shared/dashboardShared";
import PosConfirmDeleteDialog from "../shared/PosConfirmDeleteDialog";
import { useConfirmDelete } from "../shared/useConfirmDelete";
import CustomerReceivePaymentDialog from "./CustomerReceivePaymentDialog";
import {
  BalanceChip,
  DashboardFilterPanel,
  DashboardHero,
  DashboardHeroButton,
  DashboardPage,
  ModernSummaryCard,
  ModernTableContainer,
  SummaryCardsRow,
  modernHeaderBtnSx,
} from "../shared/ModernDashboardComponents";

const CUSTOMERS_BASE = "/customers";

const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const deleteConfirm = useConfirmDelete();

  const [location, setLocation] = useState("all");
  const [orderBy, setOrderBy] = useState<CustomerOrderBy>("customer_id");
  const [sortBy, setSortBy] = useState<CustomerSort>("asc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [rowMenuAnchor, setRowMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuCustomer, setMenuCustomer] = useState<Customer | null>(null);
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);

  const { data, isLoading, isError, error, isFetching } = useLiveQuery({
    queryKey: ["customers", location, orderBy, sortBy],
    queryFn: () => getCustomers(location, orderBy, sortBy),
  });

  const customers = data?.customers ?? [];
  const summary = data?.summary ?? { total_customers: 0, debtor_count: 0, total_receivables: 0 };
  const locations = data?.locations ?? ["Main Location"];

  const paginated = useMemo(() => {
    const start = page * rowsPerPage;
    return customers.slice(start, start + rowsPerPage);
  }, [customers, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [location, orderBy, sortBy]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(customers.length / rowsPerPage) - 1);
    if (page > maxPage) setPage(maxPage);
  }, [customers.length, page, rowsPerPage]);

  const deleteMutation = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      invalidatePosQueries(queryClient);
      enqueueSnackbar("Customer deleted", { variant: "success" });
      setRowMenuAnchor(null);
      setMenuCustomer(null);
    },
    onError: (err: unknown) => {
      enqueueSnackbar(getFriendlyErrorMessage(err, "Failed to delete customer"), { variant: "error" });
    },
  });

  return (
    <DashboardPage sx={{ maxWidth: 1600 }}>
      <DashboardHero
        title="Customers"
        subtitle="Manage customers, credit sales, and collect outstanding payments"
        gradient="linear-gradient(135deg, #0f172a 0%, #1d4ed8 50%, #60a5fa 100%)"
        isLive
        isFetching={isFetching}
        lastUpdated={isFetching ? "updating…" : "synced"}
        actions={
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => navigate(`${CUSTOMERS_BASE}/new`)}
              sx={{
                ...modernHeaderBtnSx,
                color: "#fff",
                borderColor: "rgba(255,255,255,0.35)",
                bgcolor: "rgba(255,255,255,0.08)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.16)", borderColor: "#fff" },
              }}
            >
              Add Customer
            </Button>
            <DashboardHeroButton startIcon={<PointOfSaleIcon />} onClick={() => navigate("/sales/new")}>
              New Sale
            </DashboardHeroButton>
          </Box>
        }
      />

      <SummaryCardsRow>
        <ModernSummaryCard
          label="Customers"
          description="Total registered"
          value={summary.total_customers}
          accent="#2563eb"
          icon={<PeopleIcon />}
          loading={isLoading}
        />
        <ModernSummaryCard
          label="Debtors"
          description="With outstanding balance"
          value={summary.debtor_count}
          accent="#d97706"
          icon={<WarningAmberIcon />}
          loading={isLoading}
          highlight={summary.debtor_count > 0}
        />
        <ModernSummaryCard
          label="Receivables"
          description="Total credit outstanding"
          value={isLoading ? "—" : formatDashboardRs(summary.total_receivables)}
          accent="#dc2626"
          icon={<AccountBalanceWalletIcon />}
          loading={isLoading}
          highlight={summary.total_receivables > 0}
        />
      </SummaryCardsRow>

      <DashboardFilterPanel>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
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
          <Grid item xs={12} sm={4}>
            <FormControl size="small" fullWidth>
              <InputLabel>Order By</InputLabel>
              <Select label="Order By" value={orderBy} onChange={(e) => setOrderBy(e.target.value as CustomerOrderBy)}>
                <MenuItem value="customer_id">Customer ID</MenuItem>
                <MenuItem value="customer_name">Name</MenuItem>
                <MenuItem value="contact_no">Contact</MenuItem>
                <MenuItem value="credit_limit">Credit limit</MenuItem>
                <MenuItem value="net_balance">Net balance</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl size="small" fullWidth>
              <InputLabel>Sort</InputLabel>
              <Select label="Sort" value={sortBy} onChange={(e) => setSortBy(e.target.value as CustomerSort)}>
                <MenuItem value="asc">Ascending</MenuItem>
                <MenuItem value="desc">Descending</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DashboardFilterPanel>

      {isError && (
        <Typography color="error" sx={{ mb: 2 }}>
          {getFriendlyErrorMessage(error, "Failed to load customers")}
        </Typography>
      )}

      <ModernTableContainer>
        <TableContainer>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)" }}>Customer ID</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)" }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)" }}>Contact</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)" }}>Branch</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)" }}>
                  Credit Limit
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)" }}>
                  Net Balance
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)" }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                    <CircularProgress size={28} sx={{ color: "var(--pallet-blue)" }} />
                  </TableCell>
                </TableRow>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5, color: "text.secondary" }}>
                    No customers for the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((c) => (
                  <TableRow key={c.id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                    <TableCell sx={{ fontWeight: 700, color: "#1e40af" }}>{c.customer_id}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{c.customer_name}</TableCell>
                    <TableCell>{c.contact_no}</TableCell>
                    <TableCell>{c.location ?? c.inventory_location ?? "—"}</TableCell>
                    <TableCell align="right">{formatDashboardRs(c.credit_limit)}</TableCell>
                    <TableCell align="right">
                      <BalanceChip amount={c.net_balance} />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          setRowMenuAnchor(e.currentTarget);
                          setMenuCustomer(c);
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
        </TableContainer>
        {!isLoading && customers.length > 0 && (
          <TablePagination
            component="div"
            count={customers.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        )}
      </ModernTableContainer>

      <Menu
        anchorEl={rowMenuAnchor}
        open={Boolean(rowMenuAnchor)}
        onClose={() => {
          setRowMenuAnchor(null);
          setMenuCustomer(null);
        }}
        PaperProps={{ sx: { borderRadius: 2.5, minWidth: 180, boxShadow: "0 12px 40px rgba(15,23,42,0.12)" } }}
      >
        <MenuItem
          onClick={() => {
            if (menuCustomer) setPaymentCustomer(menuCustomer);
            setRowMenuAnchor(null);
            setMenuCustomer(null);
          }}
          disabled={!menuCustomer || (menuCustomer?.net_balance ?? 0) <= 0}
        >
          <PaymentsIcon fontSize="small" sx={{ mr: 1, color: "#059669" }} /> Receive payment
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuCustomer) {
              savePosSelectedCustomer(menuCustomer);
              navigate(buildPosSaleUrl(menuCustomer.id));
            }
            setRowMenuAnchor(null);
          }}
        >
          <PointOfSaleIcon fontSize="small" sx={{ mr: 1, color: "#2563eb" }} /> New sale
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuCustomer) navigate(`${CUSTOMERS_BASE}/${menuCustomer.id}/edit`);
            setRowMenuAnchor(null);
          }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (!menuCustomer) return;
            setRowMenuAnchor(null);
            setMenuCustomer(null);
            deleteConfirm.requestDelete({
              title: "Delete customer",
              message: `Delete "${menuCustomer.customer_name}"? This cannot be undone.`,
              onConfirm: () => deleteMutation.mutate(menuCustomer.id),
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

      <CustomerReceivePaymentDialog
        open={Boolean(paymentCustomer)}
        customer={paymentCustomer}
        onClose={() => setPaymentCustomer(null)}
        onSuccess={(result) => {
          invalidatePosQueries(queryClient);
          enqueueSnackbar(`Payment recorded — new balance ${formatDashboardRs(result.new_balance)}`, {
            variant: "success",
          });
        }}
      />
    </DashboardPage>
  );
};

export default CustomerDashboard;
