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

interface OfferSelectedBatchesSummaryProps {
  selectedBatchIds: number[];
  batches?: OfferSelectedBatch[];
  maxChips?: number;
}

const OfferSelectedBatchesSummary: React.FC<OfferSelectedBatchesSummaryProps> = ({
  selectedBatchIds,
  batches = [],
  maxChips = 6,
}) => {
  if (selectedBatchIds.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No batches selected — offer applies to all stock batches of the chosen products.
      </Typography>
    );
  }

  const batchMap = new Map(batches.map((b) => [b.id, b]));
  const rows = selectedBatchIds.map((id) => batchMap.get(id)).filter(Boolean) as OfferSelectedBatch[];

  const chipRows = rows.length > 0 ? rows : selectedBatchIds.map((id) => ({ id, batch_number: `#${id}` } as OfferSelectedBatch));
  const chipItems = chipRows.slice(0, maxChips);
  const extra = chipRows.length - chipItems.length;

  return (
    <Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.5 }}>
        {chipItems.map((batch) => (
          <Chip
            key={batch.id}
            size="small"
            label={
              batch.description
                ? `${batch.item_number ?? ""} · ${batch.batch_number} · exp ${batch.expiry_date ?? "—"}`
                : batch.batch_number
            }
            sx={{ maxWidth: 320 }}
          />
        ))}
        {extra > 0 && <Chip size="small" variant="outlined" label={`+${extra} more`} />}
      </Box>
      {rows.length > 0 && (
        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 180 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, bgcolor: "var(--surface-bg-alt)" }}>Item</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: "var(--surface-bg-alt)" }}>Batch</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: "var(--surface-bg-alt)" }}>Location</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: "var(--surface-bg-alt)" }}>Expiry</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, bgcolor: "var(--surface-bg-alt)" }}>
                  Qty
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell>
                    {batch.description ?? "—"}
                    <Typography variant="caption" display="block" color="text.secondary">
                      {batch.item_number}
                    </Typography>
                  </TableCell>
                  <TableCell>{batch.batch_number}</TableCell>
                  <TableCell>{batch.location ?? "—"}</TableCell>
                  <TableCell>{batch.expiry_date ?? "—"}</TableCell>
                  <TableCell align="right">{Number(batch.qty).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default OfferSelectedBatchesSummary;
