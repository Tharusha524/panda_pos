import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
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
import type { Item, ItemBatch } from "../../../api/itemsApi";
import type { SalesPosApplicableOffer } from "../../../api/salesApi";
import { formatDashboardRs } from "../shared/dashboardShared";
import { formatExpiryDate, formatItemQty, isBatchExpired } from "../inventory/itemInventoryUtils";
import { formatUomLabel, parseSaleLineQty, roundSaleQty } from "./posSaleUom";
import { unitPriceForBatchSale } from "./posSaleBatchUtils";
import { getPosItemUnitPrice, pricingModeFromSalesType, saleUnitPriceLabel, wholeStockPrice, type PosSalesPriceMode } from "./posSalePricing";
import { getOfferForBatch, getOfferForItem, offerBadgeLabel } from "./posProductOffers";

export interface PosSaleBatchSelectDialogProps {
  open: boolean;
  item: Item | null;
  variants?: Item[];
  batches: ItemBatch[];
  loading?: boolean;
  defaultQty?: number;
  salesType?: PosSalesPriceMode;
  allowNegativeInventory?: boolean;
  allowBatchSelection?: boolean;
  applicableOffers?: SalesPosApplicableOffer[];
  onClose: () => void;
  onSelectBatch: (batch: ItemBatch, qty: number) => void;
  /** Add multiple rows (batch and optional unbatched) to cart in one action. */
  onSelectBatches?: (
    selections: Array<{ batch: ItemBatch; qty: number }>,
    unbatchedQty?: number
  ) => void;
  onSelectMainProduct: (qty: number) => void;
  onSelectAutoFefo: (qty: number) => void;
}

function defaultBatchQtyMap(batches: ItemBatch[], qty: number): Record<number, number> {
  const rounded = roundSaleQty(qty);
  return Object.fromEntries(batches.map((b) => [b.id, rounded]));
}

const PosSaleBatchSelectDialog: React.FC<PosSaleBatchSelectDialogProps> = ({
  open,
  item,
  variants = [],
  batches,
  loading = false,
  defaultQty = 1,
  salesType = "Retail",
  allowNegativeInventory = false,
  allowBatchSelection = true,
  applicableOffers = [],
  onClose,
  onSelectBatch,
  onSelectBatches,
  onSelectMainProduct,
  onSelectAutoFefo,
}) => {
  const [selectedBatchIds, setSelectedBatchIds] = useState<Set<number>>(new Set());
  const [selectedUnbatched, setSelectedUnbatched] = useState(false);
  const [mainQty, setMainQty] = useState(defaultQty);
  const [unbatchedQty, setUnbatchedQty] = useState(defaultQty);
  const [batchSaleQty, setBatchSaleQty] = useState<Record<number, number>>({});

  const selectableBatches = useMemo(
    () => batches.filter((b) => !isBatchExpired(b)),
    [batches]
  );
  const offerPricingMode = pricingModeFromSalesType(salesType);

  useEffect(() => {
    if (!open) return;
    const rounded = roundSaleQty(defaultQty);
    const offerBatchIds = selectableBatches
      .filter(
        (b) =>
          getOfferForBatch(b.id, item?.item_number, applicableOffers, offerPricingMode) != null
      )
      .map((b) => b.id);
    setSelectedBatchIds(new Set(offerBatchIds.length > 0 ? offerBatchIds : []));
    setSelectedUnbatched(false);
    setMainQty(rounded);
    setUnbatchedQty(rounded);
    setBatchSaleQty(defaultBatchQtyMap(batches, rounded));
  }, [open, batches, defaultQty, item?.item_number, applicableOffers, offerPricingMode, selectableBatches]);

  const branchVariants = useMemo(() => {
    if (!item) return [];
    return variants.filter((v) => v.id !== item.id);
  }, [item, variants]);

  const uom = formatUomLabel(item?.uom);
  const batchStockQtyTotal = useMemo(
    () => batches.reduce((sum, b) => sum + Math.max(0, b.qty), 0),
    [batches]
  );
  const totalStockQty = Math.max(0, item?.qty ?? 0);
  const unbatchedStockQty = Math.max(0, totalStockQty - batchStockQtyTotal);
  const offerBatchCount = useMemo(
    () =>
      batches.filter(
        (b) => getOfferForBatch(b.id, item?.item_number, applicableOffers, offerPricingMode) != null
      ).length,
    [batches, item?.item_number, applicableOffers, offerPricingMode]
  );
  const selectedCount = selectedBatchIds.size;
  const mainQtyInvalid = parseSaleLineQty(mainQty) == null || mainQty <= 0;
  const unbatchedQtyRounded = roundSaleQty(unbatchedQty);
  const unbatchedQtyInputInvalid = parseSaleLineQty(unbatchedQty) == null || unbatchedQty <= 0;
  const unbatchedQtyInvalid =
    unbatchedQtyInputInvalid || (!allowNegativeInventory && unbatchedQtyRounded > unbatchedStockQty);

  const selectedEntries = useMemo(() => {
    return selectableBatches
      .filter((b) => selectedBatchIds.has(b.id))
      .map((batch) => ({
        batch,
        qty: roundSaleQty(batchSaleQty[batch.id] ?? roundSaleQty(defaultQty)),
      }));
  }, [selectableBatches, selectedBatchIds, batchSaleQty, defaultQty]);

  const selectionInvalid = selectedEntries.some(({ batch, qty }) => {
    if (parseSaleLineQty(qty) == null || qty <= 0) return true;
    return !allowNegativeInventory && qty > batch.qty;
  }) || (selectedUnbatched && unbatchedQtyInvalid);

  const allSelectableSelected =
    selectableBatches.length > 0 &&
    selectableBatches.every((b) => selectedBatchIds.has(b.id));

  const someSelectableSelected =
    selectableBatches.some((b) => selectedBatchIds.has(b.id)) && !allSelectableSelected;

  const toggleBatch = (batchId: number) => {
    setSelectedBatchIds((prev) => {
      const next = new Set(prev);
      if (next.has(batchId)) next.delete(batchId);
      else next.add(batchId);
      return next;
    });
    setBatchSaleQty((prev) => ({
      ...prev,
      [batchId]: prev[batchId] ?? roundSaleQty(mainQty),
    }));
  };

  const toggleAllBatches = () => {
    if (allSelectableSelected) {
      setSelectedBatchIds(new Set());
      return;
    }
    setSelectedBatchIds(new Set(selectableBatches.map((b) => b.id)));
    setBatchSaleQty((prev) => {
      const next = { ...prev };
      for (const batch of selectableBatches) {
        next[batch.id] = next[batch.id] ?? roundSaleQty(mainQty);
      }
      return next;
    });
  };

  const handleBatchQtyChange = (batchId: number, raw: string) => {
    const parsed = parseFloat(raw);
    const value = Number.isFinite(parsed) ? parsed : 0;
    setBatchSaleQty((prev) => ({ ...prev, [batchId]: value }));
    setSelectedBatchIds((prev) => new Set(prev).add(batchId));
  };

  const handleConfirmBatches = () => {
    if ((selectedEntries.length === 0 && !selectedUnbatched) || selectionInvalid) return;
    if (onSelectBatches) {
      onSelectBatches(selectedEntries, selectedUnbatched ? unbatchedQtyRounded : undefined);
    } else {
      if (selectedUnbatched) {
        onSelectMainProduct(unbatchedQtyRounded);
      }
      for (const { batch, qty } of selectedEntries) {
        onSelectBatch(batch, qty);
      }
    }
  };

  const inventoryHead = (
    <TableRow>
      {allowBatchSelection && batches.length > 0 ? (
        <TableCell padding="checkbox" sx={{ fontWeight: 700 }}>
          <Checkbox
            size="small"
            indeterminate={someSelectableSelected}
            checked={allSelectableSelected}
            disabled={selectableBatches.length === 0}
            onChange={toggleAllBatches}
            inputProps={{ "aria-label": "Select all batches" }}
          />
        </TableCell>
      ) : null}
      <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
      <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
      <TableCell align="right" sx={{ fontWeight: 700 }}>
        Stock
      </TableCell>
      {allowBatchSelection && batches.length > 0 ? (
        <TableCell align="right" sx={{ fontWeight: 700, minWidth: 100 }}>
          Sale qty
        </TableCell>
      ) : null}
      <TableCell align="right" sx={{ fontWeight: 700 }}>
        Purchase
      </TableCell>
      <TableCell align="right" sx={{ fontWeight: 700 }}>
        {saleUnitPriceLabel(salesType)}
      </TableCell>
      <TableCell align="right" sx={{ fontWeight: 700 }}>
        Whole price
      </TableCell>
      <TableCell sx={{ fontWeight: 700 }}>Expiry</TableCell>
      <TableCell sx={{ fontWeight: 700, minWidth: 120 }}>Offer</TableCell>
    </TableRow>
  );

  const emptySelectCell = allowBatchSelection && batches.length > 0;
  const colSpan = emptySelectCell ? 10 : 8;

  const itemLevelOffer = useMemo(
    () => getOfferForItem(item?.item_number, applicableOffers, offerPricingMode),
    [item?.item_number, applicableOffers, offerPricingMode]
  );

  const selectedBatchOfferCount = useMemo(
    () =>
      selectedEntries.filter(
        ({ batch }) =>
          getOfferForBatch(batch.id, item?.item_number, applicableOffers, offerPricingMode) != null
      ).length,
    [selectedEntries, item?.item_number, applicableOffers, offerPricingMode]
  );
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        Item inventory &amp; batches
        {item ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {item.item_number} — {item.description}
          </Typography>
        ) : null}
        {selectedCount > 0 ? (
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {selectedCount + (selectedUnbatched ? 1 : 0)} row
            {selectedCount + (selectedUnbatched ? 1 : 0) === 1 ? "" : "s"} selected
            {selectedBatchOfferCount > 0
              ? ` · ${selectedBatchOfferCount} with offer`
              : ""}
          </Typography>
        ) : null}
      </DialogTitle>
      <DialogContent dividers>
        {item && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2, alignItems: "flex-end" }}>
            <TextField
              label="Main sale qty"
              type="number"
              size="small"
              value={mainQty}
              onChange={(e) => {
                const parsed = parseFloat(e.target.value);
                setMainQty(Number.isFinite(parsed) ? parsed : 0);
              }}
              inputProps={{ min: 0.01, step: "0.01" }}
              helperText={uom ? `Unit: ${uom}` : undefined}
              sx={{ width: 130 }}
            />
            <Button
              variant="outlined"
              size="small"
              onClick={() => onSelectMainProduct(roundSaleQty(mainQty))}
              disabled={mainQtyInvalid}
            >
              Add main product
            </Button>
            {allowBatchSelection && batches.length > 0 ? (
              <Button
                color="inherit"
                size="small"
                onClick={() => onSelectAutoFefo(roundSaleQty(mainQty))}
                disabled={mainQtyInvalid}
              >
                Auto (nearest expiry)
              </Button>
            ) : null}
            <Typography variant="body2" color="text.secondary" sx={{ ml: { sm: 1 } }}>
              All stock {formatItemQty(totalStockQty, item.uom)} = Unbatched{" "}
              {formatItemQty(unbatchedStockQty, item.uom)} + Batch{" "}
              {formatItemQty(batchStockQtyTotal, item.uom)}
            </Typography>
          </Box>
        )}

        {item && offerBatchCount > 0 ? (
          <Typography variant="body2" color="success.main" sx={{ mb: 1.5, fontWeight: 600 }}>
            {offerBatchCount} batch{offerBatchCount === 1 ? "" : "es"} have an active offer. Tick
            one or more batches, set qty, then add all to cart at once.
          </Typography>
        ) : allowBatchSelection && batches.length > 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Select one or more batches and add them to the cart together.
          </Typography>
        ) : null}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <TableContainer sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}>
            <Table size="small">
              <TableHead>{inventoryHead}</TableHead>
              <TableBody>
                {item && (
                  <TableRow sx={{ bgcolor: "var(--surface-bg-alt)" }}>
                    {emptySelectCell ? (
                      <TableCell padding="checkbox">
                        <Checkbox
                          size="small"
                          checked={selectedUnbatched}
                          onChange={() => setSelectedUnbatched((v) => !v)}
                          inputProps={{ "aria-label": "Select unbatched stock" }}
                        />
                      </TableCell>
                    ) : null}
                    <TableCell>
                      <Chip label="Unbatched" size="small" color="default" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {item.location || "Main Location"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Not assigned to any batch
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{formatItemQty(unbatchedStockQty, item.uom)}</TableCell>
                    {emptySelectCell ? (
                      <TableCell align="right">
                        <TextField
                          size="small"
                          type="number"
                          value={unbatchedQty}
                          onChange={(e) => {
                            const parsed = parseFloat(e.target.value);
                            setUnbatchedQty(Number.isFinite(parsed) ? parsed : 0);
                          }}
                          inputProps={{ min: 0.01, step: "0.01" }}
                          error={selectedUnbatched && unbatchedQtyInvalid}
                          helperText={
                            selectedUnbatched && unbatchedQtyInvalid
                              ? `Max ${formatItemQty(unbatchedStockQty, item?.uom)}`
                              : undefined
                          }
                          FormHelperTextProps={{ sx: { m: 0, fontSize: "0.65rem" } }}
                          sx={{ width: 88 }}
                        />
                      </TableCell>
                    ) : null}
                    <TableCell align="right">
                      {formatDashboardRs(item.purchase_price ?? item.last_purchase_price ?? 0)}
                    </TableCell>
                    <TableCell align="right">
                      {formatDashboardRs(getPosItemUnitPrice(item, salesType))}
                    </TableCell>
                    <TableCell align="right">
                      {(() => {
                        const unit = getPosItemUnitPrice(item, salesType);
                        const whole = wholeStockPrice(unit, unbatchedStockQty);
                        return whole != null ? formatDashboardRs(whole) : "—";
                      })()}
                    </TableCell>
                    <TableCell>—</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => onSelectMainProduct(unbatchedQtyRounded)}
                        disabled={unbatchedQtyInvalid}
                      >
                        Select unbatched
                      </Button>
                    </TableCell>
                  </TableRow>
                )}

                {branchVariants.map((variant) => (
                  <TableRow key={variant.id}>
                    {emptySelectCell ? <TableCell /> : null}
                    <TableCell>
                      <Chip label="Branch" size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{variant.location || "—"}</TableCell>
                    <TableCell align="right">{formatItemQty(variant.qty ?? 0, variant.uom)}</TableCell>
                    {emptySelectCell ? <TableCell /> : null}
                    <TableCell align="right">
                      {formatDashboardRs(variant.purchase_price ?? variant.last_purchase_price ?? 0)}
                    </TableCell>
                    <TableCell align="right">
                      {formatDashboardRs(getPosItemUnitPrice(variant, salesType))}
                    </TableCell>
                    <TableCell align="right">
                      {(() => {
                        const unit = getPosItemUnitPrice(variant, salesType);
                        const whole = wholeStockPrice(unit, variant.qty ?? 0);
                        return whole != null ? formatDashboardRs(whole) : "—";
                      })()}
                    </TableCell>
                    <TableCell>
                      {variant.nearest_expiry_date || variant.expiry_date
                        ? formatExpiryDate(variant.nearest_expiry_date ?? variant.expiry_date)
                        : "—"}
                    </TableCell>
                    <TableCell>—</TableCell>
                  </TableRow>
                ))}

                {batches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={colSpan} align="center" sx={{ color: "text.secondary", py: 2 }}>
                      No batches with stock at this branch
                    </TableCell>
                  </TableRow>
                ) : (
                  batches.map((batch) => {
                    const checked = selectedBatchIds.has(batch.id);
                    const expired = isBatchExpired(batch);
                    const batchOffer = getOfferForBatch(
                      batch.id,
                      item?.item_number,
                      applicableOffers,
                      offerPricingMode
                    );
                    const rowSaleQty = batchSaleQty[batch.id] ?? roundSaleQty(defaultQty);
                    const rowQtyInvalid =
                      checked &&
                      (parseSaleLineQty(rowSaleQty) == null ||
                        rowSaleQty <= 0 ||
                        (!allowNegativeInventory && rowSaleQty > batch.qty));
                    return (
                      <TableRow
                        key={batch.id}
                        hover={allowBatchSelection && !expired}
                        selected={checked && allowBatchSelection && !expired}
                        sx={{
                          cursor: allowBatchSelection && !expired ? "pointer" : "default",
                          bgcolor: expired ? "#ffebee" : batchOffer ? "#ecfdf5" : undefined,
                          opacity: expired ? 0.85 : 1,
                        }}
                        onClick={() =>
                          allowBatchSelection && !expired && toggleBatch(batch.id)
                        }
                      >
                        {allowBatchSelection ? (
                          <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              size="small"
                              checked={checked}
                              disabled={expired}
                              onChange={() => !expired && toggleBatch(batch.id)}
                              inputProps={{ "aria-label": `Select batch ${batch.batch_number}` }}
                            />
                          </TableCell>
                        ) : null}
                        <TableCell>
                          <Chip
                            label={expired ? "Expired" : "Batch"}
                            size="small"
                            color={expired ? "error" : checked ? "primary" : "default"}
                            variant={checked && !expired ? "filled" : "outlined"}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: checked ? 700 : 400 }}>
                          {batch.batch_number}
                          {batch.location ? (
                            <Typography variant="caption" color="text.secondary" display="block">
                              @ {batch.location}
                            </Typography>
                          ) : null}
                        </TableCell>
                        <TableCell align="right">{formatItemQty(batch.qty, item?.uom)}</TableCell>
                        {allowBatchSelection ? (
                          <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                            <TextField
                              size="small"
                              type="number"
                              value={rowSaleQty}
                              onChange={(e) => handleBatchQtyChange(batch.id, e.target.value)}
                              onFocus={() =>
                                setSelectedBatchIds((prev) => new Set(prev).add(batch.id))
                              }
                              inputProps={{ min: 0.01, step: "0.01" }}
                              error={rowQtyInvalid}
                              helperText={
                                rowQtyInvalid
                                  ? `Max ${formatItemQty(batch.qty, item?.uom)}`
                                  : undefined
                              }
                              FormHelperTextProps={{ sx: { m: 0, fontSize: "0.65rem" } }}
                              sx={{ width: 88 }}
                            />
                          </TableCell>
                        ) : null}
                        <TableCell align="right">{formatDashboardRs(batch.purchase_price)}</TableCell>
                        <TableCell align="right">
                          {formatDashboardRs(
                            item ? unitPriceForBatchSale(item, salesType, batch) : batch.selling_price ?? 0
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: checked ? 700 : 400 }}>
                          {(() => {
                            const unit = item
                              ? unitPriceForBatchSale(item, salesType, batch)
                              : batch.selling_price ?? 0;
                            const whole = wholeStockPrice(unit, batch.qty);
                            return whole != null ? formatDashboardRs(whole) : "—";
                          })()}
                        </TableCell>
                        <TableCell>
                          {batch.expiry_date ? formatExpiryDate(batch.expiry_date) : "—"}
                        </TableCell>
                        <TableCell>
                          {batchOffer ? (
                            <Box>
                              <Chip
                                label={offerBadgeLabel(batchOffer)}
                                size="small"
                                color="success"
                                variant="filled"
                              />
                              {(() => {
                                const unit = item
                                  ? unitPriceForBatchSale(item, salesType, batch)
                                  : batch.selling_price ?? 0;
                                const whole = wholeStockPrice(unit, batch.qty);
                                const pct = batchOffer.product_percent_off;
                                const offerWhole =
                                  pct && whole != null
                                    ? wholeStockPrice(
                                        Math.round(unit * (1 - pct / 100) * 100) / 100,
                                        batch.qty
                                      )
                                    : null;
                                if (offerWhole == null || whole == null) return null;
                                return (
                                  <Typography
                                    variant="caption"
                                    color="success.main"
                                    display="block"
                                    sx={{ mt: 0.25, fontWeight: 600 }}
                                  >
                                    Whole offer: {formatDashboardRs(offerWhole)}
                                    <Typography
                                      component="span"
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{ ml: 0.5, textDecoration: "line-through" }}
                                    >
                                      {formatDashboardRs(whole)}
                                    </Typography>
                                  </Typography>
                                );
                              })()}
                            </Box>
                          ) : itemLevelOffer ? (
                            <Typography variant="caption" color="text.secondary">
                              All batches
                            </Typography>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {allowBatchSelection && selectedCount > 0 && !allowNegativeInventory ? (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            {selectedCount + (selectedUnbatched ? 1 : 0)} row
            {selectedCount + (selectedUnbatched ? 1 : 0) === 1 ? "" : "s"} ready to add —
            check qty does not exceed stock.
          </Typography>
        ) : null}
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.75 }}>
          Whole price = unit price × all stock qty for that row.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Close</Button>
        {allowBatchSelection && batches.length > 0 ? (
          <Button
            variant="contained"
            onClick={handleConfirmBatches}
            disabled={(selectedCount === 0 && !selectedUnbatched) || selectionInvalid}
          >
            Add to cart ({selectedCount + (selectedUnbatched ? 1 : 0)})
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
};

export default PosSaleBatchSelectDialog;
