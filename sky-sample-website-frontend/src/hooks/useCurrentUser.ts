import { useQuery } from "@tanstack/react-query";
import { User, getCurrentUser, getStoredToken } from "../api/userApi";

interface UseCurrentUserResult {
  user: User | undefined;
  status: "idle" | "loading" | "error" | "success" | "pending";
}

function useCurrentUser(): UseCurrentUserResult {
  const hasToken = !!getStoredToken();
  const { data, status } = useQuery<User | null>({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    enabled: hasToken,
  });

  const resolvedStatus = hasToken ? status : "success";

  return { user: data ?? undefined, status: resolvedStatus };
}

export default useCurrentUser;
