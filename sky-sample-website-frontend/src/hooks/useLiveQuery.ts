import {
  useQuery,
  type QueryKey,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";
import { LIVE_REFETCH_MS } from "../constants/liveQuery";

/**
 * React Query hook that polls in the background so lists/dashboards
 * update without a manual browser refresh.
 */
export function useLiveQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>
): UseQueryResult<TData, TError> {
  return useQuery({
    staleTime: LIVE_REFETCH_MS,
    refetchOnWindowFocus: true,
    refetchInterval: LIVE_REFETCH_MS,
    refetchIntervalInBackground: false,
    ...options,
  });
}
