import axios from "axios";

export interface ApiEndpointInfo {
  method: string;
  path: string;
  description: string;
}

export interface ApiSettings {
  id: number;
  api_enabled: boolean;
  public_base_url: string | null;
  has_integration_api_key: boolean;
  integration_api_key_preview: string | null;
  webhook_enabled: boolean;
  webhook_url: string | null;
  has_webhook_secret: boolean;
  webhook_secret_preview: string | null;
  cors_allowed_origins: string | null;
  mobile_sync_enabled: boolean;
  mobile_sync_interval_seconds: number;
  sms_api_url: string | null;
  has_sms_api_key: boolean;
  sms_api_key_preview: string | null;
  payment_gateway: string;
  has_payment_gateway_key: boolean;
  payment_gateway_key_preview: string | null;
  notes: string | null;
  endpoint_catalog: ApiEndpointInfo[];
  integration_api_key_plain?: string;
}

export type ApiSettingsPayload = Partial<{
  api_enabled: boolean;
  public_base_url: string | null;
  integration_api_key: string;
  webhook_enabled: boolean;
  webhook_url: string | null;
  webhook_secret: string;
  cors_allowed_origins: string | null;
  mobile_sync_enabled: boolean;
  mobile_sync_interval_seconds: number;
  sms_api_url: string | null;
  sms_api_key: string;
  payment_gateway: string;
  payment_gateway_key: string;
  notes: string | null;
}>;

export async function getApiSettings(): Promise<ApiSettings> {
  const res = await axios.get("/api/settings/api");
  return res.data.data;
}

export async function updateApiSettings(payload: ApiSettingsPayload): Promise<ApiSettings> {
  const res = await axios.put("/api/settings/api", payload);
  return res.data.data;
}

export async function regenerateIntegrationApiKey(): Promise<ApiSettings> {
  const res = await axios.post("/api/settings/api/regenerate-key");
  return res.data.data;
}
