import axios from "axios";

export interface CompanySettings {
  id: number;
  name: string;
  logo_url: string | null;
  industry: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  tax_id: string;
  registration_number: string;
  currency: string;
  language: string;
}

export interface CompanyPrintHeader {
  company_name: string;
  logo_url: string | null;
  address_line: string;
  email: string;
  phone: string;
  tax_id: string;
  registration_number: string;
}

export type CompanySettingsPayload = Partial<
  Omit<CompanySettings, "id" | "logo_url">
>;

export type CompanyLocalePayload = {
  currency: string;
  language: string;
};

export async function getCompanySettings(): Promise<CompanySettings> {
  const res = await axios.get("/api/settings/company");
  return res.data.data;
}

export async function getCompanyPrintHeader(): Promise<CompanyPrintHeader> {
  const res = await axios.get("/api/settings/company/print-header");
  return res.data.data;
}

export async function updateCompanySettings(
  payload: CompanySettingsPayload
): Promise<CompanySettings> {
  const res = await axios.put("/api/settings/company", payload);
  return res.data.data;
}

export async function uploadCompanyLogo(file: File): Promise<CompanySettings> {
  const formData = new FormData();
  formData.append("logo", file);
  const res = await axios.post("/api/settings/company/logo", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
}

export async function deleteCompanyLogo(): Promise<CompanySettings> {
  const res = await axios.delete("/api/settings/company/logo");
  return res.data.data;
}

export async function updateCompanyLocale(
  payload: CompanyLocalePayload
): Promise<CompanySettings> {
  const res = await axios.put("/api/settings/company/locale", payload);
  return res.data.data;
}
