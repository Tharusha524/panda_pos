import axios, { AxiosRequestHeaders } from "axios";
import {
  APP_BASE,
  LOGIN_PATH_ABSOLUTE,
  SUBSCRIPTION_MANAGE_ABSOLUTE,
} from "../config/appPaths";
import { getApiBaseUrl } from "../config/apiBase";
import { getFriendlyErrorMessage } from "../utils/getFriendlyErrorMessage";
import { clearAuthStorage, getStoredToken } from "../utils/authSession";

/** Login/register only — must not match `/api/auth/login-history`. */
function isPublicAuthRequest(requestUrl: string): boolean {
  const path = requestUrl.split("?")[0].replace(/\/+$/, "");
  return (
    path.endsWith("/api/auth/login") || path.endsWith("/api/auth/register")
  );
}

axios.interceptors.request.use(
  function (config) {
    config.baseURL = getBaseUrl();

    try {
      const requestUrl = String(config.url ?? "");
      const isAuthRequest = isPublicAuthRequest(requestUrl);

      const token = getStoredToken();

      if (!config.headers) {
        config.headers = {} as AxiosRequestHeaders;
      }

      if (token && !isAuthRequest) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      const isFormData =
        typeof FormData !== "undefined" && config.data instanceof FormData;

      config.headers["Accept"] = "application/json";
      if (!isFormData) {
        config.headers["Content-Type"] = "application/json";
      }

      config.validateStatus = (status: number) => status >= 200 && status < 300;
    } catch (error) {
      console.error(
        "Error setting Authorization header or validateStatus:",
        error
      );
    }

    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

function getBaseUrl(): string {
  return getApiBaseUrl();
}

axios.interceptors.response.use(
  (response) => response,
  function (error) {
    console.error("API Error:", {
      url: error?.config?.url,
      method: error?.config?.method,
      status: error?.response?.status,
      message: error?.message,
    });

    const requestUrl = String(error?.config?.url ?? "");
    const isAuthRequest = isPublicAuthRequest(requestUrl);

    if (error?.response?.status === 401) {
      if (!isAuthRequest) {
        clearAuthStorage();
        const loginPath = LOGIN_PATH_ABSOLUTE.replace(/\/$/, "") || "/";
        const current = window.location.pathname.replace(/\/$/, "") || "/";
        if (current !== loginPath && (!APP_BASE || !current.endsWith(APP_BASE))) {
          window.location.replace(LOGIN_PATH_ABSOLUTE);
        }
      }
    }

    if (error?.response?.status === 402) {
      if (!window.location.pathname.includes(`${APP_BASE}/settings/subscription`)) {
        window.location.replace(SUBSCRIPTION_MANAGE_ABSOLUTE);
      }
    }
    
    const response = error?.response;
    const serverMsg = String(response?.data?.message ?? "");

    let friendlyMessage = getFriendlyErrorMessage(response ?? error);

    if (isAuthRequest && serverMsg.includes("SQLSTATE")) {
      friendlyMessage =
        "Production database is missing the company_id column. In cPanel/phpMyAdmin run the SQL in backend/database/scripts/add_users_company_id.sql, or run: php artisan migrate --force";
    }

    if (!response && error?.code === "ERR_NETWORK") {
      const base = getApiBaseUrl();
      friendlyMessage = `Cannot reach the API at ${base}. Check the server is online and CORS is configured, then restart npm run dev.`;
    }

    if (response?.status === 401 && isAuthRequest && serverMsg && !serverMsg.includes("SQLSTATE")) {
      friendlyMessage = serverMsg;
    }

    return Promise.reject({
      ...(response ?? {}),
      friendlyMessage,
      data: response?.data ?? error?.data,
      status: response?.status,
      message: friendlyMessage,
    });
  }
);

