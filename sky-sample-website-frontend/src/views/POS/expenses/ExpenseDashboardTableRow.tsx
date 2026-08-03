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
import type { Expense, ExpenseDetailLine } from "../../../api/expensesApi";
import { formatExpenseRs } from "./expenseFormUtils";

function statusColor(status: string): "success" | "warning" | "error" | "default" {
  if (status === "Approved") return "success";
  if (status === "Pending") return "warning";
  if (status === "Rejected") return "error";
  return "default";
}

interface ExpenseDashboardTableRowProps {
  expense: Expense;
  onOpenMenu: (event: React.MouseEvent<HTMLElement>, expense: Expense) => void;
}

const ExpenseDashboardTableRow: React.FC<ExpenseDashboardTableRowProps> = ({
  expense,
  onOpenMenu,
}) => {
  const [open, setOpen] = useState(false);
  const details = expense.details ?? [];
  const isApproved = expense.status === "Approved";

  return (
    <>
      <TableRow hover sx={{ "& > *": { borderBottom: open ? "unset" : undefined } }}>
        <TableCell width={48}>
          <IconButton size="small" onClick={() => setOpen(!open)} aria-label="toggle details">
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{expense.expense_datetime ?? expense.expense_date}</TableCell>
        <TableCell sx={{ fontWeight: 600 }}>{expense.reference_no}</TableCell>
        <TableCell>{expense.category}</TableCell>
        <TableCell>{expense.payment_method}</TableCell>
        <TableCell>{expense.location}</TableCell>
        <TableCell align="right">{formatExpenseRs(expense.discount)}</TableCell>
        <TableCell
          align="right"
          sx={{
            fontWeight: 700,
            color: isApproved ? "error.main" : "text.primary",
          }}
        >
          {formatExpenseRs(expense.paid_amount)}
        </TableCell>
        <TableCell>
          <Chip
            label={expense.status}
            size="small"
            color={statusColor(expense.status)}
            variant="outlined"
            sx={{ fontWeight: 600, fontSize: "0.7rem" }}
          />
        </TableCell>
        <TableCell align="center">
          <IconButton size="small" onClick={(e) => onOpenMenu(e, expense)}>
            <MoreHorizIcon />
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={10} sx={{ py: 0, bgcolor: "var(--surface-bg-alt)" }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2, px: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: "text.secondary" }}>
                Details
                {expense.notes ? ` · ${expense.notes}` : ""}
              </Typography>
              <DetailTable lines={details} description={expense.description} />
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

function DetailTable({
  lines,
  description,
}: {
  lines: ExpenseDetailLine[];
  description: string;
}) {
  if (lines.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {description || "No details for this expense."}
      </Typography>
    );
  }

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
          <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
          <TableCell align="right" sx={{ fontWeight: 700 }}>
            Amount (Rs)
          </TableCell>
          <TableCell align="right" sx={{ fontWeight: 700 }}>
            Discount (Rs)
          </TableCell>
          <TableCell align="right" sx={{ fontWeight: 700 }}>
            Paid (Rs)
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {lines.map((line, idx) => (
          <TableRow key={idx}>
            <TableCell>{line.category}</TableCell>
            <TableCell>{line.description}</TableCell>
            <TableCell align="right">{formatExpenseRs(line.amount)}</TableCell>
            <TableCell align="right">{formatExpenseRs(line.discount)}</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600 }}>
              {formatExpenseRs(line.paid_amount)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default ExpenseDashboardTableRow;
