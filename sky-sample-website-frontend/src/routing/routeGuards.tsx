import React from "react";
import PermissionDenied from "../components/PermissionDenied";

export function guardedPage(
  allowed: boolean | undefined,
  Component: React.LazyExoticComponent<React.ComponentType<unknown>>
) {
  if (!allowed) {
    return <PermissionDenied />;
  }
  return <Component />;
}

export function guardedElement(allowed: boolean | undefined, element: React.ReactElement) {
  if (!allowed) {
    return <PermissionDenied />;
  }
  return element;
}
