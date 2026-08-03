import { getActiveLocation, MAIN_LOCATION, setActiveLocation } from "./posActiveLocation";

describe("posActiveLocation", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("defaults to Main Location", () => {
    expect(getActiveLocation()).toBe(MAIN_LOCATION);
  });

  test("persists selected location", () => {
    setActiveLocation("Branch A");
    expect(getActiveLocation()).toBe("Branch A");
  });

  test("falls back when empty string saved", () => {
    localStorage.setItem("posActiveLocation", "   ");
    expect(getActiveLocation()).toBe(MAIN_LOCATION);
  });

  test("setActiveLocation trims and falls back", () => {
    setActiveLocation("  ");
    expect(getActiveLocation()).toBe(MAIN_LOCATION);
  });

  test("getActiveLocation handles storage errors", () => {
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(getActiveLocation()).toBe(MAIN_LOCATION);
    jest.restoreAllMocks();
  });
});
