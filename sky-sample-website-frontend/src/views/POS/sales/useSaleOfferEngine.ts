import { useEffect, useMemo, useRef } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { previewOfferDiscount, type OfferPreviewResult } from "../../../api/offersApi";
import type { SalesPosApplicableOffer } from "../../../api/salesApi";
import {
  cartHasOfferProduct,
  cartSubTotal,
  filterOrderOffers,
  filterPromoOnlyOrderOffers,
  findProductOffersForCart,
  findQualifyingMinOrderOffers,
  offerCanPreview,
  resolveBestAutoOfferId,
  resolvePromoOrderOfferId,
  type CartOfferLine,
} from "./posProductOffers";

export interface UseSaleOfferEngineOptions {
  allowOffers: boolean;
  applicableOffers: SalesPosApplicableOffer[];
  offerId: number | null | undefined;
  offerPromoCode: string | null | undefined;
  saleDate: string;
  pricingMode?: "retail" | "wholesale";
  lines: CartOfferLine[];
  onOfferChange: (patch: {
    offer_id?: number | null;
    offer_promo_code?: string | null;
  }) => void;
  onOfferDiscountChange: (amount: number) => void;
  onOfferPreviewChange?: (preview: OfferPreviewResult | null) => void;
  autoApplyProductOffers?: boolean;
  autoApplyOrderOffers?: boolean;
}

export function cartLinesSignature(lines: CartOfferLine[]): string {
  return lines
    .map(
      (line) =>
        `${line.item_id ?? ""}|${line.item_number ?? ""}|${line.item_batch_id ?? ""}|${line.qty}|${line.unit_price}`
    )
    .join(";");
}

export function useSaleOfferEngine({
  allowOffers,
  applicableOffers,
  offerId,
  offerPromoCode,
  saleDate,
  pricingMode = "retail",
  lines,
  onOfferChange,
  onOfferDiscountChange,
  onOfferPreviewChange,
  autoApplyProductOffers = true,
  autoApplyOrderOffers = true,
}: UseSaleOfferEngineOptions) {
  const autoResolveRef = useRef(0);
  const resolveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const matchingProductOffers = useMemo(
    () => findProductOffersForCart(applicableOffers, lines),
    [applicableOffers, lines]
  );

  const orderOffers = useMemo(
    () => filterOrderOffers(applicableOffers),
    [applicableOffers]
  );

  const promoOnlyOrderOffers = useMemo(
    () => filterPromoOnlyOrderOffers(applicableOffers),
    [applicableOffers]
  );

  const qualifyingMinOrderOffers = useMemo(
    () => findQualifyingMinOrderOffers(applicableOffers, lines),
    [applicableOffers, lines]
  );

  const subTotal = useMemo(() => cartSubTotal(lines), [lines]);
  const linesSignature = useMemo(() => cartLinesSignature(lines), [lines]);

  const selectedOffer = useMemo(
    () => applicableOffers.find((o) => o.id === offerId) ?? null,
    [applicableOffers, offerId]
  );

  const autoProductOfferActive =
    autoApplyProductOffers &&
    selectedOffer?.discount_type === "product" &&
    cartHasOfferProduct(selectedOffer, lines);

  const autoMinOrderOfferActive =
    autoApplyOrderOffers &&
    qualifyingMinOrderOffers.length > 0 &&
    selectedOffer?.discount_type === "order" &&
    Boolean(selectedOffer.uses_min_order_total);

  const autoPromoOfferActive =
    autoApplyOrderOffers &&
    !autoMinOrderOfferActive &&
    selectedOffer?.discount_type === "order" &&
    Boolean(selectedOffer.requires_promo_code);

  const previewLines = useMemo(
    () =>
      lines.map((line) => ({
        item_id: line.item_id ?? null,
        item_number: line.item_number ?? null,
        item_batch_id: line.item_batch_id ?? null,
        description: line.description ?? "",
        qty: line.qty,
        unit_price: line.unit_price,
      })),
    [lines]
  );

  const canPreview = useMemo(() => {
    if (!allowOffers || !offerId || !selectedOffer || previewLines.length === 0) {
      return false;
    }
    return offerCanPreview(selectedOffer, lines, offerPromoCode);
  }, [
    allowOffers,
    offerId,
    selectedOffer,
    previewLines.length,
    lines,
    offerPromoCode,
  ]);

  const offerProductInCart = selectedOffer
    ? selectedOffer.discount_type === "product" && cartHasOfferProduct(selectedOffer, lines)
    : false;

  useEffect(() => {
    if (!allowOffers) return;

    if (lines.length === 0) {
      if (offerId != null || offerPromoCode != null) {
        onOfferChange({ offer_id: null, offer_promo_code: null });
      }
      return;
    }

    const productOfferStillValid =
      selectedOffer?.discount_type === "product" &&
      matchingProductOffers.some((offer) => offer.id === offerId);

    const orderOfferStillValid =
      selectedOffer?.discount_type === "order" &&
      orderOffers.some((offer) => offer.id === offerId);

    if (
      autoApplyProductOffers &&
      matchingProductOffers.length === 1 &&
      qualifyingMinOrderOffers.length === 0 &&
      orderOffers.length === 0
    ) {
      const singleId = matchingProductOffers[0].id;
      if (offerId !== singleId) {
        onOfferChange({ offer_id: singleId, offer_promo_code: null });
      }
      return;
    }

    const requestId = ++autoResolveRef.current;

    const resolveAutoOffer = async () => {
      const productOrOrderActive =
        (autoApplyProductOffers && matchingProductOffers.length > 0) ||
        (autoApplyOrderOffers && qualifyingMinOrderOffers.length > 0);

      if (productOrOrderActive) {
        const id = await resolveBestAutoOfferId(
          autoApplyProductOffers ? matchingProductOffers : [],
          autoApplyOrderOffers ? qualifyingMinOrderOffers : [],
          autoApplyOrderOffers ? promoOnlyOrderOffers : [],
          lines,
          saleDate,
          offerPromoCode,
          pricingMode
        );
        if (requestId !== autoResolveRef.current) return;
        if (id != null) {
          if (offerId !== id) {
            onOfferChange({
              offer_id: id,
              offer_promo_code: null,
            });
          }
          return;
        }

        if (autoApplyProductOffers && matchingProductOffers.length === 1) {
          const fallbackId = matchingProductOffers[0].id;
          if (offerId !== fallbackId) {
            onOfferChange({ offer_id: fallbackId, offer_promo_code: null });
          }
          return;
        }
      }

      const promoCode = String(offerPromoCode ?? "").trim();
      if (autoApplyOrderOffers && promoCode && promoOnlyOrderOffers.length > 0) {
        const id = await resolvePromoOrderOfferId(
          promoOnlyOrderOffers,
          lines,
          saleDate,
          promoCode
        );
        if (requestId !== autoResolveRef.current) return;
        if (id != null && offerId !== id) {
          onOfferChange({ offer_id: id });
        } else if (id == null && selectedOffer?.requires_promo_code) {
          onOfferChange({ offer_id: null });
        }
        return;
      }

      if (requestId !== autoResolveRef.current) return;

      if (
        (selectedOffer?.discount_type === "product" &&
          autoApplyProductOffers &&
          !productOfferStillValid) ||
        (selectedOffer?.discount_type === "order" &&
          autoApplyOrderOffers &&
          !orderOfferStillValid)
      ) {
        onOfferChange({ offer_id: null, offer_promo_code: null });
      }
    };

    const needsDebouncedResolve =
      matchingProductOffers.length > 0 ||
      qualifyingMinOrderOffers.length > 0 ||
      (promoOnlyOrderOffers.length > 0 && Boolean(String(offerPromoCode ?? "").trim()));

    if (resolveTimerRef.current) {
      clearTimeout(resolveTimerRef.current);
    }

    if (needsDebouncedResolve) {
      resolveTimerRef.current = setTimeout(() => {
        void resolveAutoOffer();
      }, 200);
    } else {
      void resolveAutoOffer();
    }

    return () => {
      if (resolveTimerRef.current) {
        clearTimeout(resolveTimerRef.current);
      }
    };
  }, [
    allowOffers,
    autoApplyProductOffers,
    autoApplyOrderOffers,
    lines,
    linesSignature,
    matchingProductOffers,
    qualifyingMinOrderOffers,
    promoOnlyOrderOffers,
    saleDate,
    pricingMode,
    offerId,
    offerPromoCode,
    onOfferChange,
    selectedOffer?.discount_type,
    selectedOffer?.uses_min_order_total,
    selectedOffer?.requires_promo_code,
    orderOffers,
    matchingProductOffers,
  ]);

  const promoRequired = Boolean(selectedOffer?.requires_promo_code);

  const {
    data: preview,
    error: previewError,
    isFetching,
  } = useQuery({
    queryKey: ["offer-preview", offerId, saleDate, offerPromoCode, pricingMode, linesSignature],
    queryFn: () =>
      previewOfferDiscount({
        offer_id: offerId!,
        sale_date: saleDate,
        promo_code: offerPromoCode?.trim() || null,
        pricing_mode: pricingMode,
        lines: previewLines,
      }),
    enabled: allowOffers && canPreview,
    staleTime: 0,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (!offerId || !allowOffers) {
      onOfferDiscountChange(0);
      onOfferPreviewChange?.(null);
      return;
    }
    if (preview) {
      onOfferDiscountChange(preview.offer_discount);
      onOfferPreviewChange?.(preview);
      return;
    }
    if (!isFetching && !canPreview) {
      onOfferDiscountChange(0);
      onOfferPreviewChange?.(null);
      return;
    }
    if (
      !isFetching &&
      selectedOffer?.discount_type === "product" &&
      !offerProductInCart
    ) {
      onOfferDiscountChange(0);
      onOfferPreviewChange?.(null);
    }
  }, [
    offerId,
    allowOffers,
    preview,
    isFetching,
    canPreview,
    onOfferDiscountChange,
    onOfferPreviewChange,
    selectedOffer?.discount_type,
    offerProductInCart,
  ]);

  const showApplicableOffersPanel =
    matchingProductOffers.length > 0 || orderOffers.length > 0;

  const qualifyingOrderOfferIds = useMemo(
    () => new Set(qualifyingMinOrderOffers.map((offer) => offer.id)),
    [qualifyingMinOrderOffers]
  );

  const showManualOrderPicker =
    orderOffers.length > 0 &&
    !showApplicableOffersPanel &&
    !autoProductOfferActive &&
    (!autoApplyOrderOffers || (!autoMinOrderOfferActive && !autoPromoOfferActive));

  const showPromoField =
    (promoOnlyOrderOffers.length > 0 ||
      (selectedOffer?.discount_type === "order" && promoRequired) ||
      (autoMinOrderOfferActive && (selectedOffer?.promo_percent_off ?? 0) > 0)) &&
    (!autoProductOfferActive || selectedOffer?.discount_type === "order");

  const showProductOfferHint =
    autoApplyProductOffers &&
    lines.length > 0 &&
    matchingProductOffers.length === 0 &&
    applicableOffers.some((o) => o.discount_type === "product");

  const showMinOrderHint =
    autoApplyOrderOffers &&
    lines.length > 0 &&
    orderOffers.some((o) => o.uses_min_order_total) &&
    qualifyingMinOrderOffers.length === 0 &&
    !showApplicableOffersPanel;

  const autoOfferBannerTitle = autoProductOfferActive
    ? "Product offer applied automatically"
    : autoPromoOfferActive
      ? "Promo offer applied automatically"
      : "Order offer applied automatically";

  return {
    selectedOffer,
    preview,
    previewError,
    isFetching,
    subTotal,
    orderOffers,
    matchingProductOffers,
    qualifyingMinOrderOffers,
    qualifyingOrderOfferIds,
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
  };
}

export type SaleOfferEngineState = ReturnType<typeof useSaleOfferEngine>;
