import { renderHook } from "@testing-library/react";
import useCurrentUserHaveAccess from "./useCurrentUserHaveAccess";
import { PermissionKeys } from "../views/Administration/SectionList";

jest.mock("./useCurrentUser");

import useCurrentUser from "./useCurrentUser";

describe("useCurrentUserHaveAccess", () => {
  test("returns permission flag from user", () => {
    (useCurrentUser as jest.Mock).mockReturnValue({
      user: { permissionObject: { [PermissionKeys.INSIGHT_VIEW]: true } },
    });
    const { result } = renderHook(() => useCurrentUserHaveAccess(PermissionKeys.INSIGHT_VIEW));
    expect(result.current).toBe(true);
  });

  test("returns false when missing", () => {
    (useCurrentUser as jest.Mock).mockReturnValue({ user: undefined });
    const { result } = renderHook(() => useCurrentUserHaveAccess(PermissionKeys.INSIGHT_VIEW));
    expect(result.current).toBe(false);
  });
});
