import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useBranchLocations } from "./useBranchLocations";

jest.mock("../api/Settings/branchApi", () => ({
  fetchBranches: jest.fn().mockResolvedValue([
    { id: 1, name: "Branch A", is_active: true },
    { id: 2, name: "Closed", is_active: false },
  ]),
}));

jest.mock("../api/Settings/inventorySettingsApi", () => ({
  getInventorySettings: jest.fn().mockResolvedValue({ manage_multiple_locations: true }),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useBranchLocations", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("merges main location and active branches", async () => {
    const { result } = renderHook(() => useBranchLocations(["Extra"]), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.locations).toEqual(
      expect.arrayContaining(["Main Location", "Branch A", "Extra"])
    );
    expect(result.current.manageMultiple).toBe(true);
  });

  test("single location when multi-location disabled", async () => {
    const { getInventorySettings } = await import("../api/Settings/inventorySettingsApi");
    (getInventorySettings as jest.Mock).mockResolvedValueOnce({ manage_multiple_locations: false });

    const { result } = renderHook(() => useBranchLocations(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.locations).toEqual(["Main Location"]);
  });

  test("defaultLocation falls back when active location missing", async () => {
    localStorage.setItem("posActiveLocation", "Removed Branch");
    const { result } = renderHook(() => useBranchLocations(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.defaultLocation).toBe("Main Location");
  });
});
