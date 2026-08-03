import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchBranches } from "../api/Settings/branchApi";
import { getInventorySettings } from "../api/Settings/inventorySettingsApi";
import { getActiveLocation, MAIN_LOCATION, setActiveLocation } from "../utils/posActiveLocation";

export function useBranchLocations(
  extraLocations: string[] = [],
  options?: { branchesOnly?: boolean }
) {
  const branchesOnly = options?.branchesOnly ?? false;
  const { data: branches = [], isLoading: loadingBranches } = useQuery({
    queryKey: ["branches"],
    queryFn: fetchBranches,
  });

  const { data: inventorySettings, isLoading: loadingSettings } = useQuery({
    queryKey: ["inventory-settings"],
    queryFn: getInventorySettings,
  });

  const manageMultiple = inventorySettings?.manage_multiple_locations ?? true;

  const locations = useMemo(() => {
    if (!manageMultiple) {
      return [MAIN_LOCATION];
    }

    const branchNames = branches
      .filter((b) => b.is_active)
      .map((b) => b.name.trim())
      .filter(Boolean);

    const extras = branchesOnly
      ? []
      : extraLocations.map((l) => l.trim()).filter(Boolean);

    const merged = [MAIN_LOCATION, ...branchNames, ...extras];

    return Array.from(new Set(merged));
  }, [branches, branchesOnly, extraLocations, manageMultiple]);

  const defaultLocation = useMemo(() => {
    const active = getActiveLocation();
    if (locations.includes(active)) {
      return active;
    }
    return locations[0] ?? MAIN_LOCATION;
  }, [locations]);

  return {
    locations,
    manageMultiple,
    defaultLocation,
    setActiveLocation,
    isLoading: loadingBranches || loadingSettings,
  };
}
