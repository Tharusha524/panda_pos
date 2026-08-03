import type { QueryClient } from "@tanstack/react-query";
import axios from "axios";

const TOKEN_KEY = "token";
const USER_KEY = "user";

function authStorage(): Storage {
  return localStorage;
}

/** Remove legacy sessionStorage copies from an earlier implementation. */
export function purgeLegacyLocalAuth(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

/** No-op kept for app bootstrap — auth uses localStorage only. */
export function initAuthSession(): void {
  purgeLegacyLocalAuth();
}

export function getStoredToken(): string | null {
  return authStorage().getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  purgeLegacyLocalAuth();
  authStorage().setItem(TOKEN_KEY, token);
}

export function getStoredUserRaw(): string | null {
  return authStorage().getItem(USER_KEY);
}

export function setStoredUserRaw(userJson: string): void {
  purgeLegacyLocalAuth();
  authStorage().setItem(USER_KEY, userJson);
}

export function clearAuthStorage(): void {
  authStorage().removeItem(TOKEN_KEY);
  authStorage().removeItem(USER_KEY);
  purgeLegacyLocalAuth();
}

export function isAuthenticated(): boolean {
  return !!getStoredToken();
}

export function clearLocalAuth(): void {
  clearAuthStorage();
  localStorage.removeItem("pos_tenant_id");
  localStorage.removeItem("pos_tenant_slug");
  localStorage.removeItem("company");
}

export function clearAuthQueryCache(queryClient: QueryClient): void {
  queryClient.setQueryData(["current-user"], null);
  queryClient.removeQueries({ queryKey: ["current-user"] });
  queryClient.removeQueries({ queryKey: ["subscription-status"] });
  queryClient.removeQueries({ queryKey: ["subscription-details"] });
}

export async function signOut(queryClient: QueryClient): Promise<void> {
  try {
    await axios.post("/api/auth/logout");
  } catch {
    // still clear local session if server logout fails
  }
  clearLocalAuth();
  clearAuthQueryCache(queryClient);
}
