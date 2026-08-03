import { useQuery } from "@tanstack/react-query";
import {
  getSubscriptionStatus,
  type SubscriptionStatus,
} from "../api/Settings/subscriptionApi";

export function useSubscriptionAccess() {
  const query = useQuery<SubscriptionStatus>({
    queryKey: ["subscription-status"],
    queryFn: getSubscriptionStatus,
    staleTime: 60_000,
  });

  return {
    ...query,
    canAccess: query.data?.can_access ?? true,
    isOverdue: query.data?.is_overdue ?? false,
  };
}
