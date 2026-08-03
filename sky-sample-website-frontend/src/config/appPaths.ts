/**
 * URL paths when the app is deployed under a subfolder (e.g. https://domain.com/panda_jp/),
 * controlled by VITE_APP_BASE_PATH / VITE_BASE_PATH.
 *
 * React Router's <BrowserRouter basename={...}> already adds APP_BASE in front of every
 * in-app navigation (navigate(), <Link to>, <Navigate to>), so those call sites use the
 * *relative* paths below. Code that runs outside the Router (window.location.*, e.g. in
 * axios interceptors) has to build the *absolute* browser path itself, using APP_BASE.
 */
const stripSlash = (s: string) => s.replace(/\/+$/, "");

/** e.g. "/panda_jp" when VITE_APP_BASE_PATH=/panda_jp */
export const APP_BASE = stripSlash(import.meta.env.VITE_APP_BASE_PATH || "");

/** Router-relative (for navigate() / <Link to> / <Navigate to>) — basename adds the prefix. */
export const LOGIN_PATH = "/";
export const BACKEND_CONFIGURE_PATH = "/configure";
export const SUBSCRIPTION_MANAGE = "/settings/subscription/manage";

/** Absolute browser paths (for window.location.* — outside the Router, no basename applied). */
export const LOGIN_PATH_ABSOLUTE = APP_BASE ? `${APP_BASE}/` : "/";
export const SUBSCRIPTION_MANAGE_ABSOLUTE = APP_BASE
  ? `${APP_BASE}/settings/subscription/manage`
  : "/settings/subscription/manage";
