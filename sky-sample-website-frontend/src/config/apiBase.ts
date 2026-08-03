/**
 * Laravel API base URL (no trailing slash).
 * Axios paths like `/api/auth/login` → {base}/api/auth/login
 *
 * Priority: saved browser config → VITE_API_BASE_URL → dev/production default
 */
import { getStoredApiBaseUrl } from "./backendConfig";

const DEFAULT_PRODUCTION_API =
  "https://finance.skytechsl.com/pos/backend/public";

export function getApiBaseUrl(): string {
  const stored = getStoredApiBaseUrl();
  if (stored) {
    return stored;
  }

  const raw = import.meta.env.VITE_API_BASE_URL;
  const base =
    (typeof raw === "string" && raw.trim()) ||
    (import.meta.env.DEV ? "http://127.0.0.1:8000" : DEFAULT_PRODUCTION_API);

  return base.replace(/\/+$/, "");
}

/** @deprecated Dev proxy only; app uses direct API URL when VITE_API_BASE_URL is set. */
export function getViteProxyTarget(): string {
  return getApiBaseUrl();
}

export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${p.startsWith("/api") ? p : `/api${p}`}`;
}
