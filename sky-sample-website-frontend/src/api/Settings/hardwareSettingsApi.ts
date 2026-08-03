import axios from "axios";

export type PrintingPaperSize = "a4" | "a5" | "80mm" | "letter";
export type SalesReceiptStyle = "style_1" | "style_2" | "style_3" | "style_4";
export type LetterheadMargin = "none" | "5" | "10" | "15" | "20";

export interface HardwareSettings {
  id: number;
  printing_paper_size: PrintingPaperSize;
  sales_receipt_printout_style: SalesReceiptStyle;
  allow_auto_print: boolean;
  allow_multiple_printers: boolean;
  allow_customer_display: boolean;
  allow_company_details_receipt: boolean;
  allow_custom_header_on_sales_receipt: boolean;
  custom_header_name: string;
  custom_header_address: string;
  custom_header_phone: string;
  allow_dual_language_print: boolean;
  show_barcode_on_sales_receipt: boolean;
  show_item_uom_on_sales_receipt: boolean;
  allow_customer_details_on_sales_receipt: boolean;
  allow_discount_on_sales_receipt: boolean;
  allow_logo_on_sales_receipt: boolean;
  customize_label_for_discount: string;
  letterhead_top_margin_cm: LetterheadMargin;
  logo_80mm_url: string | null;
  logo_a4_a5_url: string | null;
}

export type HardwareSettingsPayload = Partial<
  Omit<HardwareSettings, "id" | "logo_80mm_url" | "logo_a4_a5_url">
>;

export async function getHardwareSettings(): Promise<HardwareSettings> {
  const res = await axios.get("/api/settings/hardware");
  return res.data.data;
}

export async function updateHardwareSettings(
  payload: HardwareSettingsPayload
): Promise<HardwareSettings> {
  const res = await axios.put("/api/settings/hardware", payload);
  return res.data.data;
}

export async function uploadHardwareLogo80mm(
  file: File
): Promise<HardwareSettings> {
  const formData = new FormData();
  formData.append("logo", file);
  const res = await axios.post("/api/settings/hardware/logo-80mm", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
}

export async function uploadHardwareLogoA4(
  file: File
): Promise<HardwareSettings> {
  const formData = new FormData();
  formData.append("logo", file);
  const res = await axios.post("/api/settings/hardware/logo-a4", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
}

export async function deleteHardwareLogo80mm(): Promise<HardwareSettings> {
  const res = await axios.delete("/api/settings/hardware/logo-80mm");
  return res.data.data;
}

export async function deleteHardwareLogoA4(): Promise<HardwareSettings> {
  const res = await axios.delete("/api/settings/hardware/logo-a4");
  return res.data.data;
}

export async function openCashDrawer(): Promise<{ opened: boolean; message: string }> {
  const res = await axios.post("/api/settings/hardware/open-cash-drawer");
  return res.data.data;
}
