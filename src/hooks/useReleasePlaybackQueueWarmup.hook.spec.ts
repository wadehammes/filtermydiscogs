import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { QueryClient } from "@tanstack/react-query";
import { useReleasePlaybackQueueWarmup } from "src/hooks/useReleasePlaybackQueueWarmup.hook";
import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { createQueueItem } from "src/utils/playbackQueue";
import { renderHook, waitFor } from "test-utils";

describe("useReleasePlaybackQueueWarmup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("prefetches release detail for the next two upcoming track rows while playback is active", async () => {
    const queryClient = new QueryClient();
    const prefetchQuery = jest.spyOn(queryClient, "prefetchQuery");
    const currentRelease = releaseFactory.withDisplayDefaults({
      instance_id: "instance-current",
      basic_information: basicInformationFactory.build({
        id: 249504,
        resource_url: "https://api.discogs.com/releases/249504",
      }),
    });
    const nextRelease = releaseFactory.withDisplayDefaults({
      instance_id: "instance-next",
      basic_information: basicInformationFactory.build({
        id: 249505,
        resource_url: "https://api.discogs.com/releases/249505",
      }),
    });
    const queue = [
      createQueueItem({
        release: nextRelease,
        trackPosition: "A1",
        trackTitle: "Next album",
      }),
      createQueueItem({
        release: currentRelease,
        trackPosition: "B1",
        trackTitle: "Same album later",
      }),
    ];

    renderHook(() =>
      useReleasePlaybackQueueWarmup({
        queryClient,
        isPlaying: true,
        queue,
      }),
    );

    await waitFor(() => {
      expect(prefetchQuery).toHaveBeenCalledTimes(2);
    });
  });

  it("does not prefetch when transport is not playing", () => {
    const queryClient = new QueryClient();
    const prefetchQuery = jest.spyOn(queryClient, "prefetchQuery");
    const release = releaseFactory.withDisplayDefaults();
    const queue = [
      createQueueItem({
        release,
        trackPosition: "A1",
        trackTitle: "Queued",
      }),
    ];

    renderHook(() =>
      useReleasePlaybackQueueWarmup({
        queryClient,
        isPlaying: false,
        queue,
      }),
    );

    expect(prefetchQuery).not.toHaveBeenCalled();
  });
});
