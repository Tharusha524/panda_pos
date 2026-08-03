import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Collapse,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import type { ReportData, SalesSummarySale } from "../../../api/reportsApi";

function formatRs(amount: number): string {
  return amount.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface SalesRowProps {
  sale: SalesSummarySale;
  defaultOpen?: boolean;
}

const SalesSummaryRow: React.FC<SalesRowProps> = ({ sale, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  const isReturn = sale.transaction_label === "Return";

  return (
    <>
      <TableRow hover sx={{ "& > *": { borderBottom: open ? "unset" : undefined } }}>
        <TableCell width={48}>
          <IconButton size="small" onClick={() => setOpen(!open)} aria-label="toggle details">
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{sale.date}</TableCell>
        <TableCell sx={{ fontWeight: 600 }}>{sale.sales_id}</TableCell>
        <TableCell>{sale.customer}</TableCell>
        <TableCell>{sale.transaction_label}</TableCell>
        <TableCell align="right">{formatRs(sale.sub_total)}</TableCell>
        <TableCell align="right">{formatRs(sale.discount)}</TableCell>
        <TableCell align="right" sx={{ fontWeight: 700, color: isReturn ? "error.main" : "inherit" }}>
          {formatRs(sale.net_amount)}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={8} sx={{ py: 0, bgcolor: "var(--surface-bg-alt)" }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2, px: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: "text.secondary" }}>
                Details
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Item No</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      Qty
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      Price (Rs)
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      Dis (Rs)
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      Net Price (Rs)
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      Amount (Rs)
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sale.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ color: "text.secondary" }}>
                        No line items
                      </TableCell>
                    </TableRow>
                  ) : (
                    sale.items.map((line, idx) => (
                      <TableRow key={`${sale.id}-line-${idx}`}>
                        <TableCell>{line.item_number ?? "—"}</TableCell>
                        <TableCell>{line.description ?? "—"}</TableCell>
                        <TableCell align="right">{formatRs(line.qty)}</TableCell>
                        <TableCell align="right">{formatRs(line.unit_price)}</TableCell>
                        <TableCell align="right">{formatRs(line.discount)}</TableCell>
                        <TableCell align="right">{formatRs(line.net_price)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          {formatRs(line.amount)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

interface SalesSummaryReportViewProps {
  report: ReportData;
  resetKey?: string;
}

const SalesSummaryReportView: React.FC<SalesSummaryReportViewProps> = ({ report, resetKey = "" }) => {
  const sales = report.sales ?? [];
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    setPage(0);
  }, [resetKey]);

  const paginatedSales = useMemo(() => {
    const start = page * rowsPerPage;
    return sales.slice(start, start + rowsPerPage);
  }, [sales, page, rowsPerPage]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(sales.length / rowsPerPage) - 1);
    if (page > maxPage) setPage(maxPage);
  }, [sales.length, page, rowsPerPage]);

  return (
    <TableContainer component={Paper} variant="outlined" id="report-print-area">
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow sx={{ bgcolor: "var(--surface-bg-alt)" }}>
            <TableCell width={48} />
            <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Sales ID</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
            <TableCell align="right" sx={{ fontWeight: 700 }}>
              Sub Total (Rs)
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 700 }}>
              Discount (Rs)
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 700 }}>
              Net Amount (Rs)
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sales.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 4, color: "text.secondary" }}>
                No sales for the selected period or branch.
              </TableCell>
            </TableRow>
          ) : (
            paginatedSales.map((sale, idx) => (
              <SalesSummaryRow key={sale.id} sale={sale} defaultOpen={idx === 0 && page === 0} />
            ))
          )}
        </TableBody>
      </Table>
      {sales.length > 0 && (
        <TablePagination
          component="div"
          count={sales.length}
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
          sx={{ borderTop: "1px solid var(--surface-border)" }}
        />
      )}
    </TableContainer>
  );
};

export default SalesSummaryReportView;
