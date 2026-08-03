import React from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { isBackendConfigured } from "../config/backendConfig";
import { BACKEND_CONFIGURE_PATH } from "../config/appPaths";

/** Redirect to backend setup until API URL is saved (or baked into the build). */
const BackendConfigGate: React.FC = () => {
  const location = useLocation();
  const configured = isBackendConfigured();

  const path = location.pathname.replace(/\/+$/, "") || "/";
  const configurePath = BACKEND_CONFIGURE_PATH.replace(/\/+$/, "") || "/configure";
  const onConfigurePage = path === configurePath || path.endsWith("/configure");

  if (!configured && !onConfigurePage) {
    return <Navigate to={BACKEND_CONFIGURE_PATH} replace />;
  }

  return <Outlet />;
};

export default BackendConfigGate;
