import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
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
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import PrintIcon from "@mui/icons-material/Print";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import { Link, useNavigate } from "react-router";
import { useLiveQuery } from "../../../hooks/useLiveQuery";
import { getRepairDashboard } from "../../../api/repairApi";
import { getFriendlyErrorMessage } from "../../../utils/getFriendlyErrorMessage";
import { formatDashboardRs, headerBtnSx } from "../shared/dashboardShared";

const REPAIR_BASE = "/repair";

function formatQty(qty: number): string {
  return qty.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const RepairDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState("Repair");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { data, isLoading, isError, error, isFetching } = useLiveQuery({
    queryKey: ["repairs", location],
    queryFn: () => getRepairDashboard(location),
  });

  const items = data?.items ?? [];
  const locations = data?.locations ?? ["Repair", "Main Location"];

  const paginated = useMemo(() => {
    const start = page * rowsPerPage;
    return items.slice(start, start + rowsPerPage);
  }, [items, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [location]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(items.length / rowsPerPage) - 1);
    if (page > maxPage) setPage(maxPage);
  }, [items.length, page, rowsPerPage]);

  const handlePrint = () => window.print();

  return (
    <Box sx={{ width: "100%", p: { xs: 2, sm: 3 }, boxSizing: "border-box" }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton component={Link} to="/dashboard" size="small" aria-label="Back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "var(--pallet-blue)" }}>
            Repair Dashboard
            {isFetching && !isLoading && (
              <Typography component="span" variant="caption" sx={{ ml: 1, color: "text.secondary" }}>
                (updating…)
              </Typography>
            )}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            sx={headerBtnSx}
            onClick={() => navigate(`${REPAIR_BASE}/send`)}
          >
            Send to repair center
          </Button>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            sx={headerBtnSx}
            onClick={() => navigate(`${REPAIR_BASE}/receive`)}
          >
            Receive from repair center
          </Button>
          <Button variant="outlined" sx={headerBtnSx} disabled>
            Take a tour
          </Button>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        Items at the <strong>Repair</strong> location are waiting for service. Use{" "}
        <strong>Send to repair center</strong> to move stock from a branch into Repair, or{" "}
        <strong>Receive from repair center</strong> to return fixed items back to a branch.
      </Alert>

      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end", alignItems: "center", gap: 2, mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Location</InputLabel>
          <Select label="Location" value={location} onChange={(e) => setLocation(e.target.value)}>
            {locations.map((loc) => (
              <MenuItem key={loc} value={loc}>
                {loc}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title="Columns">
            <IconButton size="small" disabled>
              <ViewColumnIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export">
            <IconButton size="small" disabled>
              <CloudDownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print">
            <IconButton size="small" onClick={handlePrint}>
              <PrintIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {isError && (
        <Typography color="error" sx={{ mb: 2 }}>
          {getFriendlyErrorMessage(error, "Failed to load repair items")}
        </Typography>
      )}

      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead sx={{ bgcolor: "var(--surface-bg-alt)" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Item Number</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Qty</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Last Purchase Price (Rs)</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Selling Price (Rs)</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} sx={{ color: "var(--pallet-blue)" }} />
                </TableCell>
              </TableRow>
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  No items at this repair location. Use Send to repair center to move items here from a branch,
                  or Receive from repair center to return fixed items to stock.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{row.item_number}</TableCell>
                  <TableCell>{row.description}</TableCell>
                  <TableCell>{row.category ?? "—"}</TableCell>
                  <TableCell align="right">{formatQty(row.qty)}</TableCell>
                  <TableCell align="right">{formatDashboardRs(row.last_purchase_price ?? row.purchase_price)}</TableCell>
                  <TableCell align="right">{formatDashboardRs(row.selling_price)}</TableCell>
                  <TableCell align="center">—</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {!isLoading && items.length > 0 && (
          <TablePagination
            component="div"
            count={items.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Rows per page:"
            labelDisplayedRows={({ from, to, count }) => `Page: ${page + 1} · ${from}–${to} of ${count}`}
            sx={{ borderTop: "1px solid #e5e7eb" }}
          />
        )}
      </TableContainer>
    </Box>
  );
};

export default RepairDashboard;
