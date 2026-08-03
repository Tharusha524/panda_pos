import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useCurrentUser from "./useCurrentUser";

jest.mock("../api/userApi", () => ({
  getCurrentUser: jest.fn().mockResolvedValue({ id: 1, name: "Admin" }),
  getStoredToken: jest.fn().mockReturnValue("token"),
}));

import { getStoredToken } from "../api/userApi";

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useCurrentUser", () => {
  test("returns user when token exists", async () => {
    (getStoredToken as jest.Mock).mockReturnValue("token");
    const { result } = renderHook(() => useCurrentUser(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.user?.name).toBe("Admin");
  });

  test("resolves success without token", () => {
    (getStoredToken as jest.Mock).mockReturnValue(null);
    const { result } = renderHook(() => useCurrentUser(), { wrapper });
    expect(result.current.status).toBe("success");
    expect(result.current.user).toBeUndefined();
  });
});
