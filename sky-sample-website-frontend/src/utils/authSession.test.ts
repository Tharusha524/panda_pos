import { QueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  clearAuthQueryCache,
  clearAuthStorage,
  clearLocalAuth,
  getStoredUserRaw,
  initAuthSession,
  isAuthenticated,
  purgeLegacyLocalAuth,
  setStoredToken,
  setStoredUserRaw,
  signOut,
} from "./authSession";

jest.mock("axios");

describe("authSession", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    jest.clearAllMocks();
  });

  test("stores and reads token from localStorage", () => {
    setStoredToken("abc123");
    expect(isAuthenticated()).toBe(true);
  });

  test("stores user json", () => {
    setStoredUserRaw('{"id":1}');
    expect(getStoredUserRaw()).toBe('{"id":1}');
  });

  test("clears auth and tenant storage", () => {
    setStoredToken("x");
    localStorage.setItem("pos_tenant_id", "1");
    clearLocalAuth();
    expect(isAuthenticated()).toBe(false);
    expect(localStorage.getItem("pos_tenant_id")).toBeNull();
  });

  test("initAuthSession purges legacy storage", () => {
    sessionStorage.setItem("token", "legacy");
    initAuthSession();
    expect(sessionStorage.getItem("token")).toBeNull();
  });

  test("purgeLegacyLocalAuth is safe when empty", () => {
    expect(() => purgeLegacyLocalAuth()).not.toThrow();
  });

  test("clearAuthQueryCache resets user queries", () => {
    const client = new QueryClient();
    client.setQueryData(["current-user"], { id: 1 });
    clearAuthQueryCache(client);
    expect(client.getQueryData(["current-user"])).toBeUndefined();
  });

  test("signOut clears session even if API fails", async () => {
    (axios.post as jest.Mock).mockRejectedValue(new Error("offline"));
    const client = new QueryClient();
    setStoredToken("token");
    await signOut(client);
    expect(isAuthenticated()).toBe(false);
  });

  test("signOut calls logout API on success", async () => {
    (axios.post as jest.Mock).mockResolvedValue({});
    const client = new QueryClient();
    setStoredToken("token");
    await signOut(client);
    expect(axios.post).toHaveBeenCalledWith("/api/auth/logout");
    clearAuthStorage();
  });
});
