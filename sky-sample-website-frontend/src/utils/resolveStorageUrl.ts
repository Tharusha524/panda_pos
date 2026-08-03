import { getApiBaseUrl } from "../config/apiBase";

/**
 * Turn API storage paths into a browser-loadable URL using the configured API base.
 * Works for local (`http://127.0.0.1:8000/storage/...`) and production subfolder deploys.
 */
export function resolveStorageUrl(url?: string | null): string | null {
  if (!url?.trim()) return null;

  const trimmed = url.trim();
  const apiBase = getApiBaseUrl();

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.pathname.includes("/storage/")) {
        const storagePath = parsed.pathname.slice(parsed.pathname.indexOf("/storage/"));
        return `${apiBase}${storagePath}`;
      }
    } catch {
      return trimmed;
    }
    return trimmed;
  }

  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (path.startsWith("/storage/")) {
    return `${apiBase}${path}`;
  }

  return `${apiBase}/storage/${path.replace(/^\/+/, "")}`;
}

export function resolveItemImageUrl(item: {
  image_url?: string | null;
  image_path?: string | null;
}): string | null {
  return resolveStorageUrl(item.image_url) ?? resolveStorageUrl(item.image_path);
}
