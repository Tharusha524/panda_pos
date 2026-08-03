import React, { useMemo } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { useQuery } from "@tanstack/react-query";
import { getSales, type Sale } from "../../../api/salesApi";
import { DEFAULT_TRANSACTION_TYPE, canReturnSale } from "./saleConstants";
import { formatSaleRs } from "./saleFormUtils";

interface SaleReturnInvoicePickerProps {
  customerId: number | null | undefined;
  selectedSaleId: number | null;
  onSelect: (sale: Sale) => void;
  loadingSelection?: boolean;
}

const SaleReturnInvoicePicker: React.FC<SaleReturnInvoicePickerProps> = ({
  customerId,
  selectedSaleId,
  onSelect,
  loadingSelection = false,
}) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["sales", "returnable", customerId],
    queryFn: () =>
      getSales(DEFAULT_TRANSACTION_TYPE, "all", undefined, undefined, "completed", customerId!),
    enabled: customerId != null && customerId > 0,
  });

  const returnedSaleIds = useMemo(
    () => new Set(data?.returned_sale_ids ?? []),
    [data?.returned_sale_ids]
  );

  const invoices = (data?.sales ?? [])
    .map((sale) => ({
      ...sale,
      has_return: sale.has_return === true || returnedSaleIds.has(sale.id),
    }))
    .filter((sale) => canReturnSale(sale));

  if (!customerId) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        Select a customer to see their sale invoices. Click an invoice to load items for this return.
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 2 }}>
        <CircularProgress size={22} />
        <Typography variant="body2" color="text.secondary">
          Loading customer invoices…
        </Typography>
      </Box>
    );
  }

  if (isError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Could not load invoices for this customer.
      </Alert>
    );
  }

  if (invoices.length === 0) {
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        No returnable sale invoices for this customer. Invoices that were already returned are hidden.
      </Alert>
    );
  }

  return (
    <Paper variant="outlined" sx={{ mb: 2, overflow: "hidden" }}>
      <Box sx={{ px: 2, py: 1.25, bgcolor: "var(--tint-danger-bg)", borderBottom: "1px solid var(--tint-danger-border)" }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "error.dark" }}>
          Customer sale invoices
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Click an invoice to load remaining items for this return. Partial returns are supported.
        </Typography>
      </Box>
      <List dense disablePadding sx={{ maxHeight: 280, overflow: "auto" }}>
        {invoices.map((sale) => {
          const selected = selectedSaleId === sale.id;
          const itemCount = sale.items?.length ?? 0;
          return (
            <ListItemButton
              key={sale.id}
              selected={selected}
              disabled={loadingSelection}
              onClick={() => onSelect(sale)}
              sx={{
                borderBottom: "1px solid #f1f5f9",
                "&.Mui-selected": { bgcolor: "var(--tint-danger-bg)" },
              }}
            >
              <ReceiptLongIcon
                fontSize="small"
                sx={{ mr: 1.5, color: selected ? "error.main" : "text.secondary" }}
              />
              <ListItemText
                primary={
                  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                    <Typography component="span" sx={{ fontWeight: 700 }}>
                      {sale.sales_id}
                    </Typography>
                    <Typography component="span" sx={{ fontWeight: 700, color: "error.main" }}>
                      {formatSaleRs(sale.net_amount)}
                    </Typography>
                  </Box>
                }
                secondary={
                  <>
                    {`${sale.sale_datetime ?? sale.sale_date} · ${sale.location} · ${itemCount} item${itemCount === 1 ? "" : "s"} · ${sale.payment_method ?? "Cash"}`}
                    {sale.return_qty_summary && sale.return_qty_summary.remaining_qty > 0 ? (
                      <> · Remaining: {sale.return_qty_summary.remaining_qty}</>
                    ) : null}
                  </>
                }
              />
            </ListItemButton>
          );
        })}
      </List>
    </Paper>
  );
};

export default SaleReturnInvoicePicker;
