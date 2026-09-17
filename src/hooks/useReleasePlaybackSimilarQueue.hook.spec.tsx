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
import type { DiscogsVideo } from "src/types";
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

  it("createSimilarQueueMode enables similar queue tail extension when album queue rebuild is on", () => {
    expect(createSimilarQueueMode(true)).toEqual({
      enabled: true,
      initialAppendPending: true,
    });
  });

  it("createSimilarQueueMode disables similar queue extension for preview-only sessions", () => {
    expect(createSimilarQueueMode(false)).toEqual({
      enabled: false,
      initialAppendPending: false,
    });
  });

  it("skips tail extension while the initial similar append is still pending", () => {
    const { result, updateUpcomingQueue } = buildHarness({
      similarQueueMode: { enabled: true, initialAppendPending: true },
      queue: [],
    });

    result.current.maybeExtendQueueTail();

    expect(updateUpcomingQueue).not.toHaveBeenCalled();
  });

  it("extends the queue tail when remaining items drop to the threshold", async () => {
    const { result, updateUpcomingQueue } = buildHarness({
      similarQueueMode: { enabled: true, initialAppendPending: false },
    });

    result.current.maybeExtendQueueTail();

    await waitFor(() => {
      expect(updateUpcomingQueue).toHaveBeenCalled();
    });
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
