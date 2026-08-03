import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSubscriptionAccess } from "./useSubscriptionAccess";

jest.mock("../api/Settings/subscriptionApi", () => ({
  getSubscriptionStatus: jest.fn().mockResolvedValue({
    can_access: false,
    is_overdue: true,
  }),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useSubscriptionAccess", () => {
  test("maps subscription flags", async () => {
    const { result } = renderHook(() => useSubscriptionAccess(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.canAccess).toBe(false);
    expect(result.current.isOverdue).toBe(true);
  });
});
