import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useQueries } from "@tanstack/react-query";
import type { OfferSelectedBatch } from "../../../api/offersApi";
import { getItemInventoryBreakdown, type Item, type ItemBatch } from "../../../api/itemsApi";

export interface OfferBatchRow extends ItemBatch {
  item_number: string;
  description: string;
}

export interface OfferBatchesSelectModalProps {
  open: boolean;
  onClose: () => void;
  selectedBatchIds: number[];
  selectedItemIds: number[];
  catalogItems: Item[];
  onConfirm: (batchIds: number[], batches: OfferSelectedBatch[]) => void;
  title?: string;
}

function representativeItemIds(items: Item[], selectedIds: number[]): number[] {
  const selected = new Set(selectedIds);
  const byNumber = new Map<string, number>();
  for (const item of items) {
    if (!selected.has(item.id)) continue;
    const key = item.item_number?.trim();
    if (!key) continue;
    const existingId = byNumber.get(key);
    if (!existingId) {
      byNumber.set(key, item.id);
      continue;
    }
    const existing = items.find((i) => i.id === existingId);
    if (existing?.location !== "Main Location" && item.location === "Main Location") {
      byNumber.set(key, item.id);
    }
  }
  return [...byNumber.values()];
}

function filterBatches(rows: OfferBatchRow[], search: string): OfferBatchRow[] {
  const term = search.trim().toLowerCase();
  if (!term) return rows;
  return rows.filter((row) => {
    const hay = [
      row.item_number,
      row.description,
      row.batch_number,
      row.location,
      row.expiry_date,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(term);
  });
}

const OfferBatchesSelectModal: React.FC<OfferBatchesSelectModalProps> = ({
  open,
  onClose,
  selectedBatchIds,
  selectedItemIds,
  catalogItems,
  onConfirm,
  title = "Select batches",
}) => {
  const [search, setSearch] = useState("");
  const [draftIds, setDraftIds] = useState<number[]>([]);

  const itemIdsToLoad = useMemo(
    () => representativeItemIds(catalogItems, selectedItemIds),
    [catalogItems, selectedItemIds]
  );

  const batchQueries = useQueries({
    queries: itemIdsToLoad.map((itemId) => ({
      queryKey: ["offer-batch-picker", itemId],
      queryFn: () => getItemInventoryBreakdown(itemId),
      enabled: open && itemIdsToLoad.length > 0,
    })),
  });

  const isLoading = batchQueries.some((q) => q.isLoading);
  const isError = batchQueries.some((q) => q.isError);

  const allBatches = useMemo(() => {
    const rows: OfferBatchRow[] = [];
    const seen = new Set<number>();
    for (const query of batchQueries) {
      const item = query.data?.item;
      const batches = query.data?.batches ?? [];
      for (const batch of batches) {
        if ((batch.qty ?? 0) <= 0 || seen.has(batch.id)) continue;
        seen.add(batch.id);
        rows.push({
          ...batch,
          item_number: item?.item_number ?? "",
          description: item?.description ?? "",
        });
      }
    }
    return rows.sort((a, b) => {
      const itemCmp = a.item_number.localeCompare(b.item_number);
      if (itemCmp !== 0) return itemCmp;
      const expA = a.expiry_date ?? "9999-99-99";
      const expB = b.expiry_date ?? "9999-99-99";
      return expA.localeCompare(expB);
    });
  }, [batchQueries]);

  useEffect(() => {
    if (open) {
      setDraftIds([...selectedBatchIds]);
      setSearch("");
    }
  }, [open, selectedBatchIds]);

  const filtered = useMemo(() => filterBatches(allBatches, search), [allBatches, search]);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((row) => draftIds.includes(row.id));

  const someFilteredSelected =
    filtered.some((row) => draftIds.includes(row.id)) && !allFilteredSelected;

  const toggleAll = () => {
    if (allFilteredSelected) {
      const remove = new Set(filtered.map((r) => r.id));
      setDraftIds((prev) => prev.filter((id) => !remove.has(id)));
      return;
    }
    const add = new Set([...draftIds, ...filtered.map((r) => r.id)]);
    setDraftIds([...add]);
  };

  const toggleOne = (id: number) => {
    setDraftIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleConfirm = () => {
    const selectedRows = allBatches
      .filter((row) => draftIds.includes(row.id))
      .map(
        (row): OfferSelectedBatch => ({
          id: row.id,
          batch_number: row.batch_number,
          location: row.location,
          qty: row.qty,
          purchase_price: row.purchase_price,
          selling_price: row.selling_price,
          expiry_date: row.expiry_date,
          item_id: row.item_id ?? 0,
          item_number: row.item_number,
          description: row.description,
        })
      );
    onConfirm(draftIds, selectedRows);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      sx={{
        "& .MuiDialog-paper": {
          maxWidth: { xs: "96vw", sm: 720, md: 960 },
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, color: "var(--pallet-blue)", px: 3, pt: 2.5 }}>
        {title}
      </DialogTitle>
      <DialogContent sx={{ px: 3, pb: 1 }}>
        {selectedItemIds.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 2 }}>
            Select products first, then choose which stock batches this offer applies to.
          </Typography>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Optional: limit this offer to specific batches (e.g. near-expiry stock). Leave empty
              to apply to all batches of the selected products.
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.5,
                mb: 2,
              }}
            >
              <TextField
                size="small"
                placeholder="Search item, batch #, location, expiry…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                fullWidth
                sx={{ maxWidth: 400 }}
                autoFocus
              />
              <Typography variant="body2" color="text.secondary">
                {draftIds.length} batch{draftIds.length === 1 ? "" : "es"} selected
              </Typography>
            </Box>

            {isLoading ? (
              <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
                <CircularProgress size={32} sx={{ color: "var(--pallet-blue)" }} />
              </Box>
            ) : isError ? (
              <Typography color="error" sx={{ py: 2 }}>
                Failed to load batches.
              </Typography>
            ) : allBatches.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 2 }}>
                No batches with stock found for the selected products.
              </Typography>
            ) : (
              <TableContainer sx={{ maxHeight: 420, border: "1px solid var(--surface-border)", borderRadius: 1 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox" sx={{ bgcolor: "var(--surface-bg-alt)" }}>
                        <Checkbox
                          size="small"
                          indeterminate={someFilteredSelected}
                          checked={allFilteredSelected}
                          onChange={toggleAll}
                        />
                      </TableCell>
                      <TableCell sx={{ bgcolor: "var(--surface-bg-alt)", fontWeight: 600 }}>Item</TableCell>
                      <TableCell sx={{ bgcolor: "var(--surface-bg-alt)", fontWeight: 600 }}>Batch #</TableCell>
                      <TableCell sx={{ bgcolor: "var(--surface-bg-alt)", fontWeight: 600 }}>Location</TableCell>
                      <TableCell sx={{ bgcolor: "var(--surface-bg-alt)", fontWeight: 600 }}>Expiry</TableCell>
                      <TableCell align="right" sx={{ bgcolor: "var(--surface-bg-alt)", fontWeight: 600 }}>
                        Qty
                      </TableCell>
                      <TableCell align="right" sx={{ bgcolor: "var(--surface-bg-alt)", fontWeight: 600 }}>
                        Price
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                          No batches match your search.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((row) => (
                        <TableRow
                          key={row.id}
                          hover
                          selected={draftIds.includes(row.id)}
                          onClick={() => toggleOne(row.id)}
                          sx={{ cursor: "pointer" }}
                        >
                          <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              size="small"
                              checked={draftIds.includes(row.id)}
                              onChange={() => toggleOne(row.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                              {row.description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {row.item_number}
                            </Typography>
                          </TableCell>
                          <TableCell>{row.batch_number}</TableCell>
                          <TableCell>{row.location ?? "—"}</TableCell>
                          <TableCell>{row.expiry_date ?? "—"}</TableCell>
                          <TableCell align="right">{Number(row.qty).toFixed(2)}</TableCell>
                          <TableCell align="right">
                            {Number(row.selling_price ?? row.purchase_price ?? 0).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={selectedItemIds.length === 0}
          sx={{
            bgcolor: "var(--pallet-blue)",
            "&:hover": { bgcolor: "var(--pallet-main-blue)" },
          }}
        >
          {draftIds.length > 0 ? `Apply (${draftIds.length})` : "Apply (all batches)"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OfferBatchesSelectModal;
