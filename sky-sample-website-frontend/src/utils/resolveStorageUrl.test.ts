import { resolveItemImageUrl, resolveStorageUrl } from "./resolveStorageUrl";

jest.mock("../config/apiBase", () => ({
  getApiBaseUrl: () => "http://api.test",
}));

describe("resolveStorageUrl", () => {
  test("returns null for empty input", () => {
    expect(resolveStorageUrl(null)).toBeNull();
  });

  test("prefixes relative storage paths", () => {
    expect(resolveStorageUrl("/storage/items/a.jpg")).toBe(
      "http://api.test/storage/items/a.jpg"
    );
  });

  test("prefixes bare filenames", () => {
    expect(resolveStorageUrl("items/a.jpg")).toBe("http://api.test/storage/items/a.jpg");
  });

  test("rewrites external storage URLs", () => {
    expect(resolveStorageUrl("https://old.example.com/storage/items/x.png")).toBe(
      "http://api.test/storage/items/x.png"
    );
  });

  test("returns plain external URL when not storage path", () => {
    expect(resolveStorageUrl("https://cdn.example.com/logo.png")).toBe(
      "https://cdn.example.com/logo.png"
    );
  });

  test("returns trimmed URL when parsing fails", () => {
    expect(resolveStorageUrl("https://")).toBe("https://");
  });

  test("resolveItemImageUrl prefers image_url then image_path", () => {
    expect(resolveItemImageUrl({ image_url: "/storage/a.jpg", image_path: "/storage/b.jpg" })).toBe(
      "http://api.test/storage/a.jpg"
    );
    expect(resolveItemImageUrl({ image_path: "/storage/b.jpg" })).toBe(
      "http://api.test/storage/b.jpg"
    );
  });
});
