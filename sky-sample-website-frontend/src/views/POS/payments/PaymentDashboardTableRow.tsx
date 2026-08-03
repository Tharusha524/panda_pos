import React, { useState } from "react";
import {
  Box,
  Chip,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import type { Payment, PaymentDetailLine } from "../../../api/paymentsApi";
import { formatPaymentRs } from "./paymentFormUtils";

function formatQty(amount: number): string {
  return amount.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface PaymentDashboardTableRowProps {
  payment: Payment;
  onOpenMenu: (event: React.MouseEvent<HTMLElement>, payment: Payment) => void;
}

const PaymentDashboardTableRow: React.FC<PaymentDashboardTableRowProps> = ({
  payment,
  onOpenMenu,
}) => {
  const [open, setOpen] = useState(false);
  const isIncome = payment.direction === "Income";
  const isPaidOut = payment.direction === "Paid Out";
  const details = payment.details ?? [];

  return (
    <>
      <TableRow hover sx={{ "& > *": { borderBottom: open ? "unset" : undefined } }}>
        <TableCell width={48}>
          <IconButton size="small" onClick={() => setOpen(!open)} aria-label="toggle details">
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{payment.payment_datetime ?? payment.payment_date}</TableCell>
        <TableCell sx={{ fontWeight: 600 }}>{payment.sales_no}</TableCell>
        <TableCell>
          <Chip
            label={payment.direction ?? "Payment"}
            size="small"
            color={isIncome ? "success" : isPaidOut ? "error" : "default"}
            variant="outlined"
            sx={{ fontWeight: 600, fontSize: "0.7rem" }}
          />
        </TableCell>
        <TableCell>{payment.source_label ?? payment.receipt_type}</TableCell>
        <TableCell>{payment.source_label ?? "—"}</TableCell>
        <TableCell>{payment.payment_method}</TableCell>
        <TableCell>{payment.location}</TableCell>
        <TableCell align="right">{formatPaymentRs(payment.discount)}</TableCell>
        <TableCell
          align="right"
          sx={{
            fontWeight: 700,
            color: isIncome ? "success.main" : isPaidOut ? "error.main" : "text.primary",
          }}
        >
          {formatPaymentRs(payment.paid_amount)}
        </TableCell>
        <TableCell align="center">
          <IconButton size="small" onClick={(e) => onOpenMenu(e, payment)}>
            <MoreHorizIcon />
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={11} sx={{ py: 0, bgcolor: "var(--surface-bg-alt)" }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2, px: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: "text.secondary" }}>
                Details
                {payment.notes ? ` · ${payment.notes}` : ""}
              </Typography>
              <DetailTable lines={details} />
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

function DetailTable({ lines }: { lines: PaymentDetailLine[] }) {
  if (lines.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No linked line items for this payment.
      </Typography>
    );
  }

  return (
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
        {lines.map((line, idx) => (
          <TableRow key={idx}>
            <TableCell>{line.item_number ?? "—"}</TableCell>
            <TableCell>{line.description ?? "—"}</TableCell>
            <TableCell align="right">{formatQty(line.qty)}</TableCell>
            <TableCell align="right">{formatPaymentRs(line.unit_price)}</TableCell>
            <TableCell align="right">{formatPaymentRs(line.discount)}</TableCell>
            <TableCell align="right">{formatPaymentRs(line.net_price)}</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600 }}>
              {formatPaymentRs(line.amount)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default PaymentDashboardTableRow;
