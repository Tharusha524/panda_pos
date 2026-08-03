import axios from "axios";

export interface AlertSettings {
  id: number;
  expiry_alert_period_days: number;
  cheque_alert_period_days: number;
  staff_notify_email: string | null;
  staff_notify_phone: string | null;
  staff_send_email: boolean;
  staff_send_sms: boolean;
  staff_daily_digest: boolean;
  staff_last_notified_at: string | null;
}

export type AlertSettingsPayload = Partial<Omit<AlertSettings, "id">>;

export interface StaffAlertTestResult {
  email_sent: boolean;
  sms_sent: boolean;
  email: string | null;
  phone: string | null;
  errors: string[];
  sms_mode?: "log";
  sms_config?: {
    configured: boolean;
    provider: string | null;
    source: string | null;
    hint: string;
  };
}

export async function getAlertSettings(): Promise<AlertSettings> {
  const res = await axios.get("/api/settings/alert");
  return res.data.data;
}

export async function updateAlertSettings(
  payload: AlertSettingsPayload
): Promise<AlertSettings> {
  const res = await axios.put("/api/settings/alert", payload);
  return res.data.data;
}

export interface AlertTemplatePreview {
  email_subject: string;
  email_html: string;
  email_text: string;
  sms_body: string;
}

export async function getAlertTemplatePreview(): Promise<AlertTemplatePreview> {
  const res = await axios.get("/api/notifications/alerts/template-preview");
  return res.data.data;
}

export async function sendStaffAlertTest(): Promise<StaffAlertTestResult> {
  const res = await axios.post("/api/notifications/alerts/send-test");
  return res.data.data;
}
