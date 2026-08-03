import { render, screen } from "@testing-library/react";
import PageTitle from "./PageTitle";

describe("PageTitle", () => {
  test("renders the title text", () => {
    render(<PageTitle title="Dashboard" />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  test("renders optional subtitle when provided", () => {
    render(<PageTitle title="Sales" subtitle="Today's overview" />);

    expect(screen.getByText("Sales")).toBeInTheDocument();
    expect(screen.getByText("Today's overview")).toBeInTheDocument();
  });
});
