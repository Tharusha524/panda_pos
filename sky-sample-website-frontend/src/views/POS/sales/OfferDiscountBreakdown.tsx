import React, { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import type { OfferPreviewResult } from "../../../api/offersApi";
import type { SalesPosApplicableOffer } from "../../../api/salesApi";
import { formatSaleRs } from "./saleFormUtils";

interface OfferDiscountBreakdownProps {
  offer: SalesPosApplicableOffer | null;
  preview: OfferPreviewResult | null;
  compact?: boolean;
}

const OfferDiscountBreakdown: React.FC<OfferDiscountBreakdownProps> = ({
  offer,
  preview,
  compact = false,
}) => {
  const rows = useMemo(() => {
    if (!offer || !preview || preview.offer_discount <= 0) {
      return [];
    }

    const lineRows = (preview.lines ?? [])
      .filter((line) => (line.offer_discount ?? 0) > 0)
      .map((line) => ({
        key: `${line.item_id ?? line.item_number ?? line.description}-${line.qty}`,
        label: line.description || line.item_number || "Product",
        meta: `${line.qty} × ${formatSaleRs(line.unit_price)}`,
        amount: line.offer_discount ?? 0,
      }));

    const lineTotal = lineRows.reduce((sum, row) => sum + row.amount, 0);
    const orderAmount = Math.max(0, preview.offer_discount - lineTotal);

    if (offer.discount_type === "order" || orderAmount > 0.009) {
      const detail =
        offer.discount_type === "order"
          ? offer.requires_promo_code
            ? "Promo / order total discount"
            : offer.uses_min_order_total
              ? `Min order Rs ${(offer.min_order_amount ?? 0).toFixed(2)}`
              : "Order total discount"
          : "Order-level portion";
      return [
        ...lineRows,
        {
          key: "order-level",
          label: detail,
          meta: offer.discount_type === "order" ? offer.name : undefined,
          amount: orderAmount > 0.009 ? orderAmount : preview.offer_discount,
        },
      ].filter((row) => row.amount > 0);
    }

    return lineRows;
  }, [offer, preview]);

  if (!offer || !preview || preview.offer_discount <= 0 || rows.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        bgcolor: "var(--tint-success-bg)",
        border: "1px solid #bbf7d0",
        borderRadius: 1,
        p: compact ? 1 : 1.25,
      }}
    >
      <Typography
        variant="caption"
        sx={{ fontWeight: 700, color: "#166534", display: "block", mb: 0.75 }}
      >
        {offer.name} ·{" "}
        {offer.discount_type === "product" ? "Product offer" : "Order offer"}
        {offer.discount_summary ? ` · ${offer.discount_summary}` : ""}
      </Typography>
      {rows.map((row) => (
        <Box
          key={row.key}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 1,
            py: 0.35,
            borderTop: "1px dashed #dcfce7",
            "&:first-of-type": { borderTop: "none", pt: 0 },
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, display: "block" }}>
              {row.label}
            </Typography>
            {row.meta ? (
              <Typography variant="caption" color="text.secondary" display="block">
                {row.meta}
              </Typography>
            ) : null}
          </Box>
          <Typography variant="caption" sx={{ fontWeight: 700, color: "#15803d", flexShrink: 0 }}>
            −{formatSaleRs(row.amount)}
          </Typography>
        </Box>
      ))}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mt: 0.75,
          pt: 0.75,
          borderTop: "1px solid #86efac",
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 700, color: "#166534" }}>
          Total offer saving
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 700, color: "#15803d" }}>
          −{formatSaleRs(preview.offer_discount)}
        </Typography>
      </Box>
    </Box>
  );
};

export default OfferDiscountBreakdown;
