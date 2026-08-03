import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
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
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import type { Item, ItemBatch, WriteOffBatchLine } from "../../../api/itemsApi";
import {
  batchQtyTotal,
  daysUntilExpiry,
  expiredBatchQtyTotal,
  formatExpiryDate,
  formatItemQty,
  groupBatchesForWriteOff,
  isBatchExpired,
  itemSellableQty,
  nextSellableBatchExpiry,
  stockQtyOnHand,
  unbatchedStockQty,
} from "./itemInventoryUtils";

type BatchSelection = Record<number, { qty: string }>;

type StockRowCategory = "main" | "expired" | "valid" | "normal";

interface StockTableRow {
  key: string;
  category: StockRowCategory;
  label: string;
  sublabel?: string;
  location: string;
  qty: number;
  expiryDate: string | null;
  batch?: ItemBatch;
}

interface Props {
  item: Item;
  batches: ItemBatch[];
  loading: boolean;
  writeOffNotes: string;
  onWriteOffNotesChange: (value: string) => void;
  onBatchLinesChange: (lines: WriteOffBatchLine[]) => void;
  onMainQtyChange: (qty: number) => void;
  alertDays?: number;
}

function categoryChip(category: StockRowCategory, batch: ItemBatch | undefined, alertDays: number) {
  if (category === "main") {
    return <Chip size="small" label="Main item" color="primary" variant="outlined" />;
  }
  if (!batch) return null;
  if (category === "expired" || isBatchExpired(batch)) {
    return <Chip size="small" label="Write off" color="error" />;
  }
  if (!batch.expiry_date) {
    return <Chip size="small" label="No expiry" variant="outlined" />;
  }
  const days = daysUntilExpiry(batch.expiry_date);
  if (days != null && days <= alertDays) {
    return <Chip size="small" label="Expiring soon" color="warning" />;
  }
  return <Chip size="small" label="Valid" color="success" variant="outlined" />;
}

function rowHighlight(category: StockRowCategory, selected: boolean) {
  if (!selected) {
    if (category === "expired") return { bgcolor: "rgba(211, 47, 47, 0.06)" };
    if (category === "valid") return { bgcolor: "rgba(46, 125, 50, 0.04)" };
    if (category === "main") return { bgcolor: "rgba(25, 118, 210, 0.06)" };
    return undefined;
  }
  if (category === "expired") return { bgcolor: "rgba(211, 47, 47, 0.12)" };
  if (category === "valid") return { bgcolor: "rgba(46, 125, 50, 0.1)" };
  if (category === "main") return { bgcolor: "rgba(25, 118, 210, 0.12)" };
  return { bgcolor: "action.selected" };
}

const WriteOffBatchPanel: React.FC<Props> = ({
  item,
  batches,
  loading,
  writeOffNotes,
  onWriteOffNotesChange,
  onBatchLinesChange,
  onMainQtyChange,
  alertDays = 7,
}) => {
  const uom = item.uom;
  const { expired, validExpiry, normal } = groupBatchesForWriteOff(batches, alertDays);
  const expiredQty = expiredBatchQtyTotal(batches);
  const validQty = batchQtyTotal(validExpiry);
  const normalBatchQty = batchQtyTotal(normal);
  const totalOnHand = stockQtyOnHand(item.qty ?? 0);
  const unbatchedQty = unbatchedStockQty(item.qty ?? 0, batches);
  const mainRowQty = batches.length === 0 ? totalOnHand : unbatchedQty;
  const showMainRow = mainRowQty > 0.0001;
  const normalTotalQty = normalBatchQty + unbatchedQty;
  const sellableNow = itemSellableQty(item);

  const [selected, setSelected] = useState<BatchSelection>({});
  const [mainSelected, setMainSelected] = useState(false);
  const [mainQtyInput, setMainQtyInput] = useState("");

  const tableRows = useMemo((): StockTableRow[] => {
    const rows: StockTableRow[] = [];
    if (showMainRow) {
      rows.push({
        key: "main",
        category: "main",
        label: item.item_number,
        sublabel: "Main item stock (not in a dated batch)",
        location: item.location ?? "—",
        qty: mainRowQty,
        expiryDate: null,
      });
    }
    for (const batch of expired) {
      rows.push({
        key: `batch-${batch.id}`,
        category: "expired",
        label: batch.batch_number,
        sublabel: "Expired batch",
        location: batch.location ?? item.location ?? "—",
        qty: batch.qty,
        expiryDate: batch.expiry_date ?? null,
        batch,
      });
    }
    for (const batch of validExpiry) {
      rows.push({
        key: `batch-${batch.id}`,
        category: "valid",
        label: batch.batch_number,
        location: batch.location ?? item.location ?? "—",
        qty: batch.qty,
        expiryDate: batch.expiry_date ?? null,
        batch,
      });
    }
    for (const batch of normal) {
      rows.push({
        key: `batch-${batch.id}`,
        category: "normal",
        label: batch.batch_number,
        sublabel: batch.batch_number.startsWith("MAIN-") ? "Main batch" : undefined,
        location: batch.location ?? item.location ?? "—",
        qty: batch.qty,
        expiryDate: null,
        batch,
      });
    }
    return rows;
  }, [expired, validExpiry, normal, item, showMainRow, mainRowQty]);

  const selectedLines = useMemo((): WriteOffBatchLine[] => {
    return Object.entries(selected)
      .map(([id, row]) => ({
        item_batch_id: Number(id),
        qty: parseFloat(row.qty) || 0,
      }))
      .filter((line) => line.qty > 0);
  }, [selected]);

  const mainWriteOffQty = mainSelected ? parseFloat(mainQtyInput) || 0 : 0;

  const selectedTotalQty = useMemo(
    () =>
      Math.round((selectedLines.reduce((sum, line) => sum + line.qty, 0) + mainWriteOffQty) * 100) /
      100,
    [selectedLines, mainWriteOffQty]
  );

  useEffect(() => {
    onBatchLinesChange(selectedLines);
    onMainQtyChange(mainWriteOffQty);
  }, [selectedLines, mainWriteOffQty, onBatchLinesChange, onMainQtyChange]);

  useEffect(() => {
    setSelected({});
    setMainSelected(false);
    setMainQtyInput("");
    const prefill: BatchSelection = {};
    for (const batch of expired) {
      prefill[batch.id] = { qty: String(batch.qty) };
    }
    setSelected(prefill);
  }, [batches, item.id]);

  const toggleBatch = (batch: ItemBatch, checked: boolean) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (checked) {
        next[batch.id] = { qty: String(batch.qty) };
      } else {
        delete next[batch.id];
      }
      return next;
    });
  };

  const setBatchQty = (batchId: number, qty: string, maxQty: number) => {
    const parsed = parseFloat(qty);
    const clamped =
      Number.isNaN(parsed) || parsed <= 0
        ? ""
        : String(Math.min(maxQty, Math.round(parsed * 100) / 100));
    setSelected((prev) => ({
      ...prev,
      [batchId]: { qty: clamped || qty },
    }));
  };

  const toggleMain = (checked: boolean) => {
    setMainSelected(checked);
    if (checked) {
      setMainQtyInput(String(mainRowQty));
    } else {
      setMainQtyInput("");
    }
  };

  const setMainQty = (qty: string) => {
    const parsed = parseFloat(qty);
    const clamped =
      Number.isNaN(parsed) || parsed <= 0
        ? ""
        : String(Math.min(mainRowQty, Math.round(parsed * 100) / 100));
    setMainQtyInput(clamped || qty);
  };

  const selectAllExpired = () => {
    const next: BatchSelection = {};
    for (const batch of expired) {
      next[batch.id] = { qty: String(batch.qty) };
    }
    setSelected(next);
    setMainSelected(false);
    setMainQtyInput("");
  };

  const clearSelection = () => {
    setSelected({});
    setMainSelected(false);
    setMainQtyInput("");
  };

  const remainingAfterWriteOff = useMemo(() => {
    if (selectedLines.length === 0) return batches;
    const writtenIds = new Set(selectedLines.map((l) => l.item_batch_id));
    const writtenQtyById = Object.fromEntries(
      selectedLines.map((l) => [l.item_batch_id, l.qty])
    );
    return batches
      .map((b) => {
        if (!writtenIds.has(b.id)) return b;
        const remain = Math.max(0, b.qty - (writtenQtyById[b.id] ?? 0));
        if (remain <= 0) return null;
        return { ...b, qty: remain };
      })
      .filter((b): b is ItemBatch => b != null);
  }, [batches, selectedLines]);

  const nextExpiryAfter = nextSellableBatchExpiry(remainingAfterWriteOff);
  const remainingTotalOnHand = Math.max(
    0,
    Math.round((totalOnHand - selectedTotalQty) * 100) / 100
  );
  const remainingRealStock = useMemo(() => {
    if (selectedTotalQty === 0) return sellableNow;
    const { validExpiry, normal } = groupBatchesForWriteOff(remainingAfterWriteOff);
    const remainingMain = Math.max(
      0,
      Math.round((mainRowQty - mainWriteOffQty) * 100) / 100
    );
    const unbatched = unbatchedStockQty(remainingTotalOnHand, remainingAfterWriteOff);
    const mainPart = batches.length === 0 ? remainingTotalOnHand : Math.max(unbatched, remainingMain);
    return Math.round((batchQtyTotal(validExpiry) + batchQtyTotal(normal) + mainPart) * 100) / 100;
  }, [
    remainingAfterWriteOff,
    remainingTotalOnHand,
    selectedTotalQty,
    sellableNow,
    mainRowQty,
    mainWriteOffQty,
    batches.length,
  ]);

  const selectionCount =
    selectedLines.length + (mainSelected && mainWriteOffQty > 0 ? 1 : 0);

  return (
    <Box sx={{ display: "grid", gap: 2, pt: 0.5 }}>
      <Typography variant="body2" color="text.secondary">
        Branch: <strong>{item.location}</strong> · Real stock (sellable):{" "}
        <strong>{formatItemQty(sellableNow, uom)}</strong>
        {totalOnHand > sellableNow + 0.0001 ? (
          <>
            {" "}
            · Total on hand {formatItemQty(totalOnHand, uom)} (includes expired)
          </>
        ) : null}
      </Typography>

      <Alert severity="info">
        Select <strong>Main item</strong> and/or <strong>batches</strong> in the table below, set
        write-off qty, then click <strong>Write off</strong>.
      </Alert>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
        <Button
          size="small"
          variant="outlined"
          color="error"
          onClick={selectAllExpired}
          disabled={expired.length === 0}
        >
          Select all expired
        </Button>
        <Button
          size="small"
          variant="text"
          onClick={clearSelection}
          disabled={selectionCount === 0}
        >
          Clear selection
        </Button>
        <Typography variant="body2" sx={{ ml: "auto" }}>
          Selected: <strong>{formatItemQty(selectedTotalQty, uom)}</strong>
          {selectionCount > 0 ? ` · ${selectionCount} row(s)` : ""}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
          gap: 1,
        }}
      >
        <Paper variant="outlined" sx={{ p: 1.5, borderColor: "error.main" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
            <ErrorOutlineIcon color="error" fontSize="small" />
            <Typography variant="subtitle2" fontWeight={700} color="error.main">
              Need write-off
            </Typography>
          </Box>
          <Typography variant="h6" fontWeight={700}>
            {formatItemQty(expiredQty, uom)}
          </Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 1.5, borderColor: "success.main" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
            <CheckCircleOutlineIcon color="success" fontSize="small" />
            <Typography variant="subtitle2" fontWeight={700} color="success.dark">
              Other expiry stock
            </Typography>
          </Box>
          <Typography variant="h6" fontWeight={700}>
            {formatItemQty(validQty, uom)}
          </Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
            <Inventory2OutlinedIcon color="action" fontSize="small" />
            <Typography variant="subtitle2" fontWeight={700}>
              Main / normal stock
            </Typography>
          </Box>
          <Typography variant="h6" fontWeight={700}>
            {formatItemQty(normalTotalQty, uom)}
          </Typography>
        </Paper>
      </Box>

      {loading ? (
        <CircularProgress size={28} sx={{ color: "var(--pallet-blue)", mx: "auto" }} />
      ) : (
        <Paper variant="outlined" sx={{ borderRadius: 1, overflow: "hidden" }}>
          <Box sx={{ px: 1.5, py: 1, bgcolor: "grey.100", borderBottom: 1, borderColor: "divider" }}>
            <Typography variant="subtitle2" fontWeight={700}>
              Item stock — main item &amp; batches
            </Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" sx={{ bgcolor: "var(--surface-bg-alt)" }} />
                  <TableCell sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)" }}>Source</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)" }}>Branch</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)" }}>
                    On hand
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)", width: 110 }}>
                    Write-off qty
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)" }}>Expiry</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "var(--surface-bg-alt)" }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ color: "text.secondary", py: 3 }}>
                      No stock on hand at this branch.
                    </TableCell>
                  </TableRow>
                ) : (
                  tableRows.map((row) => {
                    const isMain = row.category === "main";
                    const batch = row.batch;
                    const isSelected = isMain ? mainSelected : Boolean(batch && selected[batch.id]);

                    return (
                      <TableRow
                        key={row.key}
                        selected={isSelected}
                        hover
                        sx={rowHighlight(row.category, isSelected)}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            size="small"
                            checked={isSelected}
                            onChange={(e) =>
                              isMain
                                ? toggleMain(e.target.checked)
                                : batch && toggleBatch(batch, e.target.checked)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: isMain ? 700 : 600 }}>
                            {isMain ? "Main item" : row.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {isMain
                              ? `${item.item_number} · ${item.description ?? "—"}`
                              : row.sublabel ?? item.item_number}
                          </Typography>
                        </TableCell>
                        <TableCell>{row.location}</TableCell>
                        <TableCell align="right">{formatItemQty(row.qty, uom)}</TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            disabled={!isSelected}
                            value={
                              isSelected
                                ? isMain
                                  ? mainQtyInput
                                  : (batch && selected[batch.id]?.qty) ?? ""
                                : ""
                            }
                            onChange={(e) =>
                              isMain
                                ? setMainQty(e.target.value)
                                : batch && setBatchQty(batch.id, e.target.value, batch.qty)
                            }
                            inputProps={{ min: 0.01, max: row.qty, step: "0.01" }}
                            sx={{ width: 96, "& input": { py: 0.5, fontSize: 12 } }}
                          />
                        </TableCell>
                        <TableCell>
                          {row.expiryDate ? formatExpiryDate(row.expiryDate) : "—"}
                        </TableCell>
                        <TableCell>{categoryChip(row.category, batch, alertDays)}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {selectedTotalQty > 0 ? (
        <Alert severity="success">
          After write-off: <strong>Real stock {formatItemQty(remainingRealStock, uom)}</strong>
          {remainingTotalOnHand !== remainingRealStock ? (
            <> · Total on hand {formatItemQty(remainingTotalOnHand, uom)}</>
          ) : null}
          {nextExpiryAfter ? (
            <>
              {" "}
              · Next expiry <strong>{formatExpiryDate(nextExpiryAfter)}</strong>
            </>
          ) : null}
        </Alert>
      ) : null}

      {tableRows.length > 0 && selectionCount === 0 ? (
        <Alert severity="warning">
          Select at least one row (main item or batch), or use Select all expired.
        </Alert>
      ) : null}

      <TextField
        label="Reason"
        value={writeOffNotes}
        onChange={(e) => onWriteOffNotesChange(e.target.value)}
        fullWidth
        size="small"
        multiline
        minRows={2}
        placeholder="e.g. Expired — disposed"
      />
    </Box>
  );
};

export default WriteOffBatchPanel;
