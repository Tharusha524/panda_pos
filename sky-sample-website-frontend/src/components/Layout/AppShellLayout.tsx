import React, { Suspense, useEffect } from "react";
import { Outlet } from "react-router";
import { Box, CircularProgress } from "@mui/material";
import MainLayout from "./MainLayout";
import { prefetchAllPosRoutes } from "../../routing/posRouteChunks";

/** Keeps sidebar + header mounted while only the page content swaps. */
export default function AppShellLayout() {
  useEffect(() => {
    const warmPosRoutes = () => prefetchAllPosRoutes();
    const scheduleIdle = globalThis.requestIdleCallback;
    if (scheduleIdle) {
      const id = scheduleIdle(warmPosRoutes, { timeout: 3000 });
      return () => globalThis.cancelIdleCallback?.(id);
    }
    const timer = globalThis.setTimeout(warmPosRoutes, 400);
    return () => globalThis.clearTimeout(timer);
  }, []);

  return (
    <MainLayout>
      <Suspense
        fallback={
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 240, py: 6 }}>
            <CircularProgress size={36} sx={{ color: "var(--pallet-blue)" }} />
          </Box>
        }
      >
        <Outlet />
      </Suspense>
    </MainLayout>
  );
}
