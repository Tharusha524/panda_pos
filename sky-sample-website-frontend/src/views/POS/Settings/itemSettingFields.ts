import type { ItemSettings } from "../../../api/Settings/itemSettingsApi";

export type ItemSettingFieldKey = keyof Omit<ItemSettings, "id">;

export interface ItemSettingFieldDef {
  key: ItemSettingFieldKey;
  title: string;
  description: string;
}

export const ITEM_SETTING_FIELDS: ItemSettingFieldDef[] = [
  {
    key: "allow_auto_number",
    title: "Allow auto number",
    description:
      "Auto Number | SKU is a unique code assigned internally to a product.",
  },
  {
    key: "allow_item_discount",
    title: "Allow item discount",
    description:
      "It allows giving a discount for an item in the order screen.",
  },
  {
    key: "allow_wholesale_price",
    title: "Allow wholesale price",
    description:
      "It allows you to add wholesale prices for an item in the add item screen.",
  },
  {
    key: "allow_upload_item_image",
    title: "Allow Upload Item Image",
    description: "You can upload image for Item.",
  },
  {
    key: "allow_variant_in_add_item",
    title: "Allow variant in add item",
    description:
      "It allows you to add items that are similar but differ in certain aspects such as color, size and etc.",
  },
  {
    key: "allow_quick_add_item_in_sales_screen",
    title: "Allow quick add item in sales screen",
    description:
      "If search for a new item on the order screen, you can quickly add an item.",
  },
  {
    key: "allow_favorite_items_on_sales_screen",
    title: "Allow to add favorite items to the sales screen.",
    description: "You can set favorite items on the Sales screen.",
  },
  {
    key: "allow_editing_purchase_price_in_inventory_dashboard",
    title: "Allow editing purchase price in the inventory dashboard.",
    description:
      "Enable this option to allow editing the purchase price in the inventory dashboard.",
  },
  {
    key: "allow_total_price_entry_on_sales_screen",
    title: "Allow Total Price Entry on Sales Screen",
    description:
      "Use the item edit dialog to enter the total amount and auto-calculate quantity (Total ÷ Unit Price) on the sales screen.",
  },
];
