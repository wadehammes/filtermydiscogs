import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { QueryClient } from "@tanstack/react-query";
import { RELEASE_OPEN_PREFETCH_HOVER_MS } from "src/constants/releaseOpenPrefetch";
import { DiscogsReleaseQueryKeys } from "src/hooks/queries/querykeys.constants";
import {
  cancelInFlightDiscogsReleasePrefetches,
  clearScheduledReleaseOpenHoverPrefetch,
  getScheduledHoverReleaseId,
  scheduleReleaseOpenHoverPrefetch,
} from "src/utils/releaseOpenPrefetch";

describe("releaseOpenPrefetch", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    clearScheduledReleaseOpenHoverPrefetch();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("keeps only one scheduled hover prefetch at a time", () => {
    const first = jest.fn();
    const second = jest.fn();

    scheduleReleaseOpenHoverPrefetch("111", first);
    scheduleReleaseOpenHoverPrefetch("222", second);

    expect(getScheduledHoverReleaseId()).toBe("222");

    jest.advanceTimersByTime(RELEASE_OPEN_PREFETCH_HOVER_MS);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("clears only the matching scheduled hover prefetch", () => {
    scheduleReleaseOpenHoverPrefetch("111", jest.fn());

    clearScheduledReleaseOpenHoverPrefetch("222");
    expect(getScheduledHoverReleaseId()).toBe("111");

    clearScheduledReleaseOpenHoverPrefetch("111");
    expect(getScheduledHoverReleaseId()).toBeNull();
  });

  it("cancels in-flight discogs release prefetches except the active release", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const cancelSpy = jest.spyOn(queryClient, "cancelQueries");

    cancelInFlightDiscogsReleasePrefetches(queryClient, "222");

    expect(cancelSpy).toHaveBeenCalledWith({
      queryKey: DiscogsReleaseQueryKeys.all(),
      predicate: expect.any(Function),
    });

    const predicate = cancelSpy.mock.calls[0]?.[0]?.predicate as (query: {
      queryKey: readonly unknown[];
      state: { fetchStatus: string };
    }) => boolean;

    expect(
      predicate({
        queryKey: DiscogsReleaseQueryKeys.byId("111"),
        state: { fetchStatus: "fetching" },
      }),
    ).toBe(true);
    expect(
      predicate({
        queryKey: DiscogsReleaseQueryKeys.byId("222"),
        state: { fetchStatus: "fetching" },
      }),
    ).toBe(false);
    expect(
      predicate({
        queryKey: DiscogsReleaseQueryKeys.byId("111"),
        state: { fetchStatus: "idle" },
      }),
    ).toBe(false);
  });
});
