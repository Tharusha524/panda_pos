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
import type { Shipment } from "../../../api/shippingApi";
import { formatShippingRs } from "./shippingFormUtils";

interface ShipmentDetail {
  label: string;
  value: string | number;
}

interface ShippingDashboardTableRowProps {
  shipment: Shipment & { shipment_datetime?: string; details?: ShipmentDetail[] };
  onOpenMenu: (event: React.MouseEvent<HTMLElement>, shipment: Shipment) => void;
}

function statusChipColor(status: string): "default" | "success" | "info" | "warning" {
  if (status === "Delivered") return "success";
  if (status === "In Transit") return "info";
  return "warning";
}

const ShippingDashboardTableRow: React.FC<ShippingDashboardTableRowProps> = ({
  shipment,
  onOpenMenu,
}) => {
  const [open, setOpen] = useState(false);
  const details = shipment.details ?? [];

  return (
    <>
      <TableRow hover sx={{ "& > *": { borderBottom: open ? "unset" : undefined } }}>
        <TableCell width={48}>
          <IconButton size="small" onClick={() => setOpen(!open)} aria-label="toggle details">
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{shipment.shipment_datetime ?? shipment.shipment_date}</TableCell>
        <TableCell sx={{ fontWeight: 600 }}>{shipment.shipment_no}</TableCell>
        <TableCell>{shipment.sales_id ?? "—"}</TableCell>
        <TableCell>{shipment.customer_name ?? "—"}</TableCell>
        <TableCell>{shipment.location}</TableCell>
        <TableCell align="right" sx={{ fontWeight: 700 }}>
          {formatShippingRs(shipment.freight_cost)}
        </TableCell>
        <TableCell>
          <Chip
            label={shipment.status}
            size="small"
            color={statusChipColor(shipment.status)}
            variant="outlined"
            sx={{ fontWeight: 600, fontSize: "0.7rem" }}
          />
        </TableCell>
        <TableCell align="center">
          <IconButton size="small" onClick={(e) => onOpenMenu(e, shipment)}>
            <MoreHorizIcon />
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={9} sx={{ py: 0, bgcolor: "var(--surface-bg-alt)" }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2, px: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: "text.secondary" }}>
                Details
                {shipment.notes ? ` · ${shipment.notes}` : ""}
              </Typography>
              <Table size="small">
                <TableBody>
                  {details.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ fontWeight: 600, width: 180 }}>{row.label}</TableCell>
                      <TableCell>
                        {typeof row.value === "number"
                          ? formatShippingRs(row.value)
                          : row.value}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

export default ShippingDashboardTableRow;
