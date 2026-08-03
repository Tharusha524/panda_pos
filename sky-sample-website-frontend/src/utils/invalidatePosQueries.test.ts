import type { QueryClient } from "@tanstack/react-query";
import { invalidatePosQueries } from "./invalidatePosQueries";
import { POS_LIVE_QUERY_KEYS } from "../constants/liveQuery";

describe("invalidatePosQueries", () => {
  test("invalidates all POS live query keys", () => {
    const invalidateQueries = jest.fn();
    const queryClient = { invalidateQueries } as unknown as QueryClient;

    invalidatePosQueries(queryClient);

    expect(invalidateQueries).toHaveBeenCalledTimes(POS_LIVE_QUERY_KEYS.length);
    for (const key of POS_LIVE_QUERY_KEYS) {
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: [key] });
    }
  });
});
