import axios from "axios";

export type SearchBoxShortKeyStyle =
  | "item_code_qty"
  | "item_name_qty"
  | "barcode_qty";

export type DefaultPaymentMethod =
  | "cash"
  | "card"
  | "bank_transfer"
  | "cheque"
  | "credit";

export interface OrderSettings {
  id: number;
  allow_imei_serial_number: boolean;
  allow_batch_id_popup: boolean;
  allow_multiple_uom_for_sales_order: boolean;
  allow_custom_fields_in_shipping_screen: boolean;
  search_box_short_key_style: SearchBoxShortKeyStyle;
  allow_virtual_keyboard: boolean;
  allow_edit_selling_price: boolean;
  allow_purchase_price_show_in_order_screen: boolean;
  hide_quantity_from_plu_on_sales_screen: boolean;
  allow_verify_credit_card_for_sales_return_refund: boolean;
  allow_additional_item_details_on_sales: boolean;
  allow_wholesale_price_popup_on_sales_screen: boolean;
  allow_order_confirmation_popup: boolean;
  allow_past_date_in_sales_order: boolean;
  default_payment_method: DefaultPaymentMethod;
  allow_service_charge: boolean;
  credit_debit_card_payment_charges_percent: number;
  allow_item_auto_entry: boolean;
  allow_sales_negative_inventory: boolean;
  allow_quotation_negative_inventory: boolean;
  allow_ingredients_items_in_sales: boolean;
  allow_view_wholesale_retail_prices_by_clicking: boolean;
  allow_switching_wholesale_retail_prices: boolean;
  allow_offer: boolean;
  allow_offer_for_wholesale_price: boolean;
  allow_customer_advance_payment: boolean;
  allow_deletion_of_hold_orders: boolean;
  allow_editing_of_hold_orders: boolean;
  hold_order_pin: string;
  allow_order_discount: boolean;
}

export type OrderSettingsPayload = Partial<Omit<OrderSettings, "id">>;

export async function getOrderSettings(): Promise<OrderSettings> {
  const res = await axios.get("/api/settings/order");
  return res.data.data;
}

export async function updateOrderSettings(
  payload: OrderSettingsPayload
): Promise<OrderSettings> {
  const res = await axios.put("/api/settings/order", payload);
  return res.data.data;
}
