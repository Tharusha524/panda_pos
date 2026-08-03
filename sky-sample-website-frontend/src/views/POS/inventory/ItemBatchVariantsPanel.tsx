import React, { useMemo } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type {
  Item,
  ItemBatch,
  ItemInventoryBreakdown,
  ItemInventoryVariantRow,
} from "../../../api/itemsApi";
import { formatDashboardRs } from "../shared/dashboardShared";
import { formatExpiryDate, formatItemQty, itemSellableQty } from "./itemInventoryUtils";

interface Props {
  item: Item;
  data: ItemInventoryBreakdown | undefined;
  loading: boolean;
}

function batchSellingPrice(batch: ItemBatch, fallback: number): number {
  return batch.selling_price ?? fallback;
}

const ItemBatchVariantsPanel: React.FC<Props> = ({ item, data, loading }) => {
  const uom = data?.item?.uom ?? item.uom;
  const totals = data?.totals;
  const variants = data?.variants ?? [];
  const batches = data?.batches ?? [];

  const currentVariant = useMemo(
    () => variants.find((v) => v.is_current) ?? variants[0] ?? null,
    [variants]
  );

  const otherVariants = useMemo(
    () => variants.filter((v) => !v.is_current),
    [variants]
  );

  const unbatchedRows = useMemo(
    () => variants.filter((v) => v.unbatched_qty > 0),
    [variants]
  );

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box>
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
          <strong>Real stock:</strong>{" "}
          {formatItemQty(itemSellableQty(data?.item ?? item), uom)}
        </Typography>
        <Typography variant="body2">
          <strong>Total on hand:</strong> {formatItemQty(totals?.total_qty ?? item.qty ?? 0, uom)}
        </Typography>
        <Typography variant="body2">
          <strong>In batches:</strong> {formatItemQty(totals?.total_batch_qty ?? 0, uom)}
        </Typography>
        <Typography variant="body2">
          <strong>Unbatched:</strong> {formatItemQty(totals?.total_unbatched_qty ?? 0, uom)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {totals?.variant_count ?? 1} branch{(totals?.variant_count ?? 1) === 1 ? "" : "es"} ·{" "}
          {totals?.batch_count ?? 0} batch{(totals?.batch_count ?? 0) === 1 ? "" : "es"}
        </Typography>
        {(totals?.total_unbatched_qty ?? 0) > 0 &&
        (data?.item?.expiry_date ?? item.expiry_date) ? (
          <Typography variant="body2">
            <strong>Main item expiry:</strong>{" "}
            {formatExpiryDate(data?.item?.expiry_date ?? item.expiry_date)} ·{" "}
            {formatItemQty(totals?.total_unbatched_qty ?? 0, uom)}
          </Typography>
        ) : null}
        {(data?.item?.nearest_batch_expiry_date ?? item.nearest_batch_expiry_date) &&
        (data?.item?.nearest_batch_expiry_qty ?? item.nearest_batch_expiry_qty ?? 0) > 0 ? (
          <Typography variant="body2">
            <strong>Batch expiry:</strong>{" "}
            {formatExpiryDate(
              data?.item?.nearest_batch_expiry_date ?? item.nearest_batch_expiry_date
            )}{" "}
            ·{" "}
            {formatItemQty(
              data?.item?.nearest_batch_expiry_qty ?? item.nearest_batch_expiry_qty ?? 0,
              uom
            )}
          </Typography>
        ) : null}
      </Box>

      <TableContainer sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Stock
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Purchase
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Selling
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Expiry</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow sx={{ bgcolor: "var(--tint-success-bg)" }}>
              <TableCell>
                <Chip label="Total" size="small" color="success" variant="outlined" />
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  All branches — {item.item_number}
                </Typography>
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                {formatItemQty(totals?.total_qty ?? 0, uom)}
              </TableCell>
              <TableCell align="right">—</TableCell>
              <TableCell align="right">—</TableCell>
              <TableCell>—</TableCell>
            </TableRow>

            {currentVariant ? (
              <VariantRow row={currentVariant} uom={uom} chipLabel="Main" highlighted />
            ) : null}

            {otherVariants.map((variant) => (
              <VariantRow key={variant.id} row={variant} uom={uom} chipLabel="Branch" />
            ))}

            {unbatchedRows.map((variant) => (
              <TableRow key={`unbatched-${variant.id}`} sx={{ bgcolor: "action.hover" }}>
                <TableCell>
                  <Chip label="Unbatched" size="small" variant="outlined" color="warning" />
                </TableCell>
                <TableCell>
                  {variant.location || "—"}
                  <Typography variant="caption" display="block" color="text.secondary">
                    Not assigned to any batch
                  </Typography>
                </TableCell>
                <TableCell align="right">{formatItemQty(variant.unbatched_qty, uom)}</TableCell>
                <TableCell align="right">{formatDashboardRs(variant.purchase_price)}</TableCell>
                <TableCell align="right">{formatDashboardRs(variant.selling_price)}</TableCell>
                <TableCell>
                  {variant.expiry_date ? formatExpiryDate(variant.expiry_date) : "—"}
                </TableCell>
              </TableRow>
            ))}

            {batches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ color: "text.secondary", py: 2 }}>
                  No batches with stock
                </TableCell>
              </TableRow>
            ) : (
              batches.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell>
                    <Chip label="Batch" size="small" color="secondary" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {batch.batch_number}
                    </Typography>
                    {batch.location ? (
                      <Typography variant="caption" color="text.secondary">
                        @ {batch.location}
                      </Typography>
                    ) : null}
                  </TableCell>
                  <TableCell align="right">{formatItemQty(batch.qty, uom)}</TableCell>
                  <TableCell align="right">{formatDashboardRs(batch.purchase_price)}</TableCell>
                  <TableCell align="right">
                    {formatDashboardRs(
                      batchSellingPrice(
                        batch,
                        variants.find((v) => v.id === batch.item_id)?.selling_price ??
                          item.selling_price ??
                          0
                      )
                    )}
                  </TableCell>
                  <TableCell>
                    {batch.expiry_date ? formatExpiryDate(batch.expiry_date) : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {totals && totals.total_batch_qty > 0 ? (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: "block" }}>
          Batch qty ({formatItemQty(totals.total_batch_qty, uom)}) + unbatched (
          {formatItemQty(totals.total_unbatched_qty, uom)}) = total stock (
          {formatItemQty(totals.total_qty, uom)})
          {(data?.item?.expiry_date ?? item.expiry_date) && totals.total_unbatched_qty > 0 ? (
            <>
              {" · "}
              Main item expiry:{" "}
              {formatExpiryDate(data?.item?.expiry_date ?? item.expiry_date)}
            </>
          ) : null}
        </Typography>
      ) : totals && totals.total_unbatched_qty > 0 && (data?.item?.expiry_date ?? item.expiry_date) ? (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: "block" }}>
          Unbatched stock expiry (main item):{" "}
          {formatExpiryDate(data?.item?.expiry_date ?? item.expiry_date)}
        </Typography>
      ) : null}
    </Box>
  );
};

function mainItemExpiryLabel(row: ItemInventoryVariantRow): string {
  if (row.unbatched_qty > 0 && row.expiry_date) {
    return `${formatExpiryDate(row.expiry_date)} · ${formatItemQty(row.unbatched_qty)}`;
  }
  if (row.nearest_expiry_date) {
    return formatExpiryDate(row.nearest_expiry_date);
  }
  if (row.expiry_date) {
    return formatExpiryDate(row.expiry_date);
  }
  return "—";
}

function VariantRow({
  row,
  uom,
  chipLabel,
  highlighted = false,
}: {
  row: ItemInventoryVariantRow;
  uom: string | null | undefined;
  chipLabel: string;
  highlighted?: boolean;
}) {
  return (
    <TableRow sx={highlighted ? { bgcolor: "var(--tint-info-bg)" } : undefined}>
      <TableCell>
        <Chip
          label={chipLabel}
          size="small"
          color={highlighted ? "primary" : "default"}
          variant="outlined"
        />
      </TableCell>
      <TableCell>
        <Typography variant="body2" sx={{ fontWeight: highlighted ? 600 : 400 }}>
          {row.location || "Main"}
        </Typography>
        {row.batch_qty > 0 ? (
          <Typography variant="caption" color="text.secondary">
            {formatItemQty(row.batch_qty, uom)} in batches ·{" "}
            {formatItemQty(row.unbatched_qty, uom)} unbatched
          </Typography>
        ) : null}
      </TableCell>
      <TableCell align="right">{formatItemQty(row.qty, uom)}</TableCell>
      <TableCell align="right">{formatDashboardRs(row.purchase_price)}</TableCell>
      <TableCell align="right">{formatDashboardRs(row.selling_price)}</TableCell>
      <TableCell>{mainItemExpiryLabel(row)}</TableCell>
    </TableRow>
  );
}

export default ItemBatchVariantsPanel;
