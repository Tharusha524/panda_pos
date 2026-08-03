import React from "react";
import {
  Box,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import type { SalesPosApplicableOffer } from "../../../api/salesApi";
import OfferDiscountBreakdown from "./OfferDiscountBreakdown";
import ApplicableOffersPanel from "./ApplicableOffersPanel";
import { offerMenuLabel, type CartOfferLine } from "./posProductOffers";
import type { SaleOfferEngineState } from "./useSaleOfferEngine";

export type SaleOfferLineInput = CartOfferLine;

export interface SaleOfferSectionProps {
  allowOffers: boolean;
  applicableOffers: SalesPosApplicableOffer[];
  offerId: number | null | undefined;
  offerPromoCode: string | null | undefined;
  onOfferChange: (patch: {
    offer_id?: number | null;
    offer_promo_code?: string | null;
  }) => void;
  engine: SaleOfferEngineState;
  compact?: boolean;
}

const AutoOfferBanner: React.FC<{
  title: string;
  offer: SalesPosApplicableOffer;
}> = ({ title, offer }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "flex-start",
      gap: 1,
      bgcolor: "var(--tint-success-bg)",
      border: "1px solid #bbf7d0",
      borderRadius: 1,
      p: 1.25,
    }}
  >
    <LocalOfferOutlinedIcon sx={{ color: "#15803d", fontSize: 20, mt: 0.15 }} />
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" sx={{ fontWeight: 700, color: "#166534" }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {offer.name}
      </Typography>
      {offer.discount_summary ? (
        <Typography variant="caption" color="text.secondary" display="block">
          {offer.discount_summary}
        </Typography>
      ) : null}
      {offer.discount_type === "order" && offer.uses_min_order_total ? (
        <Typography variant="caption" color="text.secondary" display="block">
          Min order Rs {offer.min_order_amount?.toFixed(2)} → {offer.min_percent_off}% off
        </Typography>
      ) : null}
      {offer.pricing_mode_label ? (
        <Typography variant="caption" color="text.secondary" display="block">
          {offer.pricing_mode_label}
        </Typography>
      ) : null}
    </Box>
  </Box>
);

const SaleOfferSection: React.FC<SaleOfferSectionProps> = ({
  allowOffers,
  applicableOffers,
  offerId,
  offerPromoCode,
  onOfferChange,
  engine,
  compact = false,
}) => {
  const {
    selectedOffer,
    preview,
    previewError,
    isFetching,
    subTotal,
    orderOffers,
    promoRequired,
    autoProductOfferActive,
    autoMinOrderOfferActive,
    autoPromoOfferActive,
    autoOfferBannerTitle,
    showApplicableOffersPanel,
    showManualOrderPicker,
    showPromoField,
    showProductOfferHint,
    showMinOrderHint,
    matchingProductOffers,
    qualifyingOrderOfferIds,
  } = engine;

  if (!allowOffers) {
    return null;
  }

  return (
    <Grid container spacing={compact ? 0.75 : 2} sx={{ mt: compact ? 0 : 0 }}>
      {showApplicableOffersPanel ? (
        <Grid item xs={12}>
          <ApplicableOffersPanel
            productOffers={matchingProductOffers}
            orderOffers={orderOffers}
            qualifyingOrderOfferIds={qualifyingOrderOfferIds}
            selectedOfferId={offerId}
            subTotal={subTotal}
            compact={compact}
          />
        </Grid>
      ) : null}

      {(autoProductOfferActive || autoMinOrderOfferActive || autoPromoOfferActive) &&
      selectedOffer &&
      !showApplicableOffersPanel ? (
        <Grid item xs={12}>
          <AutoOfferBanner title={autoOfferBannerTitle} offer={selectedOffer} />
        </Grid>
      ) : null}

      {showPromoField ? (
        <Grid item xs={12}>
          <TextField
            fullWidth
            size="small"
            label="Promo code"
            value={offerPromoCode ?? ""}
            onChange={(e) =>
              onOfferChange({
                offer_promo_code: e.target.value.toUpperCase(),
              })
            }
            placeholder="Enter promo code"
            inputProps={{ style: { textTransform: "uppercase" } }}
            helperText="Valid promo codes apply the order offer automatically"
          />
        </Grid>
      ) : null}

      {showManualOrderPicker ? (
        <Grid item xs={12}>
          <FormControl fullWidth size="small">
            <InputLabel shrink>Order offer (optional)</InputLabel>
            <Select
              label="Order offer (optional)"
              displayEmpty
              value={offerId ?? ""}
              MenuProps={{
                PaperProps: {
                  sx: { maxHeight: 280 },
                },
              }}
              onChange={(e) => {
                const value = e.target.value;
                onOfferChange({
                  offer_id: value === "" ? null : Number(value),
                  offer_promo_code: null,
                });
              }}
              notched
            >
              <MenuItem value="">
                <em>No order offer</em>
              </MenuItem>
              {orderOffers.map((offer) => (
                <MenuItem key={offer.id} value={offer.id}>
                  {offerMenuLabel(offer)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      ) : null}

      {selectedOffer &&
      selectedOffer.discount_type === "order" &&
      !autoMinOrderOfferActive &&
      !autoPromoOfferActive &&
      showManualOrderPicker ? (
        <>
          {selectedOffer.uses_min_order_total && (
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary" lineHeight={1.3}>
                Min order Rs {selectedOffer.min_order_amount?.toFixed(2)} →{" "}
                {selectedOffer.min_percent_off}% off
              </Typography>
            </Grid>
          )}

          {promoRequired && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Promo code"
                value={offerPromoCode ?? ""}
                onChange={(e) =>
                  onOfferChange({
                    offer_promo_code: e.target.value.toUpperCase(),
                  })
                }
                placeholder="Enter promo code"
                inputProps={{ style: { textTransform: "uppercase" } }}
              />
            </Grid>
          )}
        </>
      ) : null}

      {preview && (preview.offer_discount > 0 || isFetching) ? (
        <Grid item xs={12}>
          {preview.offer_discount > 0 ? (
            <OfferDiscountBreakdown offer={selectedOffer} preview={preview} compact={compact} />
          ) : null}
          {isFetching ? (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
              Updating offer…
            </Typography>
          ) : null}
        </Grid>
      ) : null}

      {autoProductOfferActive && preview && preview.offer_discount <= 0 && !isFetching ? (
        <Grid item xs={12}>
          <Typography variant="caption" color="text.secondary" lineHeight={1.3}>
            Offer items are in the cart — increase quantity or check offer rules to unlock the
            discount.
          </Typography>
        </Grid>
      ) : null}

      {autoMinOrderOfferActive && preview && preview.offer_discount <= 0 && !isFetching ? (
        <Grid item xs={12}>
          <Typography variant="caption" color="text.secondary" lineHeight={1.3}>
            Order total is Rs {subTotal.toFixed(2)} — check offer rules if discount did not apply.
          </Typography>
        </Grid>
      ) : null}

      {showProductOfferHint && (
        <Grid item xs={12}>
          <Typography variant="caption" color="text.secondary" lineHeight={1.3}>
            Add products with the offer badge to apply a product offer automatically (retail or
            wholesale price).
          </Typography>
        </Grid>
      )}

      {showMinOrderHint && (
        <Grid item xs={12}>
          <Typography variant="caption" color="text.secondary" lineHeight={1.3}>
            {orderOffers
              .filter((o) => o.uses_min_order_total)
              .map(
                (o) =>
                  `${o.name}: min Rs ${o.min_order_amount?.toFixed(0) ?? 0} for ${o.min_percent_off}% off`
              )
              .join(" · ")}
          </Typography>
        </Grid>
      )}

      {previewError && (
        <Grid item xs={12}>
          <Typography variant="caption" color="warning.main" lineHeight={1.3}>
            {(previewError as { response?: { data?: { message?: string } } })?.response?.data
              ?.message ?? "Could not apply this offer to the current items."}
          </Typography>
        </Grid>
      )}

      {allowOffers && applicableOffers.length === 0 && (
        <Grid item xs={12}>
          <Typography variant="caption" color="text.secondary">
            No active offers for today.
          </Typography>
        </Grid>
      )}
    </Grid>
  );
};

export default SaleOfferSection;
