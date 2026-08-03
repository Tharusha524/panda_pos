import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
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
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { Link, useNavigate } from "react-router";
import { buildPosSaleUrl, savePosSelectedCustomer } from "../sales/posCustomerSelection";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import {
  deleteCustomer,
  getCustomers,
  type Customer,
  type CustomerOrderBy,
  type CustomerSort,
} from "../../../api/customersApi";
import { getFriendlyErrorMessage } from "../../../utils/getFriendlyErrorMessage";
import PosConfirmDeleteDialog from "../shared/PosConfirmDeleteDialog";
import { useConfirmDelete } from "../shared/useConfirmDelete";

const CUSTOMERS_BASE = "/customers";

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

const CustomersList: React.FC = () => {
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

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["customers", location, orderBy, sortBy],
    queryFn: () => getCustomers(location, orderBy, sortBy),
  });

  const customers = data?.customers ?? [];
  const summary = data?.summary ?? { total_customers: 0, total_receivables: 0 };

  const locations = data?.locations ?? ["Main Location"];

  const paginatedCustomers = useMemo(() => {
    const start = page * rowsPerPage;
    return customers.slice(start, start + rowsPerPage);
  }, [customers, page, rowsPerPage]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(customers.length / rowsPerPage) - 1);
    if (page > maxPage) setPage(maxPage);
  }, [customers.length, page, rowsPerPage]);

  const deleteMutation = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      enqueueSnackbar("Customer deleted", { variant: "success" });
      setRowMenuAnchor(null);
      setMenuCustomer(null);
    },
    onError: (err: unknown) => {
      enqueueSnackbar(getFriendlyErrorMessage(err, "Failed to delete customer"), {
        variant: "error",
      });
    },
  });

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
          Customer Dashboard
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          <Button variant="outlined" endIcon={<KeyboardArrowDownIcon />} sx={headerBtnSx} disabled>
            View summary
          </Button>
          <Button variant="outlined" startIcon={<HelpOutlineIcon />} sx={headerBtnSx} disabled>
            Help
          </Button>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            sx={headerBtnSx}
            onClick={() => navigate(`${CUSTOMERS_BASE}/new`)}
          >
            Add
          </Button>
          <Button
            variant="contained"
            startIcon={<PointOfSaleIcon />}
            onClick={() => navigate("/sales/new")}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              bgcolor: "var(--pallet-blue)",
              "&:hover": { bgcolor: "var(--pallet-main-blue)" },
            }}
          >
            Go to Sales
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
        <Box sx={summaryCardSx}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase" }}>
            total
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No of Customer
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>
            {isLoading ? "—" : summary.total_customers}
          </Typography>
        </Box>
        <Box sx={summaryCardSx}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase" }}>
            total
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total Receivables
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color: "var(--pallet-blue)" }}>
            {isLoading ? "—" : formatRs(summary.total_receivables)}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 2,
          mb: 2,
        }}
      >
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Location</InputLabel>
          <Select
            label="Location"
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="all">All</MenuItem>
            {locations.map((loc) => (
              <MenuItem key={loc} value={loc}>
                {loc}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Order By</InputLabel>
          <Select
            label="Order By"
            value={orderBy}
            onChange={(e) => {
              setOrderBy(e.target.value as CustomerOrderBy);
              setPage(0);
            }}
          >
            <MenuItem value="customer_id">customer_id</MenuItem>
            <MenuItem value="customer_name">customer_name</MenuItem>
            <MenuItem value="contact_no">contact_no</MenuItem>
            <MenuItem value="credit_limit">credit_limit</MenuItem>
            <MenuItem value="net_balance">net_balance</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            label="Sort By"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as CustomerSort);
              setPage(0);
            }}
          >
            <MenuItem value="asc">asc</MenuItem>
            <MenuItem value="desc">desc</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {isError && (
        <Typography color="error" sx={{ mb: 2 }}>
          {getFriendlyErrorMessage(error, "Failed to load customers")}
        </Typography>
      )}

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: "1px solid var(--surface-border)", borderRadius: 1 }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "var(--surface-bg-alt)" }}>
              <TableCell sx={{ fontWeight: 700 }}>Customer ID</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Contact No</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                Credit Limit (Rs)
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                Net Balance (Rs)
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, width: 80 }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} sx={{ color: "var(--pallet-blue)" }} />
                </TableCell>
              </TableRow>
            ) : paginatedCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  No customers yet. Click Add to create one.
                </TableCell>
              </TableRow>
            ) : (
              paginatedCustomers.map((customer) => (
                <TableRow key={customer.id} hover>
                  <TableCell>{customer.customer_id}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{customer.customer_name}</TableCell>
                  <TableCell>{customer.contact_no}</TableCell>
                  <TableCell align="right">{formatRs(customer.credit_limit)}</TableCell>
                  <TableCell align="right">{formatRs(customer.net_balance)}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRowMenuAnchor(e.currentTarget);
                        setMenuCustomer(customer);
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
            rowsPerPageOptions={[10, 25, 50]}
            labelRowsPerPage="Rows per page:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} of ${count}`
            }
            sx={{ borderTop: "1px solid var(--surface-border)" }}
          />
        )}
      </TableContainer>

      <Menu
        anchorEl={rowMenuAnchor}
        open={Boolean(rowMenuAnchor)}
        onClose={() => {
          setRowMenuAnchor(null);
          setMenuCustomer(null);
        }}
      >
        <MenuItem
          onClick={() => {
            if (menuCustomer) {
              savePosSelectedCustomer(menuCustomer);
              navigate(buildPosSaleUrl(menuCustomer.id));
            }
            setRowMenuAnchor(null);
          }}
        >
          <PointOfSaleIcon fontSize="small" sx={{ mr: 1 }} /> Go to sale
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
    </Box>
  );
};

export default CustomersList;
