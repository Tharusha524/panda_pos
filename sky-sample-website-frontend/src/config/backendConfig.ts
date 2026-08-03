const STORAGE_KEY = "pos_backend_api_url";
const CONFIGURED_FLAG_KEY = "pos_backend_configured";

/** Remove trailing slashes and accidental `/api` suffix from pasted URLs. */
export function normalizeApiBaseUrl(raw: string): string {
  let url = raw.trim().replace(/\/+$/, "");
  if (url.endsWith("/api")) {
    url = url.slice(0, -4).replace(/\/+$/, "");
  }
  return url;
}

export function getStoredApiBaseUrl(): string | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (!value?.trim()) {
      return null;
    }
    return normalizeApiBaseUrl(value);
  } catch {
    return null;
  }
}

/** True when the user saved a URL or the build has VITE_API_BASE_URL set. */
export function isBackendConfigured(): boolean {
  if (getStoredApiBaseUrl()) {
    return true;
  }
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  return typeof envUrl === "string" && envUrl.trim().length > 0;
}

export function saveBackendApiBaseUrl(url: string): void {
  const normalized = normalizeApiBaseUrl(url);
  if (!normalized) {
    throw new Error("Backend API URL is required.");
  }
  localStorage.setItem(STORAGE_KEY, normalized);
  localStorage.setItem(CONFIGURED_FLAG_KEY, "1");
}

export function clearBackendConfiguration(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(CONFIGURED_FLAG_KEY);
}

export async function testBackendConnection(
  baseUrl: string
): Promise<{ ok: boolean; message: string }> {
  const base = normalizeApiBaseUrl(baseUrl);
  if (!base) {
    return { ok: false, message: "Enter a backend URL first." };
  }

  const testUrl = `${base}/api/auth/login`;

  try {
    const response = await fetch(testUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (response.status === 404) {
      return {
        ok: false,
        message:
          "Server responded but /api/auth/login was not found. Check the Laravel public URL.",
      };
    }

    return {
      ok: true,
      message: `Backend reachable at ${base}`,
    };
  } catch {
    return {
      ok: false,
      message: `Cannot reach ${base}. Check the URL, CORS, and that the server is running.`,
    };
  }
}

export const BACKEND_URL_PRESETS = [
  { label: "Local (127.0.0.1:8000)", value: "http://127.0.0.1:8000" },
  { label: "Local (localhost:8000)", value: "http://localhost:8000" },
  {
    label: "Production",
    value: "https://finance.skytechsl.com/pos/backend/public",
  },
] as const;
