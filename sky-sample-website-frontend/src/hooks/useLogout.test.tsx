import React from "react";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import useLogout from "./useLogout";

const signOut = jest.fn().mockResolvedValue(undefined);
jest.mock("../utils/authSession", () => ({
  signOut: (...args: unknown[]) => signOut(...args),
}));

const navigate = jest.fn();
jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => navigate,
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient();
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("useLogout", () => {
  test("signs out and navigates home", async () => {
    const { result } = renderHook(() => useLogout(), { wrapper });
    await result.current();
    expect(signOut).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith("/", { replace: true });
  });
});
