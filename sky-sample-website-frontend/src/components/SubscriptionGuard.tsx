import React from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import PageLoader from "./PageLoader";
import { useSubscriptionAccess } from "../hooks/useSubscriptionAccess";

const SUBSCRIPTION_ALLOWED_PREFIXES = [
  "/settings/subscription",
];

function isSubscriptionAllowedPath(pathname: string): boolean {
  return SUBSCRIPTION_ALLOWED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
}

const SubscriptionGuard: React.FC = () => {
  const location = useLocation();
  const { canAccess, isLoading, isError, status } = useSubscriptionAccess();

  if (isLoading || status === "pending") {
    return <PageLoader />;
  }

  if (!isError && !canAccess && !isSubscriptionAllowedPath(location.pathname)) {
    return (
      <Navigate
        to="/settings/subscription/manage"
        replace
        state={{ paymentRequired: true }}
      />
    );
  }

  return <Outlet />;
};

export default SubscriptionGuard;
