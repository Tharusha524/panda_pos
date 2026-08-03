import React, { useMemo } from "react";
import {
  Box,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import type { Item } from "../../../api/itemsApi";
import type { PurchaseLineItem } from "../../../api/purchasesApi";
import PurchaseCatalogPicker from "./PurchaseCatalogPicker";
import { formatPurchaseRs } from "./purchaseFormUtils";

export type PurchaseLineDraft = PurchaseLineItem & {
  key: string;
  /** Max qty allowed on this return line (remaining from original purchase). */
  max_return_qty?: number;
};

function newLineKey(): string {
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function itemToLine(item: Item, qty = 1): PurchaseLineDraft {
  const unitPrice = item.purchase_price ?? item.last_purchase_price ?? 0;
  const q = Math.max(0.01, qty);
  return {
    key: newLineKey(),
    item_id: item.id,
    item_number: item.item_number,
    description: item.description,
    qty: q,
    unit_price: unitPrice,
    line_total: roundLine(q * unitPrice),
  };
}

function roundLine(n: number): number {
  return Math.round(n * 100) / 100;
}

interface PurchaseLineItemsSectionProps {
  lines: PurchaseLineDraft[];
  onChange: (lines: PurchaseLineDraft[]) => void;
  locationFilter?: string;
}

const PurchaseLineItemsSection: React.FC<PurchaseLineItemsSectionProps> = ({
  lines,
  onChange,
  locationFilter = "Main Location",
}) => {
  const branchLocation = locationFilter && locationFilter !== "all" ? locationFilter : "Main Location";

  const linesItemIds = useMemo(() => new Set(lines.map((l) => l.item_id).filter(Boolean) as number[]), [lines]);

  const linesSubTotal = useMemo(
    () => lines.reduce((sum, l) => sum + (l.line_total || 0), 0),
    [lines]
  );

  const addItemToCart = (item: Item) => {
    const existing = lines.find((l) => l.item_id === item.id);
    if (existing) {
      onChange(
        lines.map((l) => {
          if (l.key !== existing.key) return l;
          const qty = l.qty + 1;
          return {
            ...l,
            qty,
            line_total: roundLine(qty * l.unit_price),
          };
        })
      );
    } else {
      onChange([...lines, itemToLine(item)]);
    }
  };

  const updateLine = (key: string, patch: Partial<PurchaseLineDraft>) => {
    onChange(
      lines.map((l) => {
        if (l.key !== key) return l;
        const next = { ...l, ...patch };
        const qty = Math.max(0.01, Number(next.qty) || 0);
        const unitPrice = Math.max(0, Number(next.unit_price) || 0);
        return { ...next, qty, unit_price: unitPrice, line_total: roundLine(qty * unitPrice) };
      })
    );
  };

  const removeLine = (key: string) => {
    onChange(lines.filter((l) => l.key !== key));
  };

  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
        Products
      </Typography>

      <Grid container spacing={2} alignItems="flex-start">
        <Grid item xs={12} lg={8}>
          <PurchaseCatalogPicker
            branchLocation={branchLocation}
            linesItemIds={linesItemIds}
            onAddItem={addItemToCart}
          />
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper
            sx={{
              p: 2,
              borderRadius: 2,
              position: { lg: "sticky" },
              top: 16,
              maxHeight: { lg: "calc(100vh - 120px)" },
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <ShoppingCartIcon color="primary" />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Purchase list ({lines.length})
              </Typography>
            </Box>

            <TableContainer sx={{ flex: 1, overflow: "auto", mb: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)" }}>Item</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)", width: 72 }}>
                      Qty
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)", width: 88 }}>
                      Price
                    </TableCell>
                    <TableCell align="center" sx={{ width: 40, bgcolor: "var(--surface-bg-alt)" }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lines.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} sx={{ py: 3, color: "text.secondary", textAlign: "center" }}>
                        Select products from categories
                      </TableCell>
                    </TableRow>
                  ) : (
                    lines.map((line) => (
                      <TableRow key={line.key} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                            {line.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {line.item_number}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            value={line.qty}
                            onChange={(e) => updateLine(line.key, { qty: parseFloat(e.target.value) || 0 })}
                            inputProps={{ min: 0.01, step: "0.01" }}
                            sx={{ width: 68 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            value={line.unit_price}
                            onChange={(e) =>
                              updateLine(line.key, { unit_price: parseFloat(e.target.value) || 0 })
                            }
                            inputProps={{ min: 0, step: "0.01" }}
                            sx={{ width: 84 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton size="small" color="error" onClick={() => removeLine(line.key)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="body2" sx={{ textAlign: "right", fontWeight: 700, pt: 1, borderTop: "1px solid #eee" }}>
              Subtotal: {formatPurchaseRs(linesSubTotal)}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PurchaseLineItemsSection;

export function linesToPayload(lines: PurchaseLineDraft[]): PurchaseLineItem[] {
  return lines.map(({ key: _key, id: _purchaseLineId, max_return_qty: _max, ...rest }) => {
    const itemId =
      rest.item_id != null && Number.isFinite(Number(rest.item_id)) && Number(rest.item_id) > 0
        ? Number(rest.item_id)
        : null;

    return {
      item_id: itemId,
      item_number: rest.item_number ?? null,
      description: rest.description,
      qty: rest.qty,
      unit_price: rest.unit_price,
      line_total: rest.line_total,
      expiry_date: rest.expiry_date ?? null,
    };
  });
}

export function linesFromPurchase(items: PurchaseLineItem[] | undefined): PurchaseLineDraft[] {
  return (items ?? []).map((line) => {
    const remaining =
      line.qty != null && Number.isFinite(Number(line.qty)) ? Number(line.qty) : 0;

    return {
      item_id:
        line.item_id != null && Number.isFinite(Number(line.item_id)) && Number(line.item_id) > 0
          ? Number(line.item_id)
          : null,
      item_number: line.item_number ?? null,
      description: line.description,
      qty: remaining,
      unit_price: line.unit_price,
      line_total: line.line_total ?? roundLine(remaining * line.unit_price),
      expiry_date: line.expiry_date ?? null,
      purchased_qty: line.purchased_qty,
      returned_qty: line.returned_qty,
      max_return_qty: remaining,
      key: line.id ? `line-${line.id}` : newLineKey(),
    };
  });
}
