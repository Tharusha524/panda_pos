import type { QueryClient } from "@tanstack/react-query";
import { POS_LIVE_QUERY_KEYS } from "../constants/liveQuery";

/** Immediately refresh dashboard and transaction lists after create/update/delete. */
export function invalidatePosQueries(queryClient: QueryClient): void {
  for (const key of POS_LIVE_QUERY_KEYS) {
    queryClient.invalidateQueries({ queryKey: [key] });
  }
}
