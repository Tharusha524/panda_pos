import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { useQueries, useQuery } from "@tanstack/react-query";
import type { OfferSelectedBatch } from "../../../api/offersApi";
import { getItemInventoryBreakdown, getItems, type Item, type ItemBatch } from "../../../api/itemsApi";
import { expandItemIdsByItemNumber } from "./offerPayload";
import {
  batchToOfferSelected,
  buildOfferCatalogRows,
  isProductIndeterminate,
  isProductSelected,
  type OfferCatalogRow,
} from "./offerProductBatchUtils";

export interface OfferProductSelectionResult {
  item_ids: number[];
  item_batch_ids: number[];
  batches: OfferSelectedBatch[];
}

export interface OfferProductsSelectModalProps {
  open: boolean;
  onClose: () => void;
  selectedIds: number[];
  selectedBatchIds?: number[];
  onConfirm: (result: OfferProductSelectionResult) => void;
  title?: string;
  expandAll?: boolean;
}

function filterRows(rows: OfferCatalogRow[], search: string): OfferCatalogRow[] {
  const term = search.trim().toLowerCase();
  if (!term) return rows;
  return rows.filter((item) => {
    const hay = [
      item.item_number,
      item.description,
      item.category,
      item.sub_category,
      item.sku,
      item.item_code,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(term);
  });
}

function productKeysFromSelectedIds(items: Item[], selectedIds: number[]): Set<string> {
  const idSet = new Set(selectedIds);
  const keys = new Set<string>();
  for (const item of items) {
    if (idSet.has(item.id) && item.item_number?.trim()) {
      keys.add(item.item_number.trim());
    }
  }
  return keys;
}

const OfferProductsSelectModal: React.FC<OfferProductsSelectModalProps> = ({
  open,
  onClose,
  selectedIds,
  selectedBatchIds = [],
  onConfirm,
  title = "Select products & batches",
  expandAll = false,
}) => {
  const [search, setSearch] = useState("");
  const [productKeys, setProductKeys] = useState<Set<string>>(new Set());
  const [batchIds, setBatchIds] = useState<Set<number>>(new Set());
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const { data, isLoading, isError } = useQuery({
    queryKey: ["offer-products-modal"],
    queryFn: () => getItems(),
    enabled: open,
  });

  const items = data?.items ?? [];
  const catalogRows = useMemo(() => buildOfferCatalogRows(items), [items]);
  const filtered = useMemo(() => filterRows(catalogRows, search), [catalogRows, search]);

  const rowsToLoad = useMemo(() => {
    const keys = new Set<string>();
    for (const row of filtered) {
      if (row.has_batches || (row.batch_count ?? 0) > 0) {
        keys.add(row.item_number);
      }
    }
    for (const key of expandedKeys) keys.add(key);
    return catalogRows.filter((row) => keys.has(row.item_number));
  }, [catalogRows, filtered, expandedKeys]);

  const batchQueries = useQueries({
    queries: rowsToLoad.map((row) => ({
      queryKey: ["offer-product-batches", row.id],
      queryFn: () => getItemInventoryBreakdown(row.id),
      enabled: open,
      staleTime: 60_000,
    })),
  });

  const batchesByItemNumber = useMemo(() => {
    const map = new Map<string, ItemBatch[]>();
    rowsToLoad.forEach((row, index) => {
      const batches = batchQueries[index]?.data?.batches ?? [];
      if (batches.length > 0) {
        map.set(row.item_number, batches);
      }
    });
    return map;
  }, [rowsToLoad, batchQueries]);

  const batchesLoading = batchQueries.some((q) => q.isLoading);

  const wasOpenRef = useRef(false);

  useEffect(() => {
    const justOpened = open && !wasOpenRef.current;
    wasOpenRef.current = open;
    if (!justOpened) return;

    setProductKeys(productKeysFromSelectedIds(items, selectedIds));
    setBatchIds(new Set(selectedBatchIds));
    setSearch("");
    if (expandAll) {
      const withBatches = buildOfferCatalogRows(items)
        .filter((r) => r.has_batches || (r.batch_count ?? 0) > 0)
        .map((r) => r.item_number);
      setExpandedKeys(new Set(withBatches));
    } else {
      setExpandedKeys(new Set());
    }
  }, [open, selectedIds, selectedBatchIds, expandAll, items]);

  const toggleExpanded = (itemNumber: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(itemNumber)) next.delete(itemNumber);
      else next.add(itemNumber);
      return next;
    });
  };

  const toggleProduct = (row: OfferCatalogRow) => {
    const key = row.item_number;
    const batches = batchesByItemNumber.get(key) ?? [];
    const selected = isProductSelected(row, productKeys, batchIds, batchesByItemNumber);

    if (selected) {
      setProductKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      if (batches.length > 0) {
        const batchIdSet = new Set(batches.map((b) => b.id));
        setBatchIds((prev) => {
          const next = new Set(prev);
          for (const id of batchIdSet) next.delete(id);
          return next;
        });
      }
      return;
    }

    setProductKeys((prev) => new Set(prev).add(key));
  };

  const toggleBatch = (row: OfferCatalogRow, batchId: number) => {
    setBatchIds((prev) => {
      const next = new Set(prev);
      if (next.has(batchId)) next.delete(batchId);
      else next.add(batchId);
      return next;
    });
    setProductKeys((prev) => new Set(prev).add(row.item_number));
  };

  const allFilteredSelected =
    filtered.length > 0 &&
    filtered.every((row) => isProductSelected(row, productKeys, batchIds, batchesByItemNumber));

  const someFilteredSelected =
    filtered.some((row) => isProductSelected(row, productKeys, batchIds, batchesByItemNumber)) &&
    !allFilteredSelected;

  const toggleAll = () => {
    if (allFilteredSelected) {
      const removeKeys = new Set(filtered.map((r) => r.item_number));
      setProductKeys((prev) => {
        const next = new Set(prev);
        for (const key of removeKeys) next.delete(key);
        return next;
      });
      setBatchIds((prev) => {
        const next = new Set(prev);
        for (const row of filtered) {
          for (const batch of batchesByItemNumber.get(row.item_number) ?? []) {
            next.delete(batch.id);
          }
        }
        return next;
      });
      return;
    }

    setProductKeys((prev) => {
      const next = new Set(prev);
      for (const row of filtered) next.add(row.item_number);
      return next;
    });
  };

  const selectedProductCount = productKeys.size;
  const selectedBatchCount = batchIds.size;

  const handleConfirm = () => {
    const repIds = catalogRows
      .filter((row) => productKeys.has(row.item_number))
      .map((row) => row.id);

    const expandedItemIds = expandItemIdsByItemNumber(items, repIds);
    const selectedBatchList: OfferSelectedBatch[] = [];

    for (const row of catalogRows) {
      const batches = batchesByItemNumber.get(row.item_number) ?? [];
      for (const batch of batches) {
        if (batchIds.has(batch.id)) {
          selectedBatchList.push(batchToOfferSelected(batch, row));
        }
      }
    }

    onConfirm({
      item_ids: expandedItemIds,
      item_batch_ids: [...batchIds],
      batches: selectedBatchList,
    });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      scroll="paper"
      sx={{
        "& .MuiDialog-paper": {
          maxWidth: { xs: "96vw", sm: 900, md: 1100 },
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, color: "var(--pallet-blue)", px: 3, pt: 2.5 }}>
        {title}
      </DialogTitle>
      <DialogContent sx={{ px: 3, pb: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Select a product to include all its batches, or expand a row and tick specific batches
          only.
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
            placeholder="Search by item #, description, category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
            sx={{ maxWidth: 400 }}
            autoFocus
          />
          <Typography variant="body2" color="text.secondary">
            {selectedProductCount} product{selectedProductCount === 1 ? "" : "s"}
            {selectedBatchCount > 0 ? ` · ${selectedBatchCount} batch${selectedBatchCount === 1 ? "" : "es"}` : ""}
          </Typography>
        </Box>

        {isLoading ? (
          <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={32} sx={{ color: "var(--pallet-blue)" }} />
          </Box>
        ) : isError ? (
          <Typography color="error" sx={{ py: 2 }}>
            Failed to load products.
          </Typography>
        ) : (
          <TableContainer sx={{ maxHeight: 480, border: "1px solid var(--surface-border)", borderRadius: 1 }}>
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
                  <TableCell sx={{ bgcolor: "var(--surface-bg-alt)", width: 40 }} />
                  <TableCell sx={{ bgcolor: "var(--surface-bg-alt)", fontWeight: 600 }}>Item #</TableCell>
                  <TableCell sx={{ bgcolor: "var(--surface-bg-alt)", fontWeight: 600 }}>Description</TableCell>
                  <TableCell sx={{ bgcolor: "var(--surface-bg-alt)", fontWeight: 600 }}>Category</TableCell>
                  <TableCell align="center" sx={{ bgcolor: "var(--surface-bg-alt)", fontWeight: 600 }}>
                    Batches
                  </TableCell>
                  <TableCell align="right" sx={{ bgcolor: "var(--surface-bg-alt)", fontWeight: 600 }}>
                    Retail
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      No products found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((row) => {
                    const batches = batchesByItemNumber.get(row.item_number) ?? [];
                    const hasBatchList = row.has_batches || (row.batch_count ?? 0) > 0 || batches.length > 0;
                    const expanded = expandedKeys.has(row.item_number);
                    const productChecked = isProductSelected(row, productKeys, batchIds, batchesByItemNumber);
                    const productIndeterminate = isProductIndeterminate(
                      row,
                      productKeys,
                      batchIds,
                      batchesByItemNumber
                    );
                    const specificBatchCount = batches.filter((b) => batchIds.has(b.id)).length;

                    return (
                      <React.Fragment key={row.item_number}>
                        <TableRow
                          hover
                          selected={productChecked}
                          sx={{ cursor: hasBatchList ? "pointer" : "default" }}
                        >
                          <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              size="small"
                              checked={productChecked}
                              indeterminate={productIndeterminate}
                              onChange={() => toggleProduct(row)}
                            />
                          </TableCell>
                          <TableCell padding="none" sx={{ width: 40 }}>
                            {hasBatchList ? (
                              <IconButton
                                size="small"
                                aria-label={expanded ? "Collapse batches" : "Expand batches"}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpanded(row.item_number);
                                }}
                              >
                                {expanded ? (
                                  <KeyboardArrowUpIcon fontSize="small" />
                                ) : (
                                  <KeyboardArrowDownIcon fontSize="small" />
                                )}
                              </IconButton>
                            ) : null}
                          </TableCell>
                          <TableCell onClick={() => hasBatchList && toggleExpanded(row.item_number)}>
                            {row.item_number}
                          </TableCell>
                          <TableCell onClick={() => hasBatchList && toggleExpanded(row.item_number)}>
                            {row.description}
                          </TableCell>
                          <TableCell onClick={() => hasBatchList && toggleExpanded(row.item_number)}>
                            {[row.category, row.sub_category].filter(Boolean).join(" / ") || "—"}
                          </TableCell>
                          <TableCell
                            align="center"
                            onClick={() => hasBatchList && toggleExpanded(row.item_number)}
                          >
                            {(row.batch_count ?? 0) > 0 ? (
                              <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--pallet-blue)" }}>
                                {row.batch_count}
                                {specificBatchCount > 0 && !productKeys.has(row.item_number)
                                  ? ` (${specificBatchCount} picked)`
                                  : ""}
                              </Typography>
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                —
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">{Number(row.selling_price ?? 0).toFixed(2)}</TableCell>
                        </TableRow>
                        {hasBatchList && (
                          <TableRow>
                            <TableCell colSpan={7} sx={{ py: 0, borderBottom: expanded ? undefined : "none" }}>
                              <Collapse in={expanded} timeout="auto" unmountOnExit>
                                <Box sx={{ py: 1, pl: 6, pr: 1 }}>
                                  {batchesLoading && batches.length === 0 ? (
                                    <Box sx={{ py: 1, display: "flex", alignItems: "center", gap: 1 }}>
                                      <CircularProgress size={18} />
                                      <Typography variant="caption" color="text.secondary">
                                        Loading batches…
                                      </Typography>
                                    </Box>
                                  ) : batches.length === 0 ? (
                                    <Typography variant="caption" color="text.secondary">
                                      No batches with stock for this item.
                                    </Typography>
                                  ) : (
                                    <Table size="small">
                                      <TableHead>
                                        <TableRow>
                                          <TableCell padding="checkbox" sx={{ bgcolor: "var(--surface-bg-alt)" }} />
                                          <TableCell sx={{ bgcolor: "var(--surface-bg-alt)", fontWeight: 600 }}>
                                            Batch #
                                          </TableCell>
                                          <TableCell sx={{ bgcolor: "var(--surface-bg-alt)", fontWeight: 600 }}>
                                            Location
                                          </TableCell>
                                          <TableCell sx={{ bgcolor: "var(--surface-bg-alt)", fontWeight: 600 }}>
                                            Expiry
                                          </TableCell>
                                          <TableCell align="right" sx={{ bgcolor: "var(--surface-bg-alt)", fontWeight: 600 }}>
                                            Qty
                                          </TableCell>
                                          <TableCell align="right" sx={{ bgcolor: "var(--surface-bg-alt)", fontWeight: 600 }}>
                                            Price
                                          </TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {batches.map((batch) => (
                                          <TableRow key={batch.id} hover>
                                            <TableCell padding="checkbox">
                                              <Checkbox
                                                size="small"
                                                checked={batchIds.has(batch.id)}
                                                onChange={() => toggleBatch(row, batch.id)}
                                              />
                                            </TableCell>
                                            <TableCell>{batch.batch_number}</TableCell>
                                            <TableCell>{batch.location ?? "—"}</TableCell>
                                            <TableCell>{batch.expiry_date ?? "—"}</TableCell>
                                            <TableCell align="right">{Number(batch.qty).toFixed(2)}</TableCell>
                                            <TableCell align="right">
                                              {Number(batch.selling_price ?? batch.purchase_price ?? 0).toFixed(2)}
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
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={selectedProductCount === 0 && selectedBatchCount === 0}
          sx={{
            bgcolor: "var(--pallet-blue)",
            "&:hover": { bgcolor: "var(--pallet-main-blue)" },
          }}
        >
          Add selected
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OfferProductsSelectModal;
