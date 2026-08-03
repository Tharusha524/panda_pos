import { hasSignedUrl } from "./orgUtils";

describe("orgUtils", () => {
  test("hasSignedUrl type guard", () => {
    expect(hasSignedUrl({ signedUrl: "https://x" })).toBe(true);
    expect(hasSignedUrl({ signedUrl: 1 })).toBe(false);
    expect(hasSignedUrl(null)).toBe(false);
    expect(hasSignedUrl("x")).toBe(false);
  });
});
