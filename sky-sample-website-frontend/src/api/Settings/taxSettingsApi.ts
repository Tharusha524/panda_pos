import axios from "axios";

export type VatType = "none" | "exclusive" | "inclusive";

export interface VatRate {
  id: number;
  vat_code: string;
  vat_desc: string;
  vat_rate: number;
}

export interface TaxSettings {
  id: number;
  allow_vat: boolean;
  default_vat_rate_id: number | null;
  vat_type: VatType;
  default_vat_rate?: VatRate | null;
}

export interface TaxSettingsResponse {
  settings: TaxSettings;
  vat_rates: VatRate[];
}

export type TaxSettingsPayload = Partial<
  Pick<TaxSettings, "allow_vat" | "default_vat_rate_id" | "vat_type">
>;

export interface VatRatePayload {
  vat_code: string;
  vat_desc: string;
  vat_rate: number;
}

export interface PosTaxSettings {
  allow_vat: boolean;
  vat_type: VatType;
  default_vat_rate_id: number | null;
  default_vat_rate: VatRate | null;
  vat_rates: VatRate[];
}

export async function getTaxSettings(): Promise<TaxSettingsResponse> {
  const res = await axios.get("/api/settings/tax");
  return res.data.data;
}

export async function updateTaxSettings(
  payload: TaxSettingsPayload
): Promise<TaxSettingsResponse> {
  const res = await axios.put("/api/settings/tax", payload);
  return res.data.data;
}

export async function createVatRate(payload: VatRatePayload): Promise<TaxSettingsResponse> {
  const res = await axios.post("/api/settings/tax/vat-rates", payload);
  return res.data.data;
}

export async function updateVatRate(
  id: number,
  payload: Partial<VatRatePayload>
): Promise<TaxSettingsResponse> {
  const res = await axios.put(`/api/settings/tax/vat-rates/${id}`, payload);
  return res.data.data;
}

export async function deleteVatRate(id: number): Promise<TaxSettingsResponse> {
  const res = await axios.delete(`/api/settings/tax/vat-rates/${id}`);
  return res.data.data;
}

export async function assignVatToItems(
  itemIds: number[],
  vatRateId: number | null
): Promise<TaxSettingsResponse> {
  const res = await axios.post("/api/settings/tax/assign-items", {
    item_ids: itemIds,
    vat_rate_id: vatRateId,
  });
  return res.data.data;
}

export function formatVatRateLabel(rate: VatRate): string {
  return `${rate.vat_desc} - ${rate.vat_rate.toFixed(2)}%`;
}
