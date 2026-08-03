import React from "react";
import { render, screen } from "@testing-library/react";
import AppShellLayout from "./AppShellLayout";

jest.mock("./MainLayout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="main-layout">{children}</div>
  ),
}));

jest.mock("react-router", () => ({
  Outlet: () => <div data-testid="page-outlet" />,
}));

describe("AppShellLayout", () => {
  test("keeps layout mounted and renders outlet slot", () => {
    render(<AppShellLayout />);
    expect(screen.getByTestId("main-layout")).toBeInTheDocument();
    expect(screen.getByTestId("page-outlet")).toBeInTheDocument();
  });
});
