import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  IconButton,
  InputAdornment,
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
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import SearchIcon from "@mui/icons-material/Search";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getItems, type Item } from "../../../api/itemsApi";
import type { SaleLineItem } from "../../../api/salesApi";
import { SaleSection, fieldSx } from "./SaleFormComponents";
import { formatSaleRs } from "./saleFormUtils";

export type SaleLineDraft = SaleLineItem & {
  key: string;
  /** Max qty allowed on this return line (remaining from original sale). */
  max_return_qty?: number;
  /** Client-only: on-hand stock qty at sale branch (batch or main item) for whole-price display. */
  batch_stock_qty?: number;
  /** Client-only: batch expiry for POS cart display. */
  batch_expiry_date?: string | null;
  /** Client-only: batch retail price for POS cart / price mode switching. */
  batch_selling_price?: number | null;
};

function newLineKey(): string {
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function itemToLine(item: Item, qty = 1): SaleLineDraft {
  const unitPrice = item.selling_price ?? item.purchase_price ?? 0;
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

interface SaleLineItemsSectionProps {
  lines: SaleLineDraft[];
  onChange: (lines: SaleLineDraft[]) => void;
  locationFilter?: string;
  returnMode?: boolean;
}

const SaleLineItemsSection: React.FC<SaleLineItemsSectionProps> = ({
  lines,
  onChange,
  locationFilter,
  returnMode = false,
}) => {
  const [catalogSearch, setCatalogSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const { data: itemsData, isLoading: loadingItems } = useQuery({
    queryKey: ["items", "sale-select", locationFilter],
    queryFn: () =>
      getItems(
        undefined,
        locationFilter && locationFilter !== "all" ? locationFilter : undefined
      ),
  });

  const catalogItems = itemsData?.items ?? [];

  const filteredCatalog = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    if (!q) return catalogItems;
    return catalogItems.filter(
      (i) =>
        i.item_number.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        (i.sku ?? "").toLowerCase().includes(q) ||
        (i.category ?? "").toLowerCase().includes(q)
    );
  }, [catalogItems, catalogSearch]);

  const linesSubTotal = useMemo(
    () => lines.reduce((sum, l) => sum + (l.line_total || 0), 0),
    [lines]
  );

  const appendLines = (newLines: SaleLineDraft[]) => {
    if (newLines.length === 0) return;
    onChange([...lines, ...newLines]);
  };

  const addOneItem = (item: Item) => {
    appendLines([itemToLine(item)]);
  };

  const addManyItems = (items: Item[]) => {
    appendLines(items.map((item) => itemToLine(item)));
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredCatalog.map((i) => i.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const selectedItems = useMemo(
    () => catalogItems.filter((i) => selectedIds.has(i.id)),
    [catalogItems, selectedIds]
  );

  const updateLine = (key: string, patch: Partial<SaleLineDraft>) => {
    onChange(
      lines.map((l) => {
        if (l.key !== key) return l;
        const next = { ...l, ...patch };
        let qty = Math.max(0.01, Number(next.qty) || 0);
        if (returnMode && next.max_return_qty != null && qty > next.max_return_qty + 0.0001) {
          qty = next.max_return_qty;
        }
        const unitPrice = Math.max(0, Number(next.unit_price) || 0);
        return { ...next, qty, unit_price: unitPrice, line_total: roundLine(qty * unitPrice) };
      })
    );
  };

  const removeLine = (key: string) => {
    onChange(lines.filter((l) => l.key !== key));
  };

  const visibleAllSelected =
    filteredCatalog.length > 0 && filteredCatalog.every((i) => selectedIds.has(i.id));

  return (
    <SaleSection title="Products">
      {!returnMode ? (
        <>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Pick products from the list below — use checkboxes and &quot;Add selected&quot; for many
        items, or click Add on each row. All added products appear in your sale list.
      </Typography>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2, alignItems: "center" }}>
        <TextField
          size="small"
          placeholder="Search products by number, name, SKU, category…"
          value={catalogSearch}
          onChange={(e) => setCatalogSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 220, ...fieldSx }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="contained"
          size="small"
          startIcon={<PlaylistAddIcon />}
          disabled={selectedItems.length === 0}
          onClick={() => addManyItems(selectedItems)}
          sx={{
            textTransform: "none",
            bgcolor: "var(--pallet-blue)",
            "&:hover": { bgcolor: "var(--pallet-main-blue)" },
          }}
        >
          Add selected ({selectedItems.length})
        </Button>
        <Button
          component={Link}
          to="/items/new"
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          sx={{ textTransform: "none", borderColor: "var(--surface-border)" }}
        >
          New item
        </Button>
      </Box>

      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        Product list ({filteredCatalog.length})
      </Typography>
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: "1px solid #e5e7eb", mb: 3, maxHeight: 280, overflow: "auto" }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" sx={{ bgcolor: "var(--surface-bg-alt)" }}>
                <Checkbox
                  size="small"
                  checked={visibleAllSelected}
                  indeterminate={
                    selectedItems.length > 0 &&
                    !visibleAllSelected &&
                    filteredCatalog.some((i) => selectedIds.has(i.id))
                  }
                  onChange={toggleSelectAllVisible}
                  disabled={filteredCatalog.length === 0}
                />
              </TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)" }}>Item Number</TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)" }}>Description</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)" }}>
                Stock Qty
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)" }}>
                Price (Rs)
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)" }}>
                Add
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loadingItems ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  Loading products…
                </TableCell>
              </TableRow>
            ) : filteredCatalog.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3, color: "text.secondary" }}>
                  {catalogItems.length === 0
                    ? "No items in inventory. Create items first."
                    : "No products match your search."}
                </TableCell>
              </TableRow>
            ) : (
              filteredCatalog.map((item) => (
                <TableRow
                  key={item.id}
                  hover
                  selected={selectedIds.has(item.id)}
                  sx={{ cursor: "pointer" }}
                  onClick={() => toggleSelect(item.id)}
                >
                  <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      size="small"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                    />
                  </TableCell>
                  <TableCell>{item.item_number}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell align="right">{Number(item.qty ?? 0).toFixed(2)}</TableCell>
                  <TableCell align="right">
                    {formatSaleRs(item.selling_price ?? item.purchase_price ?? 0)}
                  </TableCell>
                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => addOneItem(item)}
                      sx={{ textTransform: "none", minWidth: 72 }}
                    >
                      Add
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
        </>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Adjust return quantities below. You cannot exceed the remaining qty on the original invoice.
        </Typography>
      )}

      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        {returnMode ? "Return lines" : "Sale lines"} ({lines.length} product{lines.length === 1 ? "" : "s"})
      </Typography>
      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e5e7eb", mb: 2 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: "var(--surface-bg-alt)" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Item Number</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Item Description</TableCell>
              {returnMode ? (
                <>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Sold
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Returned
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, bgcolor: "var(--tint-warning-bg)" }}>
                    Left
                  </TableCell>
                </>
              ) : null}
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                {returnMode ? "Return qty" : "Qty"}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Unit Price (Rs)
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Line Total (Rs)
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {lines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={returnMode ? 10 : 7} align="center" sx={{ py: 3, color: "text.secondary" }}>
                  No products in sale yet. Select from the product list above.
                </TableCell>
              </TableRow>
            ) : (
              lines.map((line, index) => (
                <TableRow key={line.key} hover>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{line.item_number ?? "—"}</TableCell>
                  <TableCell>{line.description}</TableCell>
                  {returnMode ? (
                    <>
                      <TableCell align="right">{line.sold_qty ?? "—"}</TableCell>
                      <TableCell align="right" color="text.secondary">
                        {line.returned_qty ?? 0}
                      </TableCell>
                      <TableCell align="right" sx={{ bgcolor: "var(--tint-warning-bg)", fontWeight: 700 }}>
                        {line.max_return_qty ?? line.qty}
                      </TableCell>
                    </>
                  ) : null}
                  <TableCell align="right" sx={{ width: 100 }}>
                    <TextField
                      size="small"
                      type="number"
                      value={line.qty}
                      onChange={(e) => updateLine(line.key, { qty: parseFloat(e.target.value) || 0 })}
                      inputProps={{
                        min: 0.01,
                        step: "0.01",
                        ...(returnMode && line.max_return_qty != null ? { max: line.max_return_qty } : {}),
                      }}
                      sx={{ width: 90 }}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ width: 120 }}>
                    <TextField
                      size="small"
                      type="number"
                      value={line.unit_price}
                      onChange={(e) =>
                        updateLine(line.key, { unit_price: parseFloat(e.target.value) || 0 })
                      }
                      inputProps={{ min: 0, step: "0.01" }}
                      sx={{ width: 110 }}
                    />
                  </TableCell>
                  <TableCell align="right">{formatSaleRs(line.line_total)}</TableCell>
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

      <Typography variant="body2" sx={{ textAlign: "right", fontWeight: 600 }}>
        Lines subtotal: {formatSaleRs(linesSubTotal)} · {lines.length} line
        {lines.length === 1 ? "" : "s"}
      </Typography>
    </SaleSection>
  );
};

export default SaleLineItemsSection;

export function linesToPayload(lines: SaleLineDraft[]): SaleLineItem[] {
  return lines.map(
    ({
      key: _key,
      max_return_qty: _max,
      batch_stock_qty: _batchStock,
      batch_expiry_date: _batchExpiry,
      batch_selling_price: _batchSelling,
      ...rest
    }) => rest
  );
}

export function linesFromSale(items: SaleLineItem[] | undefined): SaleLineDraft[] {
  return (items ?? []).map((line) => {
    const remaining =
      line.qty != null && Number.isFinite(Number(line.qty)) ? Number(line.qty) : 0;

    return {
      ...line,
      qty: remaining,
      max_return_qty: remaining,
      key: line.id ? `line-${line.id}` : newLineKey(),
    };
  });
}
