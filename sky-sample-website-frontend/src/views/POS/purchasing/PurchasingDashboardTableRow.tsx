import React, { useState } from "react";
import {
  Box,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import ReplayIcon from "@mui/icons-material/Replay";
import type { Purchase } from "../../../api/purchasesApi";
import { formatDashboardRs } from "../shared/dashboardShared";
import { canReturnPurchase, isReturnPurchase, purchaseReturnStatusLabel, purchaseTypeLabel, WALK_IN_SUPPLIER_LABEL } from "./purchaseConstants";

interface PurchaseDetailLine {
  item_number?: string | null;
  description?: string;
  qty: number;
  unit_price: number;
  discount?: number;
  net_price?: number;
  amount: number;
}

interface PurchasingDashboardTableRowProps {
  purchase: Purchase & { purchase_datetime?: string; details?: PurchaseDetailLine[] };
  onReturn?: (purchase: Purchase) => void;
  onOpenMenu: (event: React.MouseEvent<HTMLElement>, purchase: Purchase) => void;
}

const PurchasingDashboardTableRow: React.FC<PurchasingDashboardTableRowProps> = ({
  purchase,
  onReturn,
  onOpenMenu,
}) => {
  const [open, setOpen] = useState(false);
  const details = purchase.details ?? [];

  const isReturn = isReturnPurchase(purchase.purchase_type);
  const returnStatusLabel = purchaseReturnStatusLabel(purchase);
  const returnSummary = purchase.return_qty_summary;
  const returnStatusDisplay =
    returnStatusLabel &&
    returnSummary &&
    returnSummary.remaining_qty > 0 &&
    !purchase.has_return
      ? `${returnStatusLabel} (${returnSummary.remaining_qty} left)`
      : returnStatusLabel;
  const returnStatusTooltip = purchase.has_return
    ? "Fully returned — cannot return again"
    : returnSummary
      ? `Purchased ${returnSummary.purchased_qty} · Returned ${returnSummary.returned_qty} · Remaining ${returnSummary.remaining_qty}`
      : "Partially returned — remaining qty can still be returned";

  return (
    <>
      <TableRow hover sx={{ "& > *": { borderBottom: open ? "unset" : undefined } }}>
        <TableCell width={48}>
          <IconButton size="small" onClick={() => setOpen(!open)} aria-label="toggle details">
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{purchase.purchase_datetime ?? purchase.purchase_date}</TableCell>
        <TableCell sx={{ fontWeight: 600 }}>{purchase.invoice_id}</TableCell>
        <TableCell>{purchase.supplier_name || WALK_IN_SUPPLIER_LABEL}</TableCell>
        <TableCell>{purchaseTypeLabel(purchase.purchase_type)}</TableCell>
        <TableCell>{purchase.location}</TableCell>
        <TableCell align="right">{formatDashboardRs(purchase.discount)}</TableCell>
        <TableCell align="right" sx={{ fontWeight: 700, color: isReturn ? "success.main" : "error.main" }}>
          {formatDashboardRs(purchase.amount)}
        </TableCell>
        <TableCell>{purchase.payment_method ?? "Cash"}</TableCell>
        <TableCell align="center">
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.25 }}>
            {canReturnPurchase(purchase) && onReturn && !isReturn && (
              <Tooltip title="Return purchase">
                <IconButton
                  size="small"
                  onClick={() => onReturn(purchase)}
                  sx={{ color: "error.main" }}
                  aria-label="return purchase"
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
                    color: purchase.has_return ? "text.disabled" : "warning.main",
                    px: 0.5,
                    whiteSpace: "nowrap",
                  }}
                >
                  {returnStatusDisplay}
                </Typography>
              </Tooltip>
            )}
            <IconButton size="small" onClick={(e) => onOpenMenu(e, purchase)}>
              <MoreHorizIcon />
            </IconButton>
          </Box>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={10} sx={{ py: 0, bgcolor: "var(--surface-bg-alt)" }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2, px: 1 }}>
              {returnSummary && (purchase.has_partial_return || purchase.has_return) ? (
                <Typography variant="body2" sx={{ mb: 1.5, color: purchase.has_return ? "text.secondary" : "warning.dark" }}>
                  Return summary: Purchased <strong>{returnSummary.purchased_qty}</strong>
                  {" · "}Returned <strong>{returnSummary.returned_qty}</strong>
                  {" · "}Remaining <strong>{returnSummary.remaining_qty}</strong>
                </Typography>
              ) : null}
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: "text.secondary" }}>
                Line items
                {purchase.notes ? ` · ${purchase.notes}` : ""}
              </Typography>
              {details.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No line items.
                </Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Item No</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Qty</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Price (Rs)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Amount (Rs)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {details.map((line, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{line.item_number ?? "—"}</TableCell>
                        <TableCell>{line.description ?? "—"}</TableCell>
                        <TableCell align="right">{line.qty.toFixed(2)}</TableCell>
                        <TableCell align="right">{formatDashboardRs(line.unit_price)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          {formatDashboardRs(line.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

export default PurchasingDashboardTableRow;
