import axios from "axios";

export interface NotificationChannelConfig {
  enabled: boolean;
  send_email: boolean;
  send_sms: boolean;
  email_subject: string;
  email_body: string;
  sms_template: string;
}

export type NotificationChannelPayload = Partial<NotificationChannelConfig>;

export async function getSalesNotificationSettings(): Promise<NotificationChannelConfig> {
  const res = await axios.get("/api/settings/notifications/sales");
  return res.data.data;
}

export async function updateSalesNotificationSettings(
  payload: NotificationChannelPayload
): Promise<NotificationChannelConfig> {
  const res = await axios.put("/api/settings/notifications/sales", payload);
  return res.data.data;
}

export async function getPaymentNotificationSettings(): Promise<NotificationChannelConfig> {
  const res = await axios.get("/api/settings/notifications/payment");
  return res.data.data;
}

export async function updatePaymentNotificationSettings(
  payload: NotificationChannelPayload
): Promise<NotificationChannelConfig> {
  const res = await axios.put("/api/settings/notifications/payment", payload);
  return res.data.data;
}
