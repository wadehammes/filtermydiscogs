import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { QueryClient } from "@tanstack/react-query";
import type { UserTrackStatsResponse } from "src/api/endpoints/tracks";
import { api } from "src/api/urls";
import { TrackStatsQueryKeys } from "src/hooks/queries/querykeys.constants";
import { usePlaybackTrackYoutubeOverrides } from "src/hooks/usePlaybackTrackYoutubeOverrides.hook";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { createQueueItem } from "src/utils/playbackQueue";
import { renderFeatureHook, waitFor } from "test-utils";

jest.mock("src/api/urls");

const mockApi = jest.mocked(api);
const USER_ID = 42;

describe("usePlaybackTrackYoutubeOverrides", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    if (!jest.isMockFunction(mockApi.fetchTrackStats)) {
      Object.assign(mockApi, { fetchTrackStats: jest.fn() });
    }
  });

  it("when track stats for queue keys are already in the query cache, does not call fetchTrackStats", async () => {
    const release = releaseFactory.build();
    const queueItem = createQueueItem({
      release,
      trackPosition: "A1",
      trackTitle: "Track A1",
    });
    const trackKey = `${release.instance_id}:A1`;
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    queryClient.setQueryData<UserTrackStatsResponse>(
      TrackStatsQueryKeys.byUserAndKeys(USER_ID, trackKey),
      {
        stats: {
          [trackKey]: {
            play_count: 0,
            listen_count: 0,
            youtube_id: "dQw4w9WgXcQ",
          },
        },
      },
    );

    const { result } = renderFeatureHook(
      () =>
        usePlaybackTrackYoutubeOverrides({
          userId: USER_ID,
          queue: [queueItem],
        }),
      { queryClient },
    );

    await waitFor(() => {
      expect(result.current.get(trackKey)).toBe("dQw4w9WgXcQ");
    });

    expect(mockApi.fetchTrackStats).not.toHaveBeenCalled();
  });

  it("fetches stats for additional track keys when the active track is not in the queue", async () => {
    const release = releaseFactory.build();
    const activeTrackKey = `${release.instance_id}:A1`;

    mockApi.fetchTrackStats.mockResolvedValue({
      stats: {
        [activeTrackKey]: {
          play_count: 0,
          listen_count: 0,
          youtube_id: "abc12345678",
        },
      },
    });

    const { result } = renderFeatureHook(
      () =>
        usePlaybackTrackYoutubeOverrides({
          userId: USER_ID,
          queue: [],
          additionalTrackKeys: [activeTrackKey],
        }),
      {},
    );

    await waitFor(() => {
      expect(result.current.get(activeTrackKey)).toBe("abc12345678");
    });

    expect(mockApi.fetchTrackStats).toHaveBeenCalledWith([activeTrackKey]);
  });

  it("when queue keys are missing from the cache, fetches stats and maps youtube overrides", async () => {
    const release = releaseFactory.build();
    const queueItem = createQueueItem({
      release,
      trackPosition: "B2",
      trackTitle: "Track B2",
    });
    const trackKey = `${release.instance_id}:B2`;

    mockApi.fetchTrackStats.mockResolvedValue({
      stats: {
        [trackKey]: {
          play_count: 1,
          listen_count: 0,
          youtube_id: "abc12345678",
        },
      },
    });

    const { result } = renderFeatureHook(() =>
      usePlaybackTrackYoutubeOverrides({
        userId: USER_ID,
        queue: [queueItem],
      }),
    );

    await waitFor(() => {
      expect(result.current.get(trackKey)).toBe("abc12345678");
    });

    expect(mockApi.fetchTrackStats).toHaveBeenCalledWith([trackKey]);
  });

  it("when the queue grows before stats fetch completes, keeps the active track override (see trackStatsQueryCache.spec.ts)", async () => {
    const release = releaseFactory.build();
    const otherRelease = releaseFactory.build();
    const activeTrackKey = `${release.instance_id}:A1`;
    const queuedTrackKey = `${otherRelease.instance_id}:B1`;
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    queryClient.setQueryData<UserTrackStatsResponse>(
      TrackStatsQueryKeys.byUserAndKeys(USER_ID, activeTrackKey),
      {
        stats: {
          [activeTrackKey]: {
            play_count: 0,
            listen_count: 0,
            youtube_id: "overrid1234",
          },
        },
      },
    );

    let resolveFetch!: (value: UserTrackStatsResponse) => void;
    const fetchPromise = new Promise<UserTrackStatsResponse>((resolve) => {
      resolveFetch = resolve;
    });
    mockApi.fetchTrackStats.mockImplementation(() => fetchPromise);

    const { result, rerender } = renderFeatureHook(
      ({ queue }: { queue: ReturnType<typeof createQueueItem>[] }) =>
        usePlaybackTrackYoutubeOverrides({
          userId: USER_ID,
          queue,
          additionalTrackKeys: [activeTrackKey],
        }),
      {
        queryClient,
        initialProps: { queue: [] as ReturnType<typeof createQueueItem>[] },
      },
    );

    await waitFor(() => {
      expect(result.current.get(activeTrackKey)).toBe("overrid1234");
    });

    rerender({
      queue: [
        createQueueItem({
          release: otherRelease,
          trackPosition: "B1",
          trackTitle: "Queued",
        }),
      ],
    });

    await waitFor(() => {
      expect(mockApi.fetchTrackStats).toHaveBeenCalled();
    });

    expect(result.current.get(activeTrackKey)).toBe("overrid1234");

    resolveFetch({
      stats: {
        [activeTrackKey]: {
          play_count: 0,
          listen_count: 0,
          youtube_id: "overrid1234",
        },
        [queuedTrackKey]: {
          play_count: 0,
          listen_count: 0,
          youtube_id: null,
        },
      },
    });

    await waitFor(() => {
      expect(result.current.get(queuedTrackKey)).toBeUndefined();
    });
  });
});
