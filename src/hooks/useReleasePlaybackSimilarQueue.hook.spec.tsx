import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { api } from "src/api/urls";
import { DiscogsReleaseQueryKeys } from "src/hooks/queries/querykeys.constants";
import {
  createSimilarQueueMode,
  useReleasePlaybackSimilarQueue,
} from "src/hooks/useReleasePlaybackSimilarQueue.hook";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { discogsVideoFactory } from "src/tests/factories/DiscogsVideo.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { setupFetchDiscogsReleaseMock } from "src/tests/mocks/setupFetchDiscogsReleaseMock";
import { createTestQueryClient } from "src/tests/utils/testQueryClient";
import type { DiscogsTrack, DiscogsVideo } from "src/types";
import { createQueueItem } from "src/utils/playbackQueue";
import { renderHook, waitFor } from "test-utils";

jest.mock("src/api/urls");

const mockApi = jest.mocked(api);

const playableReleaseDetail =
  discogsReleaseJsonFactory.withTracklistAndVideos();

const catalogSourceRelease = releaseFactory.build({
  instance_id: "similar-queue-source",
  basic_information: {
    ...releaseFactory.withStyles(["Techno"]).basic_information,
    id: 880_001,
    genres: ["Electronic"],
    master_id: 100,
  },
});
const catalogSimilarRelease = releaseFactory.build({
  instance_id: "similar-queue-match",
  basic_information: {
    ...releaseFactory.withStyles(["Techno", "House"]).basic_information,
    id: 880_002,
    master_id: 200,
  },
});

const buildHarness = (
  overrides: {
    queue?: ReturnType<typeof createQueueItem>[];
    similarQueueMode?: ReturnType<typeof createSimilarQueueMode>;
    previewVideo?: DiscogsVideo | null;
    similarQueueSuppressedAfterClear?: boolean;
  } = {},
) => {
  const queryClient = createTestQueryClient();
  const sourceRelease = catalogSourceRelease;
  const similarRelease = catalogSimilarRelease;
  const queueItem = createQueueItem({
    release: sourceRelease,
    trackPosition: "A",
    trackTitle: "Never Gonna Give You Up",
  });

  queryClient.setQueryData(
    DiscogsReleaseQueryKeys.byId(String(sourceRelease.basic_information.id)),
    { ...playableReleaseDetail, id: sourceRelease.basic_information.id },
  );
  queryClient.setQueryData(
    DiscogsReleaseQueryKeys.byId(String(similarRelease.basic_information.id)),
    { ...playableReleaseDetail, id: similarRelease.basic_information.id },
  );

  const queueRef = { current: overrides.queue ?? [queueItem] };
  const previewVideoRef = {
    current: overrides.previewVideo ?? null,
  };
  const similarQueueModeRef = {
    current: overrides.similarQueueMode ?? createSimilarQueueMode(true),
  };
  const similarQueueGenerationRef = { current: 1 };
  const similarQueueFetchInFlightRef = { current: false };
  const similarQueueTailToastShownRef = { current: false };
  const queueManuallyExtendedRef = { current: false };
  const extendQueueWithSimilarReleasesRef = { current: true };
  const similarQueueSuppressedAfterClearRef = {
    current: overrides.similarQueueSuppressedAfterClear ?? false,
  };
  const releaseRef = { current: sourceRelease };
  const tracksRef = {
    current: playableReleaseDetail.tracklist as DiscogsTrack[],
  };
  const activeTrackIndexRef = { current: 0 };
  const updateUpcomingQueue = jest.fn(
    (
      updater: (previous: typeof queueRef.current) => typeof queueRef.current,
    ) => {
      queueRef.current = updater(queueRef.current);
    },
  );

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const { result } = renderHook(
    () =>
      useReleasePlaybackSimilarQueue({
        queryClient,
        allReleases: [sourceRelease, similarRelease],
        updateUpcomingQueue,
        refs: {
          queueRef,
          previewVideoRef,
          similarQueueModeRef,
          similarQueueGenerationRef,
          similarQueueFetchInFlightRef,
          similarQueueTailToastShownRef,
          releaseRef,
          tracksRef,
          activeTrackIndexRef,
          queueManuallyExtendedRef,
          extendQueueWithSimilarReleasesRef,
          similarQueueSuppressedAfterClearRef,
        },
      }),
    { wrapper },
  );

  return {
    queueRef,
    result,
    similarQueueGenerationRef,
    similarRelease,
    sourceRelease,
    updateUpcomingQueue,
  };
};

describe("useReleasePlaybackSimilarQueue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    if (!jest.isMockFunction(mockApi.discogsRelease)) {
      Object.assign(mockApi, {
        discogsRelease: jest.fn(),
      });
    }
    if (!jest.isMockFunction(mockApi.discogsReleaseBatch)) {
      Object.assign(mockApi, {
        discogsReleaseBatch: jest.fn(),
      });
    }
    setupFetchDiscogsReleaseMock(mockApi, playableReleaseDetail, {
      "880001": { ...playableReleaseDetail, id: 880_001 },
      "880002": { ...playableReleaseDetail, id: 880_002 },
    });
  });

  it("extends the queue tail when remaining items drop to the threshold", async () => {
    const { result, updateUpcomingQueue } = buildHarness({
      similarQueueMode: { enabled: true },
    });

    result.current.maybeExtendQueueTail();

    await waitFor(() => {
      expect(updateUpcomingQueue).toHaveBeenCalled();
    });

    const appendedCount =
      updateUpcomingQueue.mock.calls.at(-1)?.[0]([])?.length ?? 0;
    expect(appendedCount).toBeLessThanOrEqual(1);
  });

  it("extends from the playing track when upcoming is empty", async () => {
    const { result, updateUpcomingQueue } = buildHarness({
      queue: [],
      similarQueueMode: { enabled: true },
    });

    await expect(result.current.extendQueueTail()).resolves.toBe(true);

    expect(updateUpcomingQueue).toHaveBeenCalled();
    const nextQueue = updateUpcomingQueue.mock.calls.at(-1)?.[0]([]) ?? [];
    expect(nextQueue[0]?.fromSimilarRelease).toBe(true);
  });

  it("does not extend the tail after the user clears the queue", () => {
    const { result, updateUpcomingQueue } = buildHarness({
      queue: [],
      similarQueueMode: { enabled: true },
      similarQueueSuppressedAfterClear: true,
    });

    result.current.maybeExtendQueueTail();

    expect(updateUpcomingQueue).not.toHaveBeenCalled();
  });

  it("enables similar tail mode when the preference loads after album playback started", async () => {
    const { result, updateUpcomingQueue } = buildHarness({
      queue: [],
      similarQueueMode: { enabled: false },
    });

    result.current.maybeExtendQueueTail();

    await waitFor(() => {
      expect(updateUpcomingQueue).toHaveBeenCalled();
    });
  });

  it("does not stack another similar track while one is already in up next", () => {
    const similarItem = createQueueItem({
      release: catalogSimilarRelease,
      trackPosition: "B1",
      trackTitle: "Already queued similar",
    });
    similarItem.fromSimilarRelease = true;

    const { result, updateUpcomingQueue } = buildHarness({
      queue: [similarItem],
      similarQueueMode: { enabled: true },
    });

    result.current.maybeExtendQueueTail();

    expect(updateUpcomingQueue).not.toHaveBeenCalled();
  });

  it("appends fetched similar items when the generation still matches", async () => {
    const { result, sourceRelease, updateUpcomingQueue } = buildHarness();

    await expect(
      result.current.appendSimilarReleasesToQueue({
        sourceRelease,
        generation: 1,
        existingQueue: [],
      }),
    ).resolves.toBe(true);

    expect(updateUpcomingQueue).toHaveBeenCalled();
    const nextQueue = updateUpcomingQueue.mock.calls.at(-1)?.[0]([]) ?? [];
    expect(nextQueue[0]?.fromSimilarRelease).toBe(true);
  });

  it("ignores stale similar append results after the generation bumps", async () => {
    const {
      result,
      sourceRelease,
      similarQueueGenerationRef,
      updateUpcomingQueue,
    } = buildHarness();

    similarQueueGenerationRef.current = 2;

    await expect(
      result.current.appendSimilarReleasesToQueue({
        sourceRelease,
        generation: 1,
        existingQueue: [],
      }),
    ).resolves.toBe(false);

    expect(updateUpcomingQueue).not.toHaveBeenCalled();
  });

  it("does not extend the tail during release preview playback", async () => {
    const { result, updateUpcomingQueue } = buildHarness({
      previewVideo: discogsVideoFactory.build(),
    });

    await expect(result.current.extendQueueTail()).resolves.toBe(false);
    expect(updateUpcomingQueue).not.toHaveBeenCalled();
  });
});
