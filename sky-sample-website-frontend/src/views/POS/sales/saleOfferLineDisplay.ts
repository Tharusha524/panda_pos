import type { OfferPreviewLine, OfferPreviewResult } from "../../../api/offersApi";
import type { SalesPosApplicableOffer } from "../../../api/salesApi";
import { offerAppliesToCartLine } from "./posProductOffers";
import type { SaleLineDraft } from "./SaleLineItemsSection";

export interface CartLineDisplayPricing {
  unitPrice: number;
  lineTotal: number;
  offerDiscount: number;
  hasOffer: boolean;
  /** True when price is from preview; false when estimated from percent off. */
  fromPreview: boolean;
}

export interface CartLineOfferDisplay {
  offer: SalesPosApplicableOffer;
  pricing: CartLineDisplayPricing;
  scopeLabel: string;
}

function baseLinePricing(line: SaleLineDraft): CartLineDisplayPricing {
  return {
    unitPrice: line.unit_price,
    lineTotal: line.line_total,
    offerDiscount: 0,
    hasOffer: false,
    fromPreview: false,
  };
}

/** Product offer on this cart line (from offers that match the cart). */
export function getMatchingProductOfferForCartLine(
  line: SaleLineDraft,
  matchingProductOffers: SalesPosApplicableOffer[]
): SalesPosApplicableOffer | null {
  return matchingProductOffers.find((offer) => offerAppliesToCartLine(offer, line)) ?? null;
}

/** Human-readable scope: batch number when restricted, otherwise product code. */
export function cartLineOfferScopeLabel(
  line: SaleLineDraft,
  offer: SalesPosApplicableOffer
): string {
  const restrictsBatches =
    (offer.item_batch_ids?.length ?? 0) > 0 || Boolean(offer.restricts_batches);
  if (line.batch_id?.trim()) {
    return `Batch: ${line.batch_id.trim()}`;
  }
  if (restrictsBatches && line.item_batch_id) {
    return `Batch #${line.item_batch_id}`;
  }
  if (line.item_number?.trim()) {
    return `Product: ${line.item_number.trim()}`;
  }
  return offer.discount_summary ?? offer.name;
}

/** Summary for product offers when the cart is empty (catalog scope). */
export function productOfferScopeSummary(offer: SalesPosApplicableOffer): string {
  const batchCount = offer.batch_count ?? offer.item_batch_ids?.length ?? 0;
  const restrictsBatches = batchCount > 0 || Boolean(offer.restricts_batches);
  const itemNumbers = (offer.item_numbers ?? []).filter(Boolean);
  if (restrictsBatches) {
    const products =
      itemNumbers.length > 0
        ? itemNumbers.join(", ")
        : `${offer.item_count ?? offer.product_count ?? 0} product(s)`;
    return `${batchCount} batch${batchCount === 1 ? "" : "es"} · ${products}`;
  }
  if (itemNumbers.length > 0) {
    return itemNumbers.join(", ");
  }
  const count = offer.selection_count ?? offer.item_count ?? 0;
  return count > 0 ? `${count} product${count === 1 ? "" : "s"}` : "Selected products";
}

function estimatePercentOffPricing(
  line: SaleLineDraft,
  percentOff: number
): CartLineDisplayPricing | null {
  if (percentOff <= 0) {
    return null;
  }
  const unitPrice =
    Math.round(line.unit_price * (1 - percentOff / 100) * 100) / 100;
  const lineTotal = Math.round(unitPrice * line.qty * 100) / 100;
  const offerDiscount = Math.round((line.line_total - lineTotal) * 100) / 100;
  if (offerDiscount <= 0) {
    return null;
  }
  return {
    unitPrice,
    lineTotal,
    offerDiscount,
    hasOffer: true,
    fromPreview: false,
  };
}

/**
 * Do not show estimated offer price early for threshold-based rules like "Buy 10 -> 10% off".
 * Those prices should appear only after preview confirms the discount.
 */
function canEstimateBeforePreview(offer: SalesPosApplicableOffer): boolean {
  const summary = (offer.discount_summary ?? "").trim().toLowerCase();
  if (summary.startsWith("buy ")) {
    return false;
  }
  return true;
}

function normalizeItemNumber(value?: string | null): string {
  return value?.trim().toLowerCase() ?? "";
}

/** Match a cart row to its preview row (same product + batch, not just array index). */
export function findPreviewLineForCartLine(
  line: SaleLineDraft,
  previewLines: OfferPreviewLine[] | undefined,
  lineIndex: number
): OfferPreviewLine | null {
  if (!previewLines?.length) {
    return null;
  }

  const direct = previewLines[lineIndex];
  if (direct && previewLineMatchesCartLine(line, direct)) {
    return direct;
  }

  return previewLines.find((previewLine) => previewLineMatchesCartLine(line, previewLine)) ?? null;
}

export function previewLineMatchesCartLine(
  line: SaleLineDraft,
  previewLine: OfferPreviewLine
): boolean {
  const cartBatchId = line.item_batch_id ?? null;
  const previewBatchId = previewLine.item_batch_id ?? null;
  if (cartBatchId !== previewBatchId) {
    return false;
  }

  if (line.item_id != null && previewLine.item_id != null) {
    return line.item_id === previewLine.item_id;
  }

  const cartNumber = normalizeItemNumber(line.item_number);
  const previewNumber = normalizeItemNumber(previewLine.item_number);
  return cartNumber !== "" && cartNumber === previewNumber;
}

function pricingFromProductOfferPreview(
  line: SaleLineDraft,
  lineIndex: number,
  preview: OfferPreviewResult
): CartLineDisplayPricing {
  const base = baseLinePricing(line);
  const previewLine = findPreviewLineForCartLine(line, preview.lines, lineIndex);
  if (!previewLine) {
    return base;
  }

  const offerDiscount = previewLine.offer_discount ?? 0;
  if (offerDiscount <= 0) {
    return base;
  }

  const lineTotal =
    previewLine.line_total != null && previewLine.line_total < line.line_total
      ? previewLine.line_total
      : Math.max(0, Math.round((line.line_total - offerDiscount) * 100) / 100);

  const unitPrice =
    previewLine.unit_price != null && previewLine.unit_price < line.unit_price
      ? previewLine.unit_price
      : line.qty > 0
        ? Math.round((lineTotal / line.qty) * 100) / 100
        : line.unit_price;

  return {
    unitPrice,
    lineTotal,
    offerDiscount,
    hasOffer: true,
    fromPreview: true,
  };
}

/** Per-cart-line prices after a product offer preview (batch-specific discounts). */
export function cartLineDisplayPricing(
  line: SaleLineDraft,
  lineIndex: number,
  preview: OfferPreviewResult | null,
  productOfferActive: boolean
): CartLineDisplayPricing {
  if (!productOfferActive || !preview?.lines?.length) {
    return baseLinePricing(line);
  }
  return pricingFromProductOfferPreview(line, lineIndex, preview);
}

/**
 * Offer label + discounted price for a cart line.
 * Uses preview when the product offer is active; otherwise estimates from percent off.
 */
export function resolveCartLineOfferDisplay(
  line: SaleLineDraft,
  lineIndex: number,
  matchingProductOffers: SalesPosApplicableOffer[],
  productOfferActive: boolean,
  activeProductOffer: SalesPosApplicableOffer | null,
  offerPreview: OfferPreviewResult | null
): CartLineOfferDisplay | null {
  const offer = getMatchingProductOfferForCartLine(line, matchingProductOffers);
  if (!offer) {
    return null;
  }

  let pricing = baseLinePricing(line);
  if (
    productOfferActive &&
    activeProductOffer?.id === offer.id &&
    offerPreview?.lines?.length
  ) {
    pricing = pricingFromProductOfferPreview(line, lineIndex, offerPreview);
  } else if (offer.product_percent_off && canEstimateBeforePreview(offer)) {
    pricing =
      estimatePercentOffPricing(line, offer.product_percent_off) ?? pricing;
  }

  return {
    offer,
    pricing,
    scopeLabel: cartLineOfferScopeLabel(line, offer),
  };
}
