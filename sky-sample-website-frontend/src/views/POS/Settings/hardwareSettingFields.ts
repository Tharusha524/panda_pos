import type { HardwareSettings } from "../../../api/Settings/hardwareSettingsApi";

export type HardwareToggleFieldKey = {
  [K in keyof HardwareSettings]: HardwareSettings[K] extends boolean ? K : never;
}[keyof HardwareSettings];

export interface HardwareToggleFieldDef {
  key: HardwareToggleFieldKey;
  title: string;
  description: string;
}

export const PAPER_SIZE_OPTIONS = [
  { value: "a4" as const, label: "A4" },
  { value: "a5" as const, label: "A5" },
  { value: "80mm" as const, label: "80mm" },
  { value: "letter" as const, label: "Letter" },
];

export const RECEIPT_STYLE_OPTIONS = [
  { value: "style_1" as const, label: "Style 1" },
  { value: "style_2" as const, label: "Style 2" },
  { value: "style_3" as const, label: "Style 3" },
  { value: "style_4" as const, label: "Style 4" },
];

export const LETTERHEAD_MARGIN_OPTIONS = [
  { value: "none" as const, label: "None" },
  { value: "5" as const, label: "5 cm" },
  { value: "10" as const, label: "10 cm" },
  { value: "15" as const, label: "15 cm" },
  { value: "20" as const, label: "20 cm" },
];

export const HARDWARE_PRINTING_TOGGLES: HardwareToggleFieldDef[] = [
  {
    key: "allow_auto_print",
    title: "Allow auto print",
    description: "Automatically print after creating Sales",
  },
  {
    key: "allow_multiple_printers",
    title: "Allow multiple printers in to one system",
    description: "You can connect two printers at the same time",
  },
  {
    key: "allow_customer_display",
    title: "Allow customer display",
    description: "Connect and test a customer display",
  },
  {
    key: "allow_company_details_receipt",
    title: "Allow company details receipt",
    description:
      "Show your company name, address, phone number for report print",
  },
  {
    key: "allow_custom_header_on_sales_receipt",
    title: "Allow custom header on Sales receipt printout",
    description:
      "Customize your company name, address, phone number for receipt",
  },
];

export const HARDWARE_RECEIPT_TOGGLES: HardwareToggleFieldDef[] = [
  {
    key: "allow_dual_language_print",
    title: "Allow dual language print",
    description:
      "When you print, select your preferred language to print the sale receipt.",
  },
  {
    key: "show_barcode_on_sales_receipt",
    title: "Show barcode on sales receipt",
    description: "Display Order ID barcode on the sales receipt.",
  },
  {
    key: "show_item_uom_on_sales_receipt",
    title: "Show item UOM on sales receipt",
    description:
      "Enable this option to display the Unit of Measurement (UOM) for each item on the sale receipt.",
  },
  {
    key: "allow_customer_details_on_sales_receipt",
    title: "Allow showing Customer details on the top of the Sales receipt printout",
    description: "Customer details display on the top of the bills.",
  },
  {
    key: "allow_discount_on_sales_receipt",
    title: "Allow to show discount on Sales receipt printout",
    description: "Display order discount in print.",
  },
  {
    key: "allow_logo_on_sales_receipt",
    title: "Allow logo on Sales receipt printout",
    description: "You can choose the logo to print on your Sales receipt.",
  },
];
