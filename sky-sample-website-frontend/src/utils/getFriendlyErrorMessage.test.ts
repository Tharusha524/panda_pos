import { getFriendlyErrorMessage } from "./getFriendlyErrorMessage";

describe("getFriendlyErrorMessage", () => {
  test("returns fallback for null error", () => {
    expect(getFriendlyErrorMessage(null)).toBe("Something went wrong. Please try again.");
  });

  test("returns friendlyMessage when set", () => {
    expect(getFriendlyErrorMessage({ friendlyMessage: "Custom error" })).toBe("Custom error");
  });

  test("maps HTTP status codes", () => {
    expect(getFriendlyErrorMessage({ status: 401 })).toContain("session");
    expect(getFriendlyErrorMessage({ status: 403 })).toContain("permission");
    expect(getFriendlyErrorMessage({ status: 404 })).toContain("not found");
    expect(getFriendlyErrorMessage({ status: 422 })).toContain("form");
    expect(getFriendlyErrorMessage({ status: 500 })).toContain("Server error");
  });

  test("sanitizes network, timeout, and cors errors", () => {
    expect(getFriendlyErrorMessage({ message: "Network Error" })).toContain("connect");
    expect(getFriendlyErrorMessage({ message: "Request timed out" })).toContain("timed out");
    expect(getFriendlyErrorMessage({ message: "CORS blocked" })).toContain("reach the server");
  });

  test("strips localhost from messages", () => {
    const result = getFriendlyErrorMessage({
      message: "Failed at http://localhost:8000/api/sales",
    });
    expect(result).not.toContain("localhost");
  });

  test("uses API validation and data message shapes", () => {
    expect(
      getFriendlyErrorMessage({ data: { errors: { email: ["Email is required"] } } })
    ).toBe("Email is required");
    expect(getFriendlyErrorMessage({ data: { message: "Bad data" } })).toBe("Bad data");
    expect(getFriendlyErrorMessage({ message: "Plain" })).toBe("Plain");
  });

  test("returns fallback for empty sanitized message", () => {
    expect(getFriendlyErrorMessage({ message: "http://127.0.0.1:8000" })).toBe(
      "Something went wrong. Please try again."
    );
  });

  test("handles string errors and non-objects", () => {
    expect(getFriendlyErrorMessage("Network error")).toContain("connect");
    expect(getFriendlyErrorMessage(42)).toBe("Something went wrong. Please try again.");
  });
});
