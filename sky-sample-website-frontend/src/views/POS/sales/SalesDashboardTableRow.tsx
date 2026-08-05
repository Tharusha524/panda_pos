import React, { useState } from "react";
import {
  Box,
  Chip,
  Collapse,
  IconButton,
  TableCell,
  TableRow,
  Typography,
  Table,
  TableBody,
  TableHead,
  Tooltip,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import PrintIcon from "@mui/icons-material/Print";
import ReplayIcon from "@mui/icons-material/Replay";
import type { Sale, SaleLineItem } from "../../../api/salesApi";
import { canReturnSale, isReturnTransaction, saleDashboardStatusLabel, saleReturnStatusLabel } from "./saleConstants";

function formatRs(amount: number): string {
  return amount.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function lineMetrics(line: SaleLineItem) {
  const qty = line.qty;
  const unitPrice = line.unit_price;
  const lineTotal = line.line_total;
  const gross = qty * unitPrice;
  const discount = Math.max(0, gross - lineTotal);
  const netPrice = qty > 0 ? lineTotal / qty : unitPrice;
  return { discount, netPrice, lineTotal };
}

interface SalesDashboardTableRowProps {
  sale: Sale;
  onOpenMenu: (event: React.MouseEvent<HTMLElement>, sale: Sale) => void;
  onReturn?: (sale: Sale) => void;
  onPrintReceipt?: (sale: Sale) => void;
  receiptBusy?: boolean;
}

const SalesDashboardTableRow: React.FC<SalesDashboardTableRowProps> = ({
  sale,
  onOpenMenu,
  onReturn,
  onPrintReceipt,
  receiptBusy = false,
}) => {
  const [open, setOpen] = useState(false);
  const isReturn = isReturnTransaction(sale.transaction_type);
  const isHold = sale.order_status === "hold";
  const returnStatusLabel = saleReturnStatusLabel(sale);
  const returnSummary = sale.return_qty_summary;
  const returnStatusDisplay =
    returnStatusLabel &&
    returnSummary &&
    returnSummary.remaining_qty > 0 &&
    !sale.has_return
      ? `${returnStatusLabel} (${returnSummary.remaining_qty} left)`
      : returnStatusLabel;
  const returnStatusTooltip = sale.has_return
    ? "Fully returned — cannot return again"
    : returnSummary
      ? `Sold ${returnSummary.sold_qty} · Returned ${returnSummary.returned_qty} · Remaining ${returnSummary.remaining_qty}`
      : "Partially returned — remaining qty can still be returned";
  const canPrintReceipt =
    !isHold && sale.order_status !== "quotation" && Boolean(onPrintReceipt);
  const items = sale.items ?? [];

  const statusChip = () => {
    if (isReturn) {
      return (
        <Chip label="Return" size="small" color="error" sx={{ fontWeight: 700 }} />
      );
    }
    if (isHold) {
      return (
        <Chip
          label={saleDashboardStatusLabel(sale)}
          size="small"
          color="warning"
          sx={{ fontWeight: 700 }}
        />
      );
    }
    if (sale.order_status === "quotation") {
      return (
        <Chip
          label={saleDashboardStatusLabel(sale)}
          size="small"
          color="info"
          sx={{ fontWeight: 700 }}
        />
      );
    }
    return (
      <Chip
        label={saleDashboardStatusLabel(sale)}
        size="small"
        variant="outlined"
        sx={{ fontWeight: 600 }}
      />
    );
  };

  return (
    <>
      <TableRow
        hover
        sx={{
          "& > *": { borderBottom: open ? "unset" : undefined },
          bgcolor: isReturn ? "var(--tint-danger-bg)" : isHold ? "var(--tint-warning-bg)" : undefined,
        }}
      >
        <TableCell width={48}>
          <IconButton size="small" onClick={() => setOpen(!open)} aria-label="toggle details">
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{sale.sale_datetime ?? sale.sale_date}</TableCell>
        <TableCell sx={{ fontWeight: 600 }}>{sale.sales_id}</TableCell>
        <TableCell>{sale.customer_name ?? "Walk-in"}</TableCell>
        <TableCell>{sale.location}</TableCell>
        <TableCell>{statusChip()}</TableCell>
        <TableCell>{sale.sales_type}</TableCell>
        <TableCell align="right">{formatRs(sale.sub_total)}</TableCell>
        <TableCell align="right">{formatRs(sale.discount)}</TableCell>
        <TableCell align="right" sx={{ fontWeight: 700, color: isReturn ? "error.main" : "inherit" }}>
          {formatRs(sale.net_amount)}
        </TableCell>
        <TableCell align="center">
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.25 }}>
            {canPrintReceipt && isReturn && (
              <Tooltip title="Print return receipt">
                <span>
                  <IconButton
                    size="small"
                    disabled={receiptBusy}
                    onClick={() => onPrintReceipt!(sale)}
                    sx={{ color: "error.main" }}
                    aria-label="print return receipt"
                  >
                    <PrintIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            )}
            {canReturnSale(sale) && onReturn && !isReturn && (
              <Tooltip title="Return sale">
                <IconButton
                  size="small"
                  onClick={() => onReturn(sale)}
                  sx={{ color: "error.main" }}
                  aria-label="return sale"
                >
                  <ReplayIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {returnStatusDisplay && !isReturn && (
              <Tooltip title={returnStatusTooltip}>
                <Typography
                  component="span"
                  variant="caption"
                  sx={{
                    color: sale.has_return ? "text.disabled" : "warning.main",
                    px: 0.5,
                    whiteSpace: "nowrap",
                  }}
                >
                  {returnStatusDisplay}
                </Typography>
              </Tooltip>
            )}
            <IconButton size="small" onClick={(e) => onOpenMenu(e, sale)} aria-label="more actions">
              <MoreHorizIcon />
            </IconButton>
          </Box>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={11} sx={{ py: 0, bgcolor: "var(--surface-bg-alt)" }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2, px: 1 }}>
              {returnSummary && (sale.has_partial_return || sale.has_return) ? (
                <Typography variant="body2" sx={{ mb: 1.5, color: sale.has_return ? "text.secondary" : "warning.dark" }}>
                  Return summary: Sold <strong>{returnSummary.sold_qty}</strong>
                  {" · "}Returned <strong>{returnSummary.returned_qty}</strong>
                  {" · "}Remaining <strong>{returnSummary.remaining_qty}</strong>
                </Typography>
              ) : null}
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
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ color: "text.secondary" }}>
                        No line items
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((line, idx) => {
                      const m = lineMetrics(line);
                      return (
                        <TableRow key={line.id ?? `${sale.id}-${idx}`}>
                          <TableCell>{line.item_number ?? "—"}</TableCell>
                          <TableCell>{line.description}</TableCell>
                          <TableCell align="right">{formatRs(line.qty)}</TableCell>
                          <TableCell align="right">{formatRs(line.unit_price)}</TableCell>
                          <TableCell align="right">{formatRs(m.discount)}</TableCell>
                          <TableCell align="right">{formatRs(m.netPrice)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {formatRs(m.lineTotal)}
                          </TableCell>
                        </TableRow>
                      );
                    })
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

export default SalesDashboardTableRow;
