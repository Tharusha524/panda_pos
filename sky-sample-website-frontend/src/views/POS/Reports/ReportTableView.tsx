import React, { useEffect, useMemo, useState } from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from "@mui/material";
import type { ReportColumn, ReportData } from "../../../api/reportsApi";

interface ReportTableViewProps {
  report: ReportData;
  /** Reset pagination when filters/report change */
  resetKey?: string;
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? String(value)
      : value.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
  }
  return String(value);
}

const ReportTableView: React.FC<ReportTableViewProps> = ({ report, resetKey = "" }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const rows = report.rows;
  const columns = report.columns;

  const paginatedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return rows.slice(start, start + rowsPerPage);
  }, [rows, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [resetKey]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(rows.length / rowsPerPage) - 1);
    if (page > maxPage) setPage(maxPage);
  }, [rows.length, page, rowsPerPage]);

  const colSpan = Math.max(columns.length, 1);

  return (
    <TableContainer component={Paper} variant="outlined" id="report-print-area">
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow sx={{ bgcolor: "var(--surface-bg-alt)" }}>
            {columns.map((col: ReportColumn) => (
              <TableCell key={col.key} sx={{ fontWeight: 700 }}>
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan} align="center" sx={{ py: 4, color: "text.secondary" }}>
                No records for the selected period or branch.
              </TableCell>
            </TableRow>
          ) : (
            paginatedRows.map((row, idx) => (
              <TableRow key={`${page}-${idx}`} hover>
                {columns.map((col) => (
                  <TableCell key={col.key}>{formatCell(row[col.key])}</TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {rows.length > 0 && (
        <TablePagination
          component="div"
          count={rows.length}
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

export default ReportTableView;
