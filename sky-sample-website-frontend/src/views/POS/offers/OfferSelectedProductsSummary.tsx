import React from "react";
import {
  Box,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { OfferSelectedBatch } from "../../../api/offersApi";
import type { Item } from "../../../api/itemsApi";
import { buildOfferCatalogRows } from "./offerProductBatchUtils";

interface OfferSelectedProductsSummaryProps {
  selectedIds: number[];
  allItems: Item[];
  selectedBatchIds?: number[];
  batchDetails?: OfferSelectedBatch[];
  maxChips?: number;
}

const OfferSelectedProductsSummary: React.FC<OfferSelectedProductsSummaryProps> = ({
  selectedIds,
  allItems,
  selectedBatchIds = [],
  batchDetails = [],
  maxChips = 8,
}) => {
  const idSet = new Set(selectedIds);
  const catalogRows = buildOfferCatalogRows(allItems.filter((i) => idSet.has(i.id)));
  const batchIdSet = new Set(selectedBatchIds);

  if (selectedIds.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No products selected. Click &quot;Select products &amp; batches&quot; to choose items.
      </Typography>
    );
  }

  const chipItems = catalogRows.slice(0, maxChips);
  const extra = catalogRows.length - chipItems.length;

  return (
    <Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.5 }}>
        {chipItems.map((item) => {
          const itemBatches = batchDetails.filter((b) => b.item_number === item.item_number);
          const batchLabel =
            itemBatches.length > 0
              ? ` · ${itemBatches.length} batch${itemBatches.length === 1 ? "" : "es"}`
              : (item.batch_count ?? 0) > 0
                ? ` · all ${item.batch_count} batches`
                : "";
          return (
            <Chip
              key={item.item_number}
              size="small"
              label={`${item.item_number} — ${item.description}${batchLabel}`}
              sx={{ maxWidth: 360 }}
            />
          );
        })}
        {extra > 0 && <Chip size="small" variant="outlined" label={`+${extra} more`} />}
      </Box>
      <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 220 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, bgcolor: "var(--surface-bg-alt)" }}>Item #</TableCell>
              <TableCell sx={{ fontWeight: 600, bgcolor: "var(--surface-bg-alt)" }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 600, bgcolor: "var(--surface-bg-alt)" }}>Category</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, bgcolor: "var(--surface-bg-alt)" }}>
                Batches
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, bgcolor: "var(--surface-bg-alt)" }}>
                Retail
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {catalogRows.map((item) => {
              const itemBatches = batchDetails.filter((b) => b.item_number === item.item_number);
              const batchSummary =
                itemBatches.length > 0
                  ? `${itemBatches.length} selected`
                  : batchIdSet.size > 0 && (item.batch_count ?? 0) > 0
                    ? `All (${item.batch_count})`
                    : (item.batch_count ?? 0) > 0
                      ? String(item.batch_count)
                      : "—";

              return (
                <TableRow key={item.item_number}>
                  <TableCell>{item.item_number}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>
                    {[item.category, item.sub_category].filter(Boolean).join(" / ") || "—"}
                  </TableCell>
                  <TableCell align="center">{batchSummary}</TableCell>
                  <TableCell align="right">{Number(item.selling_price ?? 0).toFixed(2)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default OfferSelectedProductsSummary;
