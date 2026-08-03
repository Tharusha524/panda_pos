import type { OrderSettings } from "../../../api/Settings/orderSettingsApi";

export type OrderToggleFieldKey = {
  [K in keyof OrderSettings]: OrderSettings[K] extends boolean ? K : never;
}[keyof OrderSettings];

export interface OrderToggleFieldDef {
  key: OrderToggleFieldKey;
  title: string;
  description: string;
}

export interface OrderSettingsSection {
  title: string;
  fields: OrderToggleFieldDef[];
}

export const SEARCH_KEY_STYLE_OPTIONS = [
  { value: "item_code_qty" as const, label: "Item code * Qty" },
  { value: "item_name_qty" as const, label: "Item name * Qty" },
  { value: "barcode_qty" as const, label: "Barcode * Qty" },
];

export const PAYMENT_METHOD_OPTIONS = [
  { value: "cash" as const, label: "Cash" },
  { value: "card" as const, label: "Card" },
  { value: "bank_transfer" as const, label: "Bank Transfer" },
  { value: "cheque" as const, label: "Cheque" },
  { value: "credit" as const, label: "Credit" },
];

export const ORDER_SETTINGS_SECTIONS: OrderSettingsSection[] = [
  {
    title: "Identification & shipping",
    fields: [
      {
        key: "allow_imei_serial_number",
        title: "Allow IMEI/Serial number",
        description:
          "IMEI / Serial number is a unique number used for identification and inventory purposes",
      },
      {
        key: "allow_batch_id_popup",
        title: "Allow batch ID popup",
        description:
          "A popup will appear to generate sales when an item has multiple batches",
      },
      {
        key: "allow_multiple_uom_for_sales_order",
        title: "Allow multiple UOM for sales order",
        description: "You can use 2 UOMs for one item when creating sales.",
      },
      {
        key: "allow_custom_fields_in_shipping_screen",
        title: "Allow custom fields in shipping screen",
        description:
          "You can use more fields (BSL Number, US Lot Number, Freight Cost, Invoice cost) when creating shipping.",
      },
    ],
  },
  {
    title: "Order additional features",
    fields: [
      {
        key: "allow_virtual_keyboard",
        title: "Allow Virtual Keyboard",
        description:
          "You can use Virtual keyboard to add order discount and reason",
      },
      {
        key: "allow_edit_selling_price",
        title: "Allow edit selling price",
        description: "You can edit selling price when creating sales.",
      },
      {
        key: "allow_purchase_price_show_in_order_screen",
        title: "Allow purchase price show in order screen",
        description:
          "You can view item purchase price in Modify item information popup",
      },
      {
        key: "hide_quantity_from_plu_on_sales_screen",
        title: "Hide quantity from PLU on the sales screen.",
        description: "You can hide quantity on PLU.",
      },
      {
        key: "allow_verify_credit_card_for_sales_return_refund",
        title: "Allow to verify credit card for sales return refund.",
        description:
          "Verify credit card last 4 digits when refunding sales return.",
      },
      {
        key: "allow_additional_item_details_on_sales",
        title: "Allow additional item details on the sales.",
        description: "You can add additional item details on the sales screen.",
      },
      {
        key: "allow_wholesale_price_popup_on_sales_screen",
        title: "Allow a wholesale price popup on the sales screen.",
        description:
          "With this option enabled, a popup on the sales screen displays both wholesale and retail prices for items, allowing users to choose which pricing to use for sales.",
      },
    ],
  },
  {
    title: "General order behavior",
    fields: [
      {
        key: "allow_order_confirmation_popup",
        title: "Allow order confirmation popup",
        description:
          "It shows a summary of the order and confirms that the order has been created.",
      },
      {
        key: "allow_past_date_in_sales_order",
        title: "Allow Past date in sales order",
        description: "Allow back date in sales order [past date Sales].",
      },
      {
        key: "allow_service_charge",
        title: "Allow delivery / service charge",
        description: "Show delivery cost field at POS checkout and add it to the sale total.",
      },
      {
        key: "allow_item_auto_entry",
        title: "Allow item auto entry",
        description:
          "It allows items to add to the order list at the time of searching for the items on the order screen.",
      },
      {
        key: "allow_sales_negative_inventory",
        title: "Allow sales for items with negative inventory",
        description: "It allows to sell zero or negative quantity items.",
      },
      {
        key: "allow_quotation_negative_inventory",
        title: "Allow quotation for items with negative inventory",
        description: "It allows to quotation zero or negative quantity items.",
      },
      {
        key: "allow_ingredients_items_in_sales",
        title: "Allow ingredients items in sales",
        description: "It allows the selling of manufacturing / Ingredient items.",
      },
    ],
  },
  {
    title: "Pricing, offers & hold orders",
    fields: [
      {
        key: "allow_view_wholesale_retail_prices_by_clicking",
        title: "Allow the option to view wholesale and retail prices by clicking",
        description:
          "By enabling this option, users can click a View button on the sales screen to see both wholesale and retail prices displayed.",
      },
      {
        key: "allow_switching_wholesale_retail_prices",
        title: "Allow switching between wholesale and retail prices on the sales screen.",
        description:
          "This feature enables users to switch the display of prices between wholesale and retail rates on the sales screen.",
      },
      {
        key: "allow_offer",
        title: "Allow Offer",
        description:
          "Enable product and order offers on the sales screen. Each offer can be set for retail only, wholesale only, or both.",
      },
      {
        key: "allow_offer_for_wholesale_price",
        title: "Allow offer for wholesale price",
        description:
          "Enable wholesale pricing on sales. Offer retail/wholesale scope is set per offer.",
      },
      {
        key: "allow_customer_advance_payment",
        title: "Allow customer advance payment",
        description:
          "Let customers pay in advance, which can be used for future orders.",
      },
      {
        key: "allow_deletion_of_hold_orders",
        title: "Allow deletion of hold orders.",
        description: "It allows canceling or deleting the orders.",
      },
      {
        key: "allow_editing_of_hold_orders",
        title: "Allow editing of hold orders.",
        description: "It allows editing of hold orders via the order list.",
      },
      {
        key: "allow_order_discount",
        title: "Allow order discount",
        description: "It allows giving a discount for the order.",
      },
    ],
  },
];
