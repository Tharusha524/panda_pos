import type { QueryClient } from "@tanstack/react-query";
import { invalidatePosRuntimeSettings } from "./invalidatePosRuntimeSettings";

describe("invalidatePosRuntimeSettings", () => {
  test("invalidates runtime settings query keys", () => {
    const invalidateQueries = jest.fn();
    const queryClient = { invalidateQueries } as unknown as QueryClient;

    invalidatePosRuntimeSettings(queryClient);

    expect(invalidateQueries).toHaveBeenCalledTimes(10);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["sales-pos-context"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["tax-settings"] });
  });
});
