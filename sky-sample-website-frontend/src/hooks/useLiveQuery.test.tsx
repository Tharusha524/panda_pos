import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useLiveQuery } from "./useLiveQuery";

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useLiveQuery", () => {
  test("fetches data through react query", async () => {
    const queryFn = jest.fn().mockResolvedValue({ ok: true });

    const { result } = renderHook(
      () =>
        useLiveQuery({
          queryKey: ["test-live"],
          queryFn,
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryFn).toHaveBeenCalled();
    expect(result.current.data).toEqual({ ok: true });
  });
});
