import React from "react";
import {
  Box,
  Chip,
  Paper,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import type { SalesPosApplicableOffer } from "../../../api/salesApi";
import { offerMenuLabel } from "./posProductOffers";
import { formatSaleRs } from "./saleFormUtils";

interface ApplicableOffersPanelProps {
  productOffers: SalesPosApplicableOffer[];
  orderOffers: SalesPosApplicableOffer[];
  qualifyingOrderOfferIds: Set<number>;
  selectedOfferId: number | null | undefined;
  subTotal: number;
  compact?: boolean;
}

function orderOfferStatus(
  offer: SalesPosApplicableOffer,
  qualifies: boolean,
  subTotal: number
): string {
  if (qualifies) {
    if (offer.uses_min_order_total && offer.min_percent_off) {
      return `${offer.min_percent_off}% off order total`;
    }
    if (offer.requires_promo_code) {
      return `Promo code · ${offer.promo_percent_off ?? 0}% off`;
    }
    return offer.discount_summary ?? "Order discount";
  }
  if (offer.uses_min_order_total) {
    const min = offer.min_order_amount ?? 0;
    const gap = Math.max(0, min - subTotal);
    if (gap > 0.009) {
      return `Add ${formatSaleRs(gap)} more (min ${formatSaleRs(min)})`;
    }
  }
  if (offer.requires_promo_code) {
    return "Enter promo code to apply";
  }
  return offer.discount_summary ?? "Order offer";
}

const ApplicableOffersPanel: React.FC<ApplicableOffersPanelProps> = ({
  productOffers,
  orderOffers,
  qualifyingOrderOfferIds,
  selectedOfferId,
  subTotal,
  compact = false,
}) => {
  const hasProduct = productOffers.length > 0;
  const hasOrder = orderOffers.length > 0;
  if (!hasProduct && !hasOrder) {
    return null;
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        p: compact ? 1 : 1.25,
        bgcolor: "var(--surface-bg-alt)",
        borderColor: "#e2e8f0",
      }}
    >
      <Typography
        variant="caption"
        sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", mb: 0.5, display: "block" }}
      >
        Offers (auto-applied)
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
        The best offer for this cart is selected automatically.
      </Typography>

      {hasProduct ? (
        <Box sx={{ mb: hasOrder ? 1 : 0 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: "#166534", mb: 0.5, display: "block" }}>
            Product offers
          </Typography>
          {productOffers.map((offer) => {
            const selected = selectedOfferId === offer.id;
            const batchCount = offer.batch_count ?? offer.item_batch_ids?.length ?? 0;
            return (
              <Box
                key={`product-${offer.id}`}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1,
                  p: 1,
                  mb: 0.5,
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: selected ? "#86efac" : "#e2e8f0",
                  bgcolor: selected ? "#f0fdf4" : "#fff",
                }}
              >
                {selected ? (
                  <CheckCircleIcon sx={{ color: "#15803d", fontSize: 20, mt: 0.1, flexShrink: 0 }} />
                ) : (
                  <LocalOfferOutlinedIcon sx={{ color: "text.secondary", fontSize: 20, mt: 0.1, flexShrink: 0 }} />
                )}
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {offer.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {offer.discount_summary ?? offerMenuLabel(offer)}
                  </Typography>
                  {batchCount > 0 ? (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {batchCount} batch{batchCount === 1 ? "" : "es"} only · add offer batch to cart
                    </Typography>
                  ) : null}
                </Box>
                {selected ? (
                  <Chip
                    label="Auto applied"
                    size="small"
                    color="success"
                    sx={{ height: 22, flexShrink: 0 }}
                  />
                ) : null}
              </Box>
            );
          })}
        </Box>
      ) : null}

      {hasOrder ? (
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 600, color: "#1e40af", mb: 0.5, display: "block" }}>
            Order offers
          </Typography>
          {orderOffers.map((offer) => {
            const selected = selectedOfferId === offer.id;
            const qualifies = qualifyingOrderOfferIds.has(offer.id);
            const status = orderOfferStatus(offer, qualifies, subTotal);
            return (
              <Box
                key={`order-${offer.id}`}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1,
                  p: 1,
                  mb: 0.5,
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: selected ? "#93c5fd" : "#e2e8f0",
                  bgcolor: selected ? "#eff6ff" : qualifies ? "#fff" : "#f8fafc",
                  opacity: qualifies || selected ? 1 : 0.85,
                }}
              >
                {selected ? (
                  <CheckCircleIcon sx={{ color: "#2563eb", fontSize: 20, mt: 0.1, flexShrink: 0 }} />
                ) : (
                  <LocalOfferOutlinedIcon
                    sx={{
                      color: qualifies ? "text.secondary" : "action.disabled",
                      fontSize: 20,
                      mt: 0.1,
                      flexShrink: 0,
                    }}
                  />
                )}
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {offer.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    color={qualifies ? "text.secondary" : "warning.main"}
                    display="block"
                  >
                    {status}
                  </Typography>
                </Box>
                {selected ? (
                  <Chip label="Auto applied" size="small" color="primary" sx={{ height: 22, flexShrink: 0 }} />
                ) : qualifies ? (
                  <Chip label="Eligible" size="small" variant="outlined" sx={{ height: 22, flexShrink: 0 }} />
                ) : null}
              </Box>
            );
          })}
        </Box>
      ) : null}

      {hasProduct && hasOrder ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
          Product vs order offer — whichever saves more on this cart is applied automatically.
        </Typography>
      ) : null}
    </Paper>
  );
};

export default ApplicableOffersPanel;
