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
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { Link, useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLiveQuery } from "../../../hooks/useLiveQuery";
import { invalidatePosQueries } from "../../../utils/invalidatePosQueries";
import { useSnackbar } from "notistack";
import { deleteShipment, getShipments, type Shipment } from "../../../api/shippingApi";
import { getFriendlyErrorMessage } from "../../../utils/getFriendlyErrorMessage";
import { SHIPMENT_STATUSES } from "./shippingConstants";
import { formatShippingRs, SHIPPING_BASE } from "./shippingFormUtils";
import ShippingDashboardTableRow from "./ShippingDashboardTableRow";
import { defaultDateRange, headerBtnSx, summaryCardSx } from "../shared/dashboardShared";
import PosConfirmDeleteDialog from "../shared/PosConfirmDeleteDialog";
import { useConfirmDelete } from "../shared/useConfirmDelete";

const ShippingDashboard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const deleteConfirm = useConfirmDelete();

  const initialDates = defaultDateRange();
  const [location, setLocation] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date>(initialDates.dateFrom);
  const [dateTo, setDateTo] = useState<Date>(initialDates.dateTo);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [rowMenuAnchor, setRowMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuShipment, setMenuShipment] = useState<Shipment | null>(null);

  const dateFromStr = format(dateFrom, "yyyy-MM-dd");
  const dateToStr = format(dateTo, "yyyy-MM-dd");

  const { data, isLoading, isError, error, isFetching } = useLiveQuery({
    queryKey: ["shipments", location, statusFilter, dateFromStr, dateToStr],
    queryFn: () => getShipments(location, statusFilter, dateFromStr, dateToStr),
  });

  const periodLabel =
    dateFromStr === dateToStr
      ? `Today (${format(dateFrom, "dd-MM-yyyy")})`
      : `${format(dateFrom, "dd-MM-yyyy")} — ${format(dateTo, "dd-MM-yyyy")}`;

  const shipments = data?.shipments ?? [];
  const summary = data?.summary ?? {
    total_shipments: 0,
    in_transit: 0,
    total_freight_cost: 0,
  };
  const locations = data?.locations ?? ["Main Location"];

  const paginated = useMemo(() => {
    const start = page * rowsPerPage;
    return shipments.slice(start, start + rowsPerPage);
  }, [shipments, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [location, statusFilter, dateFromStr, dateToStr]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(shipments.length / rowsPerPage) - 1);
    if (page > maxPage) setPage(maxPage);
  }, [shipments.length, page, rowsPerPage]);

  const setToday = () => {
    const today = startOfDay(new Date());
    setDateFrom(today);
    setDateTo(today);
  };

  const deleteMutation = useMutation({
    mutationFn: deleteShipment,
    onSuccess: () => {
      invalidatePosQueries(queryClient);
      enqueueSnackbar("Shipment deleted", { variant: "success" });
      setRowMenuAnchor(null);
      setMenuShipment(null);
    },
    onError: (err: unknown) => {
      enqueueSnackbar(getFriendlyErrorMessage(err, "Failed to delete shipment"), {
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
          Shipping Dashboard
          {isFetching && !isLoading && (
            <Typography component="span" variant="caption" sx={{ ml: 1, color: "text.secondary" }}>
              (updating…)
            </Typography>
          )}
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          <Button
            component={Link}
            to={`${SHIPPING_BASE}/new`}
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              bgcolor: "var(--pallet-blue)",
              "&:hover": { bgcolor: "var(--pallet-main-blue)" },
            }}
          >
            Add Shipment
          </Button>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        Track shipments linked to sales. Expand a row for freight and delivery details.
      </Alert>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
        <Box sx={summaryCardSx}>
          <Typography variant="caption" color="text.secondary">
            Total shipments
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {isLoading ? "—" : summary.total_shipments}
          </Typography>
        </Box>
        <Box sx={summaryCardSx}>
          <Typography variant="caption" color="text.secondary">
            In transit
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: "info.main" }}>
            {isLoading ? "—" : summary.in_transit}
          </Typography>
        </Box>
        <Box sx={summaryCardSx}>
          <Typography variant="caption" color="text.secondary">
            Total freight cost
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: "var(--pallet-blue)" }}>
            {isLoading ? "—" : formatShippingRs(summary.total_freight_cost)}
          </Typography>
        </Box>
      </Box>

      <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: "var(--surface-bg-alt)" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <CalendarTodayIcon fontSize="small" color="action" />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{periodLabel}</Typography>
          <Button size="small" variant="text" onClick={setToday} sx={{ ml: 1 }}>Today</Button>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={2}>
            <DatePicker label="From" value={dateFrom} onChange={(d) => d && setDateFrom(d)} slotProps={{ textField: { size: "small", fullWidth: true } }} />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <DatePicker label="To" value={dateTo} onChange={(d) => d && setDateTo(d)} slotProps={{ textField: { size: "small", fullWidth: true } }} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl size="small" fullWidth>
              <InputLabel>Branch</InputLabel>
              <Select label="Branch" value={location} onChange={(e) => setLocation(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                {locations.map((loc) => <MenuItem key={loc} value={loc}>{loc}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                {SHIPMENT_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {isError && (
        <Typography color="error" sx={{ mb: 2 }}>
          {getFriendlyErrorMessage(error, "Failed to load shipments")}
        </Typography>
      )}

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: "1px solid var(--surface-border)", borderRadius: 1 }}
      >
        <Table size="small" stickyHeader>
          <TableHead sx={{ bgcolor: "var(--surface-bg-alt)" }}>
            <TableRow>
              <TableCell width={48} />
              <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Shipment No</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Sales No</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Branch</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Freight</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} sx={{ color: "var(--pallet-blue)" }} />
                </TableCell>
              </TableRow>
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  No shipments for the selected period.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((row) => (
                <ShippingDashboardTableRow
                  key={row.id}
                  shipment={row}
                  onOpenMenu={(e, shipment) => {
                    setRowMenuAnchor(e.currentTarget);
                    setMenuShipment(shipment);
                  }}
                />
              ))
            )}
          </TableBody>
        </Table>
        {!isLoading && shipments.length > 0 && (
          <TablePagination
            component="div"
            count={shipments.length}
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
      </TableContainer>

      <Menu
        anchorEl={rowMenuAnchor}
        open={Boolean(rowMenuAnchor)}
        onClose={() => {
          setRowMenuAnchor(null);
          setMenuShipment(null);
        }}
      >
        <MenuItem
          onClick={() => {
            if (menuShipment) navigate(`${SHIPPING_BASE}/${menuShipment.id}/edit`);
            setRowMenuAnchor(null);
          }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (!menuShipment) return;
            setRowMenuAnchor(null);
            deleteConfirm.requestDelete({
              title: "Delete shipment",
              message: `Delete shipment "${menuShipment.shipment_no}"? This cannot be undone.`,
              onConfirm: () => deleteMutation.mutate(menuShipment.id),
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

export default ShippingDashboard;
