import React, { Suspense } from "react";
import { render, screen } from "@testing-library/react";
import { guardedElement, guardedPage } from "./routeGuards";

jest.mock("../components/PermissionDenied", () => ({
  __esModule: true,
  default: () => <div>Permission Denied</div>,
}));

const AllowedPage = React.lazy(async () => ({
  default: () => <div>Allowed Page</div>,
}));

describe("routeGuards", () => {
  test("guardedPage shows permission denied when not allowed", () => {
    render(guardedPage(undefined, AllowedPage));
    expect(screen.getByText("Permission Denied")).toBeInTheDocument();
  });

  test("guardedElement renders children when allowed", () => {
    render(guardedElement(true, <div>Secret Page</div>));
    expect(screen.getByText("Secret Page")).toBeInTheDocument();
  });

  test("guardedElement blocks when not allowed", () => {
    render(guardedElement(false, <div>Secret Page</div>));
    expect(screen.queryByText("Secret Page")).not.toBeInTheDocument();
    expect(screen.getByText("Permission Denied")).toBeInTheDocument();
  });

  test("guardedPage renders lazy component when allowed", async () => {
    render(<Suspense fallback={null}>{guardedPage(true, AllowedPage)}</Suspense>);
    expect(await screen.findByText("Allowed Page")).toBeInTheDocument();
  });
});
