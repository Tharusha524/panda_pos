import React from "react";
import { Box, Chip, Typography } from "@mui/material";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import type { SalesPosApplicableOffer } from "../../../api/salesApi";
import { offerBadgeLabel } from "./posProductOffers";
import { productOfferScopeSummary } from "./saleOfferLineDisplay";
import { formatSaleRs } from "./saleFormUtils";

function orderOfferScopeSummary(
  offer: SalesPosApplicableOffer,
  qualifies: boolean,
  subTotal: number
): string {
  if (offer.uses_min_order_total) {
    const min = offer.min_order_amount ?? 0;
    if (qualifies && offer.min_percent_off) {
      return `Order total · min ${formatSaleRs(min)} met · ${offer.min_percent_off}% off`;
    }
    const gap = Math.max(0, min - subTotal);
    if (gap > 0.009) {
      return `Order total · add ${formatSaleRs(gap)} more (min ${formatSaleRs(min)})`;
    }
    return `Order total · min ${formatSaleRs(min)}`;
  }
  if (offer.requires_promo_code) {
    return qualifies
      ? `Order total · promo ${offer.promo_percent_off ?? 0}% off`
      : "Order total · enter promo code";
  }
  return offer.discount_summary ?? "Applies to whole order";
}

interface CartOffersSummaryProps {
  productOffers: SalesPosApplicableOffer[];
  orderOffers: SalesPosApplicableOffer[];
  qualifyingOrderOfferIds: Set<number>;
  selectedOfferId?: number | null;
  selectedOfferType?: string | null;
  subTotal: number;
  compact?: boolean;
}

/** Product + order offers in the cart area (scope and discount; visible even when cart is empty). */
const CartOffersSummary: React.FC<CartOffersSummaryProps> = ({
  productOffers,
  orderOffers,
  qualifyingOrderOfferIds,
  selectedOfferId,
  selectedOfferType,
  subTotal,
  compact = false,
}) => {
  const hasProduct = productOffers.length > 0;
  const hasOrder = orderOffers.length > 0;
  if (!hasProduct && !hasOrder) {
    return null;
  }

  return (
    <Box sx={{ mb: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
      {hasProduct ? (
        <Box
          sx={{
            p: compact ? 1 : 1.25,
            borderRadius: 1,
            border: "1px solid #bbf7d0",
            bgcolor: "var(--tint-success-bg)",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: "#166534",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              mb: 0.75,
            }}
          >
            <LocalOfferOutlinedIcon sx={{ fontSize: 14 }} />
            Product offers
          </Typography>
          {productOffers.map((offer) => {
            const selected =
              selectedOfferId === offer.id && selectedOfferType === "product";
            const discountLabel =
              offer.discount_summary ??
              (offer.product_percent_off
                ? `${offer.product_percent_off}% off`
                : offerBadgeLabel(offer));
            return (
              <Box
                key={offer.id}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1,
                  py: 0.5,
                  "&:not(:last-child)": { borderBottom: "1px solid #dcfce7" },
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {offer.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {productOfferScopeSummary(offer)}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "#15803d", fontWeight: 600, display: "block" }}
                  >
                    {discountLabel}
                  </Typography>
                </Box>
                {selected ? (
                  <Chip label="Applied" size="small" color="success" sx={{ height: 22, flexShrink: 0 }} />
                ) : null}
              </Box>
            );
          })}
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
            Offer unit price shows on each matching line. Whole price = unit price × all stock qty.
          </Typography>
        </Box>
      ) : null}

      {hasOrder ? (
        <Box
          sx={{
            p: compact ? 1 : 1.25,
            borderRadius: 1,
            border: "1px solid #bfdbfe",
            bgcolor: "var(--tint-info-bg)",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: "#1e40af",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              mb: 0.75,
            }}
          >
            <ReceiptLongOutlinedIcon sx={{ fontSize: 14 }} />
            Order offers
          </Typography>
          {orderOffers.map((offer) => {
            const qualifies = qualifyingOrderOfferIds.has(offer.id);
            const selected = selectedOfferId === offer.id && selectedOfferType === "order";
            const scopeLabel = orderOfferScopeSummary(offer, qualifies, subTotal);
            return (
              <Box
                key={offer.id}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1,
                  py: 0.5,
                  opacity: qualifies || selected ? 1 : 0.9,
                  "&:not(:last-child)": { borderBottom: "1px solid #dbeafe" },
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {offer.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    color={qualifies ? "text.secondary" : "warning.main"}
                    display="block"
                  >
                    {scopeLabel}
                  </Typography>
                </Box>
                {selected ? (
                  <Chip label="Applied" size="small" color="primary" sx={{ height: 22, flexShrink: 0 }} />
                ) : qualifies ? (
                  <Chip label="Eligible" size="small" variant="outlined" sx={{ height: 22, flexShrink: 0 }} />
                ) : null}
              </Box>
            );
          })}
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
            Best product or order offer is applied automatically.
          </Typography>
        </Box>
      ) : null}
    </Box>
  );
};

export default CartOffersSummary;
