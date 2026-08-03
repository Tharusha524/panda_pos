import axios from "axios";

export interface CompanyNotificationSettings {
  id: number;
  company_id: number;
  company_name: string;
  company_email: string;
  company_phone: string;
  alerts_enabled: boolean;
  send_email: boolean;
  send_sms: boolean;
  notify_owner: boolean;
  notify_employees: boolean;
  daily_digest: boolean;
  last_broadcast_at: string | null;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_username: string | null;
  has_smtp_password: boolean;
  smtp_encryption: string;
  mail_from_address: string | null;
  mail_from_name: string | null;
  sms_api_url: string | null;
  sms_provider: string;
  has_sms_api_key: boolean;
  email_configured: boolean;
  sms_configured: boolean;
}

export type CompanyNotificationSettingsPayload = Partial<{
  alerts_enabled: boolean;
  send_email: boolean;
  send_sms: boolean;
  notify_owner: boolean;
  notify_employees: boolean;
  daily_digest: boolean;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_username: string | null;
  smtp_password: string;
  smtp_encryption: string;
  mail_from_address: string | null;
  mail_from_name: string | null;
  sms_api_url: string | null;
  sms_api_key: string;
  sms_provider: string;
}>;

export interface CompanyNotificationTestResult {
  email_sent: boolean;
  sms_sent: boolean;
  email: string | null;
  phone: string | null;
  errors: string[];
  sms_mode?: "log";
}

export async function getCompanyNotificationSettings(): Promise<CompanyNotificationSettings> {
  const res = await axios.get("/api/settings/company/notifications");
  return res.data.data;
}

export async function updateCompanyNotificationSettings(
  payload: CompanyNotificationSettingsPayload
): Promise<CompanyNotificationSettings> {
  const res = await axios.put("/api/settings/company/notifications", payload);
  return res.data.data;
}

export async function sendCompanyNotificationTest(): Promise<CompanyNotificationTestResult> {
  const res = await axios.post("/api/settings/company/notifications/send-test");
  return res.data.data;
}
