import type { InventorySettings } from "../../../api/Settings/inventorySettingsApi";

export type InventoryToggleFieldKey = keyof Pick<
  InventorySettings,
  | "allow_tog"
  | "allow_request_for_quotation"
  | "allow_inventory_location_filter"
>;

export interface InventoryToggleFieldDef {
  key: InventoryToggleFieldKey;
  title: string;
  description: string;
}

export const INVENTORY_TOGGLE_FIELDS: InventoryToggleFieldDef[] = [
  {
    key: "allow_tog",
    title: "Allow TOG",
    description:
      "Transferring inventory from one location to another location.",
  },
  {
    key: "allow_request_for_quotation",
    title: "Allow Request For Quotation",
    description: "Allows you to create a RFQ to your supplier.",
  },
  {
    key: "allow_inventory_location_filter",
    title: "Allow Inventory location filter in dashboard & reports",
    description: "You can get the reports by inventory locations",
  },
];

export const COSTING_METHOD_OPTIONS = [
  {
    value: "FIFO" as const,
    label: "FIFO",
    description:
      "FIFO - The costs of the very first products purchased are the first to be expensed",
  },
  {
    value: "LIFO" as const,
    label: "LIFO",
    description:
      "LIFO - The costs of the most recently purchased products are the first to be expensed",
  },
];
