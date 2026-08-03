import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import {
  adjustItemInventory,
  createItemBatch,
  deleteItemBatch,
  getItemAdditionalCharges,
  getItemBatches,
  getItemInventoryBreakdown,
  getItemCostView,
  getItem,
  getItemHistory,
  saveItemAdditionalCharges,
  updateItemBatch,
  writeOffItemInventory,
  type Item,
  type ItemAdditionalChargeRow,
  type ItemBatch,
} from "../../../api/itemsApi";
import { getFriendlyErrorMessage } from "../../../utils/getFriendlyErrorMessage";
import { formatDashboardRs } from "../shared/dashboardShared";
import PosConfirmDeleteDialog from "../shared/PosConfirmDeleteDialog";
import { useConfirmDelete } from "../shared/useConfirmDelete";
import { ItemExpiryChip } from "./ItemExpiryChip";
import type { WriteOffBatchLine } from "../../../api/itemsApi";
import { formatExpiryDate, formatItemQty } from "./itemInventoryUtils";
import { invalidatePosQueries } from "../../../utils/invalidatePosQueries";
import WriteOffBatchPanel from "./WriteOffBatchPanel";
import ItemBatchVariantsPanel from "./ItemBatchVariantsPanel";

type DialogKind =
  | "view"
  | "history"
  | "cost"
  | "adjust"
  | "writeOff"
  | "batches"
  | "batchVariants"
  | "charges"
  | null;

interface Props {
  item: Item | null;
  kind: DialogKind;
  onClose: () => void;
  onSaved: () => void;
}

const ItemInventoryActionDialogs: React.FC<Props> = ({ item, kind, onClose, onSaved }) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const open = Boolean(item && kind);
  const itemId = item?.id ?? 0;

  const [newQty, setNewQty] = useState("");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [writeOffNotes, setWriteOffNotes] = useState("");
  const [writeOffBatchLines, setWriteOffBatchLines] = useState<WriteOffBatchLine[]>([]);
  const [writeOffMainQty, setWriteOffMainQty] = useState(0);
  const [batchNumber, setBatchNumber] = useState("");
  const [batchQty, setBatchQty] = useState("");
  const [batchPurchasePrice, setBatchPurchasePrice] = useState("");
  const [batchSellingPrice, setBatchSellingPrice] = useState("");
  const [batchExpiry, setBatchExpiry] = useState("");
  const [editingBatchId, setEditingBatchId] = useState<number | null>(null);
  const [manualBatchCreate, setManualBatchCreate] = useState(false);
  const [charges, setCharges] = useState<ItemAdditionalChargeRow[]>([]);
  const deleteConfirm = useConfirmDelete();

  const itemPurchasePrice = (row: Item | null | undefined) =>
    row?.purchase_price ?? row?.last_purchase_price ?? 0;
  const itemSellingPrice = (row: Item | null | undefined) => row?.selling_price ?? 0;
  const batchSellingPriceForRow = (
    batch: ItemBatch,
    row: Item | null | undefined = item
  ) => batch.selling_price ?? itemSellingPrice(row);

  const clearBatchForm = (row: Item | null | undefined = item) => {
    setEditingBatchId(null);
    setManualBatchCreate(false);
    setBatchNumber("");
    setBatchQty("");
    setBatchPurchasePrice(String(itemPurchasePrice(row)));
    setBatchSellingPrice(String(itemSellingPrice(row)));
    setBatchExpiry("");
  };

  const startEditBatch = (batch: ItemBatch) => {
    setEditingBatchId(batch.id);
    setManualBatchCreate(true);
    setBatchNumber(batch.batch_number);
    setBatchQty(String(batch.qty));
    setBatchPurchasePrice(String(batch.purchase_price));
    setBatchSellingPrice(String(batchSellingPriceForRow(batch)));
    setBatchExpiry(batch.expiry_date ?? "");
  };

  useEffect(() => {
    if (!item) return;
    setNewQty(String(item.qty ?? 0));
    setAdjustNotes("");
    setWriteOffNotes("");
    setWriteOffBatchLines([]);
    setWriteOffMainQty(0);
    clearBatchForm(item);
  }, [item, kind]);

  const viewQuery = useQuery({
    queryKey: ["item-view", itemId],
    queryFn: () => getItem(itemId),
    enabled: open && kind === "view" && itemId > 0,
  });

  const historyQuery = useQuery({
    queryKey: ["item-history", itemId],
    queryFn: () => getItemHistory(itemId),
    enabled: open && kind === "history" && itemId > 0,
  });

  const costQuery = useQuery({
    queryKey: ["item-cost", itemId],
    queryFn: () => getItemCostView(itemId),
    enabled: open && kind === "cost" && itemId > 0,
  });

  const batchesQuery = useQuery({
    queryKey: ["item-batches", itemId],
    queryFn: () => getItemBatches(itemId),
    enabled: open && (kind === "batches" || kind === "writeOff") && itemId > 0,
  });

  const breakdownQuery = useQuery({
    queryKey: ["item-inventory-breakdown", itemId],
    queryFn: () => getItemInventoryBreakdown(itemId),
    enabled: open && kind === "batchVariants" && itemId > 0,
  });

  const chargesQuery = useQuery({
    queryKey: ["item-charges", itemId],
    queryFn: () => getItemAdditionalCharges(itemId),
    enabled: open && kind === "charges" && itemId > 0,
  });

  useEffect(() => {
    if (chargesQuery.data?.charges) {
      setCharges(
        chargesQuery.data.charges.length > 0
          ? chargesQuery.data.charges
          : [{ name: "", amount: 0, charge_type: "fixed", is_active: true }]
      );
    }
  }, [chargesQuery.data]);

  const adjustMutation = useMutation({
    mutationFn: () => adjustItemInventory(itemId, { new_qty: parseFloat(newQty) || 0, notes: adjustNotes }),
    onSuccess: () => {
      enqueueSnackbar("Inventory adjusted", { variant: "success" });
      onSaved();
      onClose();
    },
    onError: (err: unknown) =>
      enqueueSnackbar(getFriendlyErrorMessage(err, "Adjustment failed"), { variant: "error" }),
  });

  const writeOffMutation = useMutation({
    mutationFn: () => {
      const payload: Parameters<typeof writeOffItemInventory>[1] = {
        notes: writeOffNotes,
      };
      if (writeOffBatchLines.length > 0) {
        payload.batches = writeOffBatchLines;
      }
      if (writeOffMainQty > 0) {
        payload.main_qty = writeOffMainQty;
      }
      if (!payload.batches?.length && !payload.main_qty) {
        throw new Error("Select main item stock or at least one batch to write off.");
      }
      return writeOffItemInventory(itemId, payload);
    },
    onSuccess: (updatedItem) => {
      const realStock = updatedItem.sellable_qty ?? updatedItem.qty ?? 0;
      const nextExpiry =
        updatedItem.nearest_expiry_date ?? updatedItem.expiry_date ?? null;
      const expiryPart = nextExpiry
        ? ` Next expiry: ${formatExpiryDate(nextExpiry)}.`
        : "";
      enqueueSnackbar(
        `Write-off recorded. Real stock: ${formatItemQty(realStock, updatedItem.uom)}.${expiryPart}`,
        { variant: "success" }
      );
      invalidatePosQueries(queryClient);
      void queryClient.invalidateQueries({ queryKey: ["item-batches", itemId] });
      void queryClient.invalidateQueries({ queryKey: ["item-inventory-breakdown", itemId] });
      void queryClient.invalidateQueries({ queryKey: ["item-view", itemId] });
      onSaved();
      onClose();
    },
    onError: (err: unknown) =>
      enqueueSnackbar(getFriendlyErrorMessage(err, "Write-off failed"), { variant: "error" }),
  });

  const batchMutation = useMutation({
    mutationFn: () => {
      const payload = {
        batch_number: batchNumber || undefined,
        qty: parseFloat(batchQty) || 0,
        purchase_price: parseFloat(batchPurchasePrice) || 0,
        selling_price: parseFloat(batchSellingPrice) || 0,
        expiry_date: batchExpiry || undefined,
      };
      if (editingBatchId) {
        return updateItemBatch(itemId, editingBatchId, payload);
      }
      return createItemBatch(itemId, payload);
    },
    onSuccess: (result) => {
      let msg = "Batch created";
      if (editingBatchId) {
        msg = "Batch updated";
      } else {
        const created = result as { merged?: boolean; message?: string };
        msg =
          created.message ??
          (created.merged ? "Stock added to existing batch (same expiry & purchase price)" : "Batch created");
      }
      enqueueSnackbar(msg, { variant: "success" });
      invalidatePosQueries(queryClient);
      onSaved();
      void queryClient.invalidateQueries({ queryKey: ["item-batches", itemId] });
      void queryClient.invalidateQueries({ queryKey: ["item-inventory-breakdown", itemId] });
      clearBatchForm();
    },
    onError: (err: unknown) =>
      enqueueSnackbar(
        getFriendlyErrorMessage(err, editingBatchId ? "Failed to update batch" : "Failed to create batch"),
        { variant: "error" }
      ),
  });

  const deleteBatchMutation = useMutation({
    mutationFn: (batchId: number) => deleteItemBatch(itemId, batchId),
    onSuccess: () => {
      enqueueSnackbar("Batch deleted", { variant: "success" });
      onSaved();
      void queryClient.invalidateQueries({ queryKey: ["item-batches", itemId] });
      void queryClient.invalidateQueries({ queryKey: ["item-inventory-breakdown", itemId] });
      if (editingBatchId) {
        clearBatchForm();
      }
    },
    onError: (err: unknown) =>
      enqueueSnackbar(getFriendlyErrorMessage(err, "Failed to delete batch"), { variant: "error" }),
  });

  const chargesMutation = useMutation({
    mutationFn: () => saveItemAdditionalCharges(itemId, charges.filter((c) => c.name.trim())),
    onSuccess: () => {
      enqueueSnackbar("Additional charges saved", { variant: "success" });
      onSaved();
      onClose();
    },
    onError: (err: unknown) =>
      enqueueSnackbar(getFriendlyErrorMessage(err, "Failed to save charges"), { variant: "error" }),
  });

  if (!item || !kind) return null;

  const titleMap: Record<Exclude<DialogKind, null>, string> = {
    view: `View — ${item.item_number}`,
    history: `History — ${item.item_number}`,
    cost: `Cost view — ${item.item_number}`,
    adjust: `Inventory adjustment — ${item.item_number}`,
    writeOff: `Write-off — ${item.item_number}`,
    batches: `Add expiry stock — ${item.item_number}`,
    batchVariants: `Item batch & variants — ${item.item_number}`,
    charges: `Additional charges — ${item.item_number}`,
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={kind === "batchVariants" || kind === "writeOff" ? "lg" : "md"}
      fullWidth
    >
      <DialogTitle sx={{ fontWeight: 700 }}>{titleMap[kind]}</DialogTitle>
      <DialogContent dividers>
        {kind === "view" && (
          viewQuery.isLoading ? (
            <CircularProgress size={24} />
          ) : (
            <Box sx={{ display: "grid", gap: 0.75 }}>
              <Typography><strong>Description:</strong> {viewQuery.data?.description ?? item.description}</Typography>
              <Typography><strong>Branch:</strong> {viewQuery.data?.location ?? item.location}</Typography>
              <Typography><strong>Category:</strong> {viewQuery.data?.category ?? item.category ?? "—"}</Typography>
              <Typography>
                <strong>Real stock:</strong>{" "}
                {formatItemQty(
                  viewQuery.data?.sellable_qty ?? viewQuery.data?.qty ?? item.sellable_qty ?? item.qty ?? 0,
                  viewQuery.data?.uom ?? item.uom
                )}
                {(viewQuery.data?.expired_stock_qty ?? item.expired_stock_qty ?? 0) > 0 ? (
                  <>
                    {" "}
                    (expired{" "}
                    {formatItemQty(
                      viewQuery.data?.expired_stock_qty ?? item.expired_stock_qty ?? 0,
                      viewQuery.data?.uom ?? item.uom
                    )}
                    )
                  </>
                ) : null}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total on hand:{" "}
                {formatItemQty(viewQuery.data?.qty ?? item.qty ?? 0, viewQuery.data?.uom ?? item.uom)}
              </Typography>
              <Typography><strong>UOM:</strong> {(viewQuery.data?.uom ?? item.uom ?? "pcs").toUpperCase()}</Typography>
              <Typography component="div">
                <strong>Expiry:</strong>{" "}
                {(viewQuery.data?.nearest_expiry_date ?? viewQuery.data?.expiry_date ?? item.nearest_expiry_date ?? item.expiry_date) ? (
                  <ItemExpiryChip item={viewQuery.data ?? item} size="small" />
                ) : (
                  "—"
                )}
              </Typography>
              <Typography><strong>Purchase:</strong> {formatDashboardRs(viewQuery.data?.purchase_price ?? item.purchase_price ?? 0)}</Typography>
              <Typography><strong>Selling:</strong> {formatDashboardRs(viewQuery.data?.selling_price ?? item.selling_price ?? 0)}</Typography>
              <Typography><strong>Status:</strong> {viewQuery.data?.status ?? item.status}</Typography>
            </Box>
          )
        )}

        {kind === "history" && (
          historyQuery.isLoading ? (
            <CircularProgress size={24} />
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Reference</TableCell>
                  <TableCell align="right">Qty change</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(historyQuery.data?.history ?? []).map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{row.created_at ?? "—"}</TableCell>
                    <TableCell>{row.movement_type}</TableCell>
                    <TableCell>{row.reference_label ?? "—"}</TableCell>
                    <TableCell align="right">{row.qty_change.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        )}

        {kind === "cost" && (
          costQuery.isLoading ? (
            <CircularProgress size={24} />
          ) : costQuery.data ? (
            <Box sx={{ display: "grid", gap: 1 }}>
              <Typography>Branch: {item.location}</Typography>
              <Typography>Qty on hand: {(costQuery.data.costing.qty_on_hand ?? 0).toFixed(2)}</Typography>
              <Typography>BID / unit cost: {formatDashboardRs(costQuery.data.costing.unit_cost)}</Typography>
              <Typography>Last purchase: {formatDashboardRs(costQuery.data.costing.last_purchase_price)}</Typography>
              <Typography>Selling price: {formatDashboardRs(costQuery.data.costing.selling_price)}</Typography>
              <Typography>Inventory value: {formatDashboardRs(costQuery.data.costing.inventory_value)}</Typography>
              <Typography>Margin: {costQuery.data.costing.margin_percent}% · Markup: {costQuery.data.costing.markup_percent}%</Typography>
            </Box>
          ) : null
        )}

        {kind === "adjust" && (
          <Box sx={{ display: "grid", gap: 2, pt: 1 }}>
            <Typography variant="body2">
              Current qty: {formatItemQty(item.qty ?? 0, item.uom)}
            </Typography>
            <TextField label="New quantity" type="number" value={newQty} onChange={(e) => setNewQty(e.target.value)} fullWidth size="small" />
            <TextField label="Notes" value={adjustNotes} onChange={(e) => setAdjustNotes(e.target.value)} fullWidth size="small" multiline minRows={2} />
          </Box>
        )}

        {kind === "writeOff" && (
          <WriteOffBatchPanel
            item={batchesQuery.data?.item ?? item}
            batches={batchesQuery.data?.batches ?? []}
            loading={batchesQuery.isLoading}
            writeOffNotes={writeOffNotes}
            onWriteOffNotesChange={setWriteOffNotes}
            onBatchLinesChange={setWriteOffBatchLines}
            onMainQtyChange={setWriteOffMainQty}
          />
        )}

        {kind === "batchVariants" && (
          <ItemBatchVariantsPanel
            item={item}
            data={breakdownQuery.data}
            loading={breakdownQuery.isLoading}
          />
        )}

        {kind === "batches" && (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              <strong>Main item stock</strong> uses the item&apos;s purchase price and expiry (unbatched)
              until expiry passes. Same price + expiry on purchase → main qty. After expiry, main
              stock moves to an expired batch automatically. Different price or expiry → batch.
            </Alert>
            <Box
              sx={{
                mb: 2,
                p: 1.5,
                borderRadius: 1,
                bgcolor: "action.hover",
                display: "flex",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Typography variant="body2">
                <strong>Item purchase:</strong>{" "}
                {formatDashboardRs(
                  itemPurchasePrice(batchesQuery.data?.item ?? item)
                )}
              </Typography>
              <Typography variant="body2">
                <strong>Item selling:</strong>{" "}
                {formatDashboardRs(itemSellingPrice(batchesQuery.data?.item ?? item))}
              </Typography>
            </Box>
            {batchesQuery.isLoading ? (
              <CircularProgress size={24} />
            ) : (
              <Table size="small" sx={{ mb: 2 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Batch</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell>Expiry</TableCell>
                    <TableCell align="right">Purchase (Rs)</TableCell>
                    <TableCell align="right">Selling (Rs)</TableCell>
                    <TableCell align="right">Line value</TableCell>
                    <TableCell align="center" width={96}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(batchesQuery.data?.batches ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ color: "text.secondary" }}>
                        No batches yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    (batchesQuery.data?.batches ?? []).map((b) => (
                      <TableRow
                        key={b.id}
                        selected={editingBatchId === b.id}
                        hover
                      >
                        <TableCell>{b.batch_number}</TableCell>
                        <TableCell align="right">
                          {formatItemQty(b.qty, batchesQuery.data?.item?.uom ?? item.uom)}
                        </TableCell>
                        <TableCell>{b.expiry_date ? formatExpiryDate(b.expiry_date) : "—"}</TableCell>
                        <TableCell align="right">{formatDashboardRs(b.purchase_price)}</TableCell>
                        <TableCell align="right">
                          {formatDashboardRs(batchSellingPriceForRow(b, batchesQuery.data?.item ?? item))}
                        </TableCell>
                        <TableCell align="right">
                          {formatDashboardRs(b.qty * b.purchase_price)}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Edit batch">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => startEditBatch(b)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete batch">
                            <IconButton
                              size="small"
                              color="error"
                              disabled={deleteBatchMutation.isPending}
                              onClick={() =>
                                deleteConfirm.requestDelete({
                                  title: "Delete batch",
                                  message: `Delete batch ${b.batch_number}? Remaining stock in this batch will be removed from inventory.`,
                                  onConfirm: () => deleteBatchMutation.mutate(b.id),
                                })
                              }
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {editingBatchId ? "Edit batch" : "Add stock to batch"}
            </Typography>
            {!editingBatchId ? (
              <Box sx={{ mb: 1.25, display: "flex", alignItems: "center", gap: 1 }}>
                <Button
                  size="small"
                  variant={manualBatchCreate ? "contained" : "outlined"}
                  onClick={() => setManualBatchCreate((prev) => !prev)}
                >
                  {manualBatchCreate ? "Manual batch create: ON" : "Manual batch create"}
                </Button>
                <Typography variant="caption" color="text.secondary">
                  {manualBatchCreate
                    ? "Enter batch number manually."
                    : "Batch number will auto-generate when new batch is created."}
                </Typography>
              </Box>
            ) : null}
            {!editingBatchId &&
            (() => {
              const purchase = parseFloat(batchPurchasePrice) || 0;
              const itemRow = batchesQuery.data?.item ?? item;
              const mainPrice = itemPurchasePrice(itemRow);
              const mainExpiry = itemRow.expiry_date ?? "";
              const expiryMatch = (mainExpiry || "") === (batchExpiry.trim() || "");
              const priceMatch = purchase <= 0 || Math.abs(mainPrice - purchase) < 0.005;
              if (expiryMatch && priceMatch) {
                return (
                  <Alert severity="success" sx={{ mb: 1.5 }}>
                    Same as main item purchase price and expiry — qty will be added to{" "}
                    <strong>main item stock</strong> (no batch).
                  </Alert>
                );
              }
              const mergeBatch = (batchesQuery.data?.batches ?? []).some((b) => {
                if (b.qty <= 0) return false;
                const bExpiry = (b.expiry_date ?? "") === (batchExpiry.trim() || "");
                const bPrice =
                  purchase <= 0 || Math.abs((b.purchase_price ?? 0) - purchase) < 0.005;
                return bExpiry && bPrice;
              });
              if (!mergeBatch) return null;
              return (
                <Alert severity="success" sx={{ mb: 1.5 }}>
                  Matching batch exists — qty will be added to that batch.
                </Alert>
              );
            })()}
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "flex-start" }}>
              <TextField
                label="Qty to add *"
                size="small"
                type="number"
                required
                inputProps={{ min: 0.01, step: "0.01" }}
                value={batchQty}
                onChange={(e) => setBatchQty(e.target.value)}
                helperText={item.uom ? `Unit: ${item.uom}` : undefined}
                sx={{ width: 110 }}
              />
              <TextField
                label="Expiry date"
                size="small"
                type="date"
                value={batchExpiry}
                onChange={(e) => setBatchExpiry(e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText="Optional (leave blank for non-expiry batch)"
                sx={{ minWidth: 160 }}
              />
              <TextField
                label={manualBatchCreate ? "Batch no *" : "Batch no"}
                size="small"
                value={batchNumber}
                onChange={(e) => {
                  setBatchNumber(e.target.value);
                  if (e.target.value.trim()) {
                    setManualBatchCreate(true);
                  }
                }}
                placeholder={manualBatchCreate ? "Enter batch number" : "Auto if new batch"}
                required={manualBatchCreate}
                disabled={!!editingBatchId}
                sx={{ minWidth: 140 }}
              />
              <TextField
                label="Purchase price (Rs)"
                size="small"
                type="number"
                inputProps={{ min: 0, step: "0.01" }}
                value={batchPurchasePrice}
                onChange={(e) => setBatchPurchasePrice(e.target.value)}
                helperText="Cost for this batch"
                sx={{ minWidth: 160 }}
              />
              <TextField
                label="Selling price (Rs)"
                size="small"
                type="number"
                inputProps={{ min: 0, step: "0.01" }}
                value={batchSellingPrice}
                onChange={(e) => setBatchSellingPrice(e.target.value)}
                helperText="Retail price for this batch"
                sx={{ minWidth: 160 }}
              />
            </Box>
            {batchQty && batchPurchasePrice ? (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                Batch stock value: {formatDashboardRs(
                  (parseFloat(batchQty) || 0) * (parseFloat(batchPurchasePrice) || 0)
                )}
              </Typography>
            ) : null}
          </Box>
        )}

        {kind === "charges" && (
          <Box sx={{ display: "grid", gap: 1.5, pt: 1 }}>
            {charges.map((c, idx) => (
              <Box key={idx} sx={{ display: "flex", gap: 1 }}>
                <TextField label="Name" size="small" value={c.name} onChange={(e) => {
                  const next = [...charges];
                  next[idx] = { ...next[idx], name: e.target.value };
                  setCharges(next);
                }} sx={{ flex: 2 }} />
                <TextField label="Amount" size="small" type="number" value={c.amount} onChange={(e) => {
                  const next = [...charges];
                  next[idx] = { ...next[idx], amount: parseFloat(e.target.value) || 0 };
                  setCharges(next);
                }} sx={{ flex: 1 }} />
              </Box>
            ))}
            <Button size="small" onClick={() => setCharges([...charges, { name: "", amount: 0, charge_type: "fixed", is_active: true }])}>
              Add charge row
            </Button>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {kind === "adjust" && (
          <Button variant="contained" onClick={() => adjustMutation.mutate()} disabled={adjustMutation.isPending}>
            Save adjustment
          </Button>
        )}
        {kind === "writeOff" && (
          <Button
            variant="contained"
            color="error"
            onClick={() => writeOffMutation.mutate()}
            disabled={
              writeOffMutation.isPending ||
              (writeOffBatchLines.length === 0 && writeOffMainQty <= 0)
            }
          >
            Write off
          </Button>
        )}
        {kind === "batches" && editingBatchId && (
          <Button onClick={() => clearBatchForm()} disabled={batchMutation.isPending}>
            Cancel edit
          </Button>
        )}
        {kind === "batches" && (
          <Button
            variant="contained"
            onClick={() => batchMutation.mutate()}
            disabled={
              batchMutation.isPending ||
              (!editingBatchId &&
                ((parseFloat(batchQty) || 0) < 0.01 ||
                  (manualBatchCreate && !batchNumber.trim())))
            }
          >
            {editingBatchId ? "Save batch" : "Add stock"}
          </Button>
        )}
        {kind === "charges" && (
          <Button variant="contained" onClick={() => chargesMutation.mutate()} disabled={chargesMutation.isPending}>
            Save charges
          </Button>
        )}
      </DialogActions>
      <PosConfirmDeleteDialog
        open={deleteConfirm.dialog.open}
        title={deleteConfirm.dialog.title}
        message={deleteConfirm.dialog.message}
        onCancel={deleteConfirm.close}
        onConfirm={deleteConfirm.confirm}
        loading={deleteBatchMutation.isPending}
      />
    </Dialog>
  );
};

export default ItemInventoryActionDialogs;
export type { DialogKind as ItemActionDialogKind };
