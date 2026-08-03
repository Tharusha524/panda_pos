import type { Item } from "../../../api/itemsApi";
import type { DiscountRules, Offer, OfferPayload } from "../../../api/offersApi";
import { isOrderDiscountType, mergeDiscountRules, orderTypeDiscountRules } from "./offerDefaults";

/** Link every branch/batch row that shares an item_number with the selected ids. */
export function expandItemIdsByItemNumber(items: Item[], selectedIds: number[]): number[] {
  const selected = new Set(selectedIds);
  const numbers = new Set<string>();
  for (const item of items) {
    if (selected.has(item.id) && item.item_number?.trim()) {
      numbers.add(item.item_number.trim());
    }
  }
  if (numbers.size === 0) {
    return [...selected];
  }
  const expanded = new Set(selected);
  for (const item of items) {
    const num = item.item_number?.trim();
    if (num && numbers.has(num)) {
      expanded.add(item.id);
    }
  }
  return [...expanded];
}

function normalizeRulesForType(
  discountType: string,
  rules: DiscountRules
): DiscountRules {
  const merged = mergeDiscountRules(rules);
  if (isOrderDiscountType(discountType)) {
    const orderDefaults = orderTypeDiscountRules();
    return {
      ...orderDefaults,
      order_min_total_percent: {
        ...orderDefaults.order_min_total_percent,
        ...merged.order_min_total_percent,
      },
      order_promo_code_percent: {
        ...orderDefaults.order_promo_code_percent,
        ...merged.order_promo_code_percent,
      },
    };
  }
  return {
    ...merged,
    order_min_total_percent: {
      ...merged.order_min_total_percent,
      enabled: false,
    },
    order_promo_code_percent: {
      ...merged.order_promo_code_percent,
      enabled: false,
    },
  };
}

export function offerFormFromApi(offer: Offer): OfferPayload {
  return {
    name: offer.name ?? "",
    description: offer.description ?? "",
    days_of_week_enabled: offer.days_of_week_enabled,
    days_of_week: offer.days_of_week ?? [],
    expiration_enabled: offer.expiration_enabled,
    expiration_date: offer.expiration_date,
    discount_type: offer.discount_type,
    pricing_mode: offer.pricing_mode ?? "both",
    discount_rules: mergeDiscountRules(offer.discount_rules),
    is_active: offer.is_active,
    item_ids: offer.item_ids ?? [],
    item_batch_ids: offer.item_batch_ids ?? [],
  };
}

export function buildOfferSavePayload(
  form: OfferPayload,
  catalogItems: Item[] = []
): OfferPayload {
  const name = String(form.name ?? "").trim();
  if (!name) {
    throw new Error("Offer name is required.");
  }

  const discountType = form.discount_type ?? "product";
  const itemIds =
    discountType === "order"
      ? []
      : expandItemIdsByItemNumber(catalogItems, form.item_ids ?? []);

  if (discountType === "product" && itemIds.length === 0) {
    throw new Error("Select at least one product for this offer.");
  }

  return {
    name,
    description: form.description?.trim() ? form.description.trim() : null,
    days_of_week_enabled: Boolean(form.days_of_week_enabled),
    days_of_week: form.days_of_week ?? [],
    expiration_enabled: Boolean(form.expiration_enabled),
    expiration_date: form.expiration_date || null,
    discount_type: discountType,
    pricing_mode: form.pricing_mode ?? "both",
    discount_rules: normalizeRulesForType(discountType, form.discount_rules),
    is_active: form.is_active ?? true,
    item_ids: itemIds,
    item_batch_ids: discountType === "order" ? [] : form.item_batch_ids ?? [],
  };
}
