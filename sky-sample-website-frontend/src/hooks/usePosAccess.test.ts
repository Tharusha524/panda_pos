import { renderHook } from "@testing-library/react";
import usePosAccess from "./usePosAccess";
import useCurrentUser from "./useCurrentUser";

jest.mock("./useCurrentUser");

const mockedUseCurrentUser = useCurrentUser as jest.MockedFunction<typeof useCurrentUser>;

describe("usePosAccess", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("grants all POS access for admin users", () => {
    mockedUseCurrentUser.mockReturnValue({
      user: { is_admin: true } as ReturnType<typeof useCurrentUser>["user"],
      status: "success",
    });

    const { result } = renderHook(() => usePosAccess());

    expect(result.current.isAdmin).toBe(true);
    expect(result.current.can("pos.sales")).toBe(true);
    expect(result.current.can("pos.settings")).toBe(true);
  });

  test("checks pos_access map for non-admin users", () => {
    mockedUseCurrentUser.mockReturnValue({
      user: {
        is_admin: false,
        pos_access: { "pos.sales": true, "pos.items": false },
      } as ReturnType<typeof useCurrentUser>["user"],
      status: "success",
    });

    const { result } = renderHook(() => usePosAccess());

    expect(result.current.can("pos.sales")).toBe(true);
    expect(result.current.can("pos.items")).toBe(false);
    expect(result.current.can("pos.reports")).toBe(false);
  });
});
