import type { DiscountRules, OfferPayload, OrderDiscountRules, ProductDiscountRules } from "../../../api/offersApi";

export const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const DEFAULT_PRODUCT_RULES: ProductDiscountRules = {
  buy_x_percent_off_all: {
    enabled: true,
    buy_quantity: 0,
    product_id: null,
    product_name: "",
    percent_off: 0,
  },
  set_percent_selected: {
    enabled: false,
    percent_off: 0,
    product_name: "",
  },
  bargain_bin: {
    enabled: false,
    price: 0,
  },
  buy_x_fixed_off: {
    enabled: false,
    buy_quantity: 0,
    product_id: null,
    product_name: "",
    amount_off: 0,
  },
  buy_x_amount_off_each: {
    enabled: false,
    buy_quantity: 0,
    product_id: null,
    product_name: "",
    amount_off_each: 0,
  },
};

export const DEFAULT_ORDER_RULES: OrderDiscountRules = {
  order_min_total_percent: {
    enabled: true,
    min_order_amount: 0,
    percent_off: 0,
  },
  order_promo_code_percent: {
    enabled: false,
    percent_off: 0,
    promo_code: "",
  },
};

export const DEFAULT_DISCOUNT_RULES: DiscountRules = {
  ...DEFAULT_PRODUCT_RULES,
  ...DEFAULT_ORDER_RULES,
};

export const OFFER_PRICING_MODE_OPTIONS = [
  { value: "both", label: "Retail & Wholesale" },
  { value: "retail", label: "Retail only" },
  { value: "wholesale", label: "Wholesale only" },
] as const;

export const EMPTY_OFFER_FORM: OfferPayload = {
  name: "",
  description: "",
  days_of_week_enabled: false,
  days_of_week: [],
  expiration_enabled: false,
  expiration_date: null,
  discount_type: "product",
  pricing_mode: "both",
  discount_rules: DEFAULT_DISCOUNT_RULES,
  is_active: true,
  item_ids: [],
  item_batch_ids: [],
};

export function mergeDiscountRules(stored: DiscountRules | undefined): DiscountRules {
  return {
    ...DEFAULT_DISCOUNT_RULES,
    ...stored,
    buy_x_percent_off_all: {
      ...DEFAULT_PRODUCT_RULES.buy_x_percent_off_all,
      ...stored?.buy_x_percent_off_all,
    },
    set_percent_selected: {
      ...DEFAULT_PRODUCT_RULES.set_percent_selected,
      ...stored?.set_percent_selected,
    },
    bargain_bin: { ...DEFAULT_PRODUCT_RULES.bargain_bin, ...stored?.bargain_bin },
    buy_x_fixed_off: {
      ...DEFAULT_PRODUCT_RULES.buy_x_fixed_off,
      ...stored?.buy_x_fixed_off,
    },
    buy_x_amount_off_each: {
      ...DEFAULT_PRODUCT_RULES.buy_x_amount_off_each,
      ...stored?.buy_x_amount_off_each,
    },
    order_min_total_percent: {
      ...DEFAULT_ORDER_RULES.order_min_total_percent,
      ...stored?.order_min_total_percent,
    },
    order_promo_code_percent: {
      ...DEFAULT_ORDER_RULES.order_promo_code_percent,
      ...stored?.order_promo_code_percent,
    },
  };
}

export function isOrderDiscountType(type: string): boolean {
  return type === "order";
}

/** Defaults when creating/editing an order-type offer. */
export function orderTypeDiscountRules(): DiscountRules {
  return {
    ...DEFAULT_PRODUCT_RULES,
    buy_x_percent_off_all: { ...DEFAULT_PRODUCT_RULES.buy_x_percent_off_all, enabled: false },
    set_percent_selected: { ...DEFAULT_PRODUCT_RULES.set_percent_selected, enabled: false },
    bargain_bin: { ...DEFAULT_PRODUCT_RULES.bargain_bin, enabled: false },
    buy_x_fixed_off: { ...DEFAULT_PRODUCT_RULES.buy_x_fixed_off, enabled: false },
    buy_x_amount_off_each: { ...DEFAULT_PRODUCT_RULES.buy_x_amount_off_each, enabled: false },
    order_min_total_percent: { ...DEFAULT_ORDER_RULES.order_min_total_percent, enabled: true },
    order_promo_code_percent: { ...DEFAULT_ORDER_RULES.order_promo_code_percent, enabled: false },
  };
}
