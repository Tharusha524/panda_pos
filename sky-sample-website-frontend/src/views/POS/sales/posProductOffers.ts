import { previewOfferDiscount, type OfferPricingMode } from "../../../api/offersApi";
import type { SalesPosApplicableOffer } from "../../../api/salesApi";

export type SalePricingMode = "retail" | "wholesale";

export function normalizeOfferPricingMode(mode?: string | null): OfferPricingMode {
  const value = (mode ?? "both").toLowerCase();
  if (value === "retail" || value === "wholesale") return value;
  return "both";
}

export function offerMatchesSalePricingMode(
  offer: { pricing_mode?: string | null },
  salePricingMode: SalePricingMode
): boolean {
  const mode = normalizeOfferPricingMode(offer.pricing_mode);
  return mode === "both" || mode === salePricingMode;
}

export function filterOffersForPricingMode<T extends { pricing_mode?: string | null }>(
  offers: T[],
  salePricingMode: SalePricingMode
): T[] {
  return offers.filter((offer) => offerMatchesSalePricingMode(offer, salePricingMode));
}

export function offerPricingModeLabel(mode?: string | null): string {
  const normalized = normalizeOfferPricingMode(mode);
  if (normalized === "retail") return "Retail only";
  if (normalized === "wholesale") return "Wholesale only";
  return "Retail & Wholesale";
}

export interface CartOfferLine {
  item_id?: number | null;
  item_number?: string | null;
  item_batch_id?: number | null;
  description?: string;
  qty: number;
  unit_price: number;
  line_total?: number;
}

/** True when a single cart line qualifies for this product offer. */
export function offerAppliesToCartLine(
  offer: SalesPosApplicableOffer,
  line: CartOfferLine
): boolean {
  return cartHasOfferProduct(offer, [line]);
}

/** True when the cart contains at least one line linked to this product offer. */
export function cartHasOfferProduct(
  offer: SalesPosApplicableOffer,
  lines: CartOfferLine[]
): boolean {
  if (offer.discount_type !== "product") return lines.length > 0;
  const ids = new Set(offer.item_ids ?? []);
  const numbers = new Set(
    (offer.item_numbers ?? []).map((n) => n.trim().toLowerCase()).filter(Boolean)
  );
  const batchIds = new Set(offer.item_batch_ids ?? []);
  const restrictsBatches = batchIds.size > 0 || Boolean(offer.restricts_batches);
  return lines.some((line) => {
    const itemMatch =
      (line.item_id != null && ids.has(line.item_id)) ||
      (() => {
        const num = line.item_number?.trim().toLowerCase();
        return Boolean(num && numbers.has(num));
      })();
    if (!itemMatch) return false;
    if (restrictsBatches) {
      return line.item_batch_id != null && batchIds.has(line.item_batch_id);
    }
    return true;
  });
}

export function findProductOffersForCart(
  offers: SalesPosApplicableOffer[],
  lines: CartOfferLine[]
): SalesPosApplicableOffer[] {
  return offers.filter(
    (offer) => offer.discount_type === "product" && cartHasOfferProduct(offer, lines)
  );
}

export function filterOrderOffers(offers: SalesPosApplicableOffer[]): SalesPosApplicableOffer[] {
  return offers.filter((offer) => offer.discount_type === "order");
}

export function cartSubTotal(lines: CartOfferLine[]): number {
  return Math.round(
    lines.reduce((sum, line) => {
      if (line.line_total != null && !Number.isNaN(line.line_total)) {
        return sum + line.line_total;
      }
      return sum + line.qty * line.unit_price;
    }, 0) * 100
  ) / 100;
}

/** Whether the offer preview API can run for the current cart. */
export function offerCanPreview(
  offer: SalesPosApplicableOffer,
  lines: CartOfferLine[],
  promoCode?: string | null
): boolean {
  if (lines.length === 0) {
    return false;
  }

  if (offer.discount_type === "order") {
    if (offer.requires_promo_code && !String(promoCode ?? "").trim()) {
      return false;
    }
    return true;
  }

  if (offer.discount_type === "product") {
    return cartHasOfferProduct(offer, lines);
  }

  return false;
}

/** Order offer that applies when cart subtotal meets the minimum. */
export function qualifiesMinOrderOffer(
  offer: SalesPosApplicableOffer,
  subTotal: number
): boolean {
  return (
    offer.discount_type === "order" &&
    Boolean(offer.uses_min_order_total) &&
    subTotal >= (offer.min_order_amount ?? 0)
  );
}

export function findQualifyingMinOrderOffers(
  offers: SalesPosApplicableOffer[],
  lines: CartOfferLine[]
): SalesPosApplicableOffer[] {
  const subTotal = cartSubTotal(lines);
  return filterOrderOffers(offers).filter((offer) =>
    qualifiesMinOrderOffer(offer, subTotal)
  );
}

export function filterPromoOnlyOrderOffers(
  offers: SalesPosApplicableOffer[]
): SalesPosApplicableOffer[] {
  return filterOrderOffers(offers).filter((offer) => Boolean(offer.requires_promo_code));
}

async function resolveBestOfferIdByPreview(
  offers: SalesPosApplicableOffer[],
  lines: CartOfferLine[],
  saleDate: string,
  promoCode?: string | null,
  requirePositiveDiscount = false
): Promise<number | null> {
  if (offers.length === 0 || lines.length === 0) return null;
  if (offers.length === 1) {
    if (!requirePositiveDiscount) return offers[0].id;
    try {
      const preview = await previewOfferDiscount({
        offer_id: offers[0].id,
        sale_date: saleDate,
        promo_code: promoCode?.trim() || null,
        lines: lines.map((line) => ({
          item_id: line.item_id ?? null,
          item_number: line.item_number ?? null,
          item_batch_id: line.item_batch_id ?? null,
          description: line.description ?? "",
          qty: line.qty,
          unit_price: line.unit_price,
        })),
      });
      return preview.offer_discount > 0 ? offers[0].id : null;
    } catch {
      return null;
    }
  }

  const previewLines = lines.map((line) => ({
    item_id: line.item_id ?? null,
    item_number: line.item_number ?? null,
    item_batch_id: line.item_batch_id ?? null,
    description: line.description ?? "",
    qty: line.qty,
    unit_price: line.unit_price,
  }));

  const normalizedPromo = promoCode?.trim() || null;

  const results = await Promise.all(
    offers.map(async (offer) => {
      try {
        const preview = await previewOfferDiscount({
          offer_id: offer.id,
          sale_date: saleDate,
          promo_code: normalizedPromo,
          lines: previewLines,
        });
        return { id: offer.id, discount: preview.offer_discount };
      } catch {
        return { id: offer.id, discount: 0 };
      }
    })
  );

  const best = results.reduce((top, row) => (row.discount > top.discount ? row : top));
  if (requirePositiveDiscount && best.discount <= 0) return null;
  return best.id;
}

/** Pick the order offer (min total) that saves the most on the current cart. */
export async function resolveBestMinOrderOfferId(
  offers: SalesPosApplicableOffer[],
  lines: CartOfferLine[],
  saleDate: string,
  promoCode?: string | null
): Promise<number | null> {
  return resolveBestOfferIdByPreview(offers, lines, saleDate, promoCode);
}

/** Pick a promo-only order offer when the entered code matches. */
export async function resolvePromoOrderOfferId(
  offers: SalesPosApplicableOffer[],
  lines: CartOfferLine[],
  saleDate: string,
  promoCode: string
): Promise<number | null> {
  const code = promoCode.trim();
  if (!code) return null;
  return resolveBestOfferIdByPreview(offers, lines, saleDate, code, true);
}

/** Pick the product offer that saves the most on the current cart. */
export async function resolveBestProductOfferId(
  offers: SalesPosApplicableOffer[],
  lines: CartOfferLine[],
  saleDate: string,
  requirePositiveDiscount = false
): Promise<number | null> {
  if (offers.length === 0 || lines.length === 0) return null;

  const id = await resolveBestOfferIdByPreview(
    offers,
    lines,
    saleDate,
    null,
    requirePositiveDiscount
  );

  if (id != null) {
    return id;
  }

  if (offers.length === 1 && cartHasOfferProduct(offers[0], lines)) {
    return offers[0].id;
  }

  return null;
}

function previewLinesFromCart(lines: CartOfferLine[]) {
  return lines.map((line) => ({
    item_id: line.item_id ?? null,
    item_number: line.item_number ?? null,
    item_batch_id: line.item_batch_id ?? null,
    description: line.description ?? "",
    qty: line.qty,
    unit_price: line.unit_price,
  }));
}

async function previewOfferDiscountAmount(
  offerId: number,
  lines: CartOfferLine[],
  saleDate: string,
  promoCode?: string | null,
  pricingMode: SalePricingMode = "retail"
): Promise<number> {
  try {
    const preview = await previewOfferDiscount({
      offer_id: offerId,
      sale_date: saleDate,
      promo_code: promoCode?.trim() || null,
      pricing_mode: pricingMode,
      lines: previewLinesFromCart(lines),
    });
    return preview.offer_discount;
  } catch {
    return 0;
  }
}

/**
 * Pick product vs min-order offer when both could apply; prefers the larger discount.
 * Product offers that match the cart but save nothing are ignored so order offers can apply.
 */
export async function resolveBestAutoOfferId(
  matchingProductOffers: SalesPosApplicableOffer[],
  qualifyingMinOrderOffers: SalesPosApplicableOffer[],
  promoOnlyOrderOffers: SalesPosApplicableOffer[],
  lines: CartOfferLine[],
  saleDate: string,
  promoCode?: string | null,
  pricingMode: SalePricingMode = "retail"
): Promise<number | null> {
  const productId =
    matchingProductOffers.length > 0
      ? await resolveBestProductOfferId(
          matchingProductOffers,
          lines,
          saleDate,
          true
        )
      : null;

  let orderId: number | null = null;
  if (qualifyingMinOrderOffers.length === 1) {
    orderId = await resolveBestOfferIdByPreview(
      qualifyingMinOrderOffers,
      lines,
      saleDate,
      promoCode,
      true
    );
  } else if (qualifyingMinOrderOffers.length > 1) {
    orderId = await resolveBestMinOrderOfferId(
      qualifyingMinOrderOffers,
      lines,
      saleDate,
      promoCode
    );
  }

  let promoOrderId: number | null = null;
  const normalizedPromo = promoCode?.trim();
  if (promoOnlyOrderOffers.length > 0 && normalizedPromo) {
    promoOrderId = await resolvePromoOrderOfferId(
      promoOnlyOrderOffers,
      lines,
      saleDate,
      normalizedPromo
    );
  }

  const candidateIds = [productId, orderId, promoOrderId].filter(
    (id): id is number => id != null
  );
  if (candidateIds.length === 0) return null;
  if (candidateIds.length === 1) return candidateIds[0];

  const discounts = await Promise.all(
    candidateIds.map(async (id) => {
      const amount = await previewOfferDiscountAmount(
        id,
        lines,
        saleDate,
        promoCode,
        pricingMode
      );
      return { id, amount };
    })
  );

  const best = discounts.reduce((top, row) => (row.amount > top.amount ? row : top));
  return best.amount > 0 ? best.id : null;
}

/** Map item_number (lowercase) → active product offer. */
export function productOffersByItemNumber(
  offers: SalesPosApplicableOffer[]
): Map<string, SalesPosApplicableOffer> {
  const map = new Map<string, SalesPosApplicableOffer>();
  for (const offer of offers) {
    if (offer.discount_type !== "product") continue;
    for (const num of offer.item_numbers ?? []) {
      const key = num.trim().toLowerCase();
      if (key) map.set(key, offer);
    }
  }
  return map;
}

export function getProductOfferForItem(
  itemNumber: string | null | undefined,
  offerMap: Map<string, SalesPosApplicableOffer>
): SalesPosApplicableOffer | null {
  if (!itemNumber?.trim()) return null;
  return offerMap.get(itemNumber.trim().toLowerCase()) ?? null;
}

/** Map batch id → product offer when the offer is limited to specific batches. */
export function productOffersByBatchId(
  offers: SalesPosApplicableOffer[]
): Map<number, SalesPosApplicableOffer> {
  const map = new Map<number, SalesPosApplicableOffer>();
  for (const offer of offers) {
    if (offer.discount_type !== "product") continue;
    const batchIds = offer.item_batch_ids ?? [];
    if (batchIds.length === 0 && !offer.restricts_batches) continue;
    for (const batchId of batchIds) {
      if (!map.has(batchId)) map.set(batchId, offer);
    }
  }
  return map;
}

export function offerAppliesToBatch(
  offer: SalesPosApplicableOffer,
  batchId: number,
  itemNumber?: string | null
): boolean {
  if (offer.discount_type !== "product") return false;
  const batchIds = offer.item_batch_ids ?? [];
  const restrictsBatches = batchIds.length > 0 || Boolean(offer.restricts_batches);
  if (restrictsBatches) {
    return batchIds.includes(batchId);
  }
  if (!itemNumber?.trim()) return false;
  const key = itemNumber.trim().toLowerCase();
  return (offer.item_numbers ?? []).some((n) => n.trim().toLowerCase() === key);
}

export function getOfferForBatch(
  batchId: number,
  itemNumber: string | null | undefined,
  offers: SalesPosApplicableOffer[],
  salePricingMode: SalePricingMode = "retail"
): SalesPosApplicableOffer | null {
  for (const offer of offers) {
    if (!offerMatchesSalePricingMode(offer, salePricingMode)) continue;
    if (offerAppliesToBatch(offer, batchId, itemNumber)) return offer;
  }
  return null;
}

/** Product-level offer (all batches) when offer is not limited to specific batch ids. */
export function getOfferForItem(
  itemNumber: string | null | undefined,
  offers: SalesPosApplicableOffer[],
  salePricingMode: SalePricingMode = "retail"
): SalesPosApplicableOffer | null {
  if (!itemNumber?.trim()) return null;
  const key = itemNumber.trim().toLowerCase();
  for (const offer of offers) {
    if (offer.discount_type !== "product") continue;
    if (!offerMatchesSalePricingMode(offer, salePricingMode)) continue;
    const batchIds = offer.item_batch_ids ?? [];
    if (batchIds.length > 0 || offer.restricts_batches) continue;
    if ((offer.item_numbers ?? []).some((n) => n.trim().toLowerCase() === key)) {
      return offer;
    }
  }
  return null;
}

export function offerBadgeLabel(offer: SalesPosApplicableOffer): string {
  if (offer.product_percent_off) return `${offer.product_percent_off}% OFF`;
  if (offer.discount_summary) return offer.discount_summary;
  return offer.name;
}

export function offerMenuLabel(offer: SalesPosApplicableOffer): string {
  const priceTag =
    normalizeOfferPricingMode(offer.pricing_mode) === "both"
      ? ""
      : ` · ${offer.pricing_mode_label ?? offerPricingModeLabel(offer.pricing_mode)}`;

  if (offer.discount_type === "product") {
    const batchCount = offer.batch_count ?? offer.item_batch_ids?.length ?? 0;
    const restrictsBatches = batchCount > 0 || Boolean(offer.restricts_batches);
    const count = restrictsBatches
      ? batchCount
      : offer.selection_count ?? offer.item_count ?? offer.item_numbers?.length ?? 0;
    const unit = restrictsBatches ? "batch" : "product";
    const hint = offer.product_percent_off
      ? ` · ${offer.product_percent_off}% off`
      : offer.discount_summary
        ? ` · ${offer.discount_summary}`
        : "";
    return `${offer.name} (${count} ${unit}${count === 1 ? "" : "es"})${hint}${priceTag}`;
  }
  if (offer.uses_min_order_total) {
    return `${offer.name} (Order · min Rs ${offer.min_order_amount?.toFixed(0) ?? 0})${priceTag}`;
  }
  if (offer.requires_promo_code) {
    return `${offer.name} (Order · promo ${offer.promo_percent_off ?? 0}%)${priceTag}`;
  }
  return `${offer.name} (Order)${priceTag}`;
}
