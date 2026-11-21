import { describe, expect, it } from "@jest/globals";
import { discogsReleaseQueryOptions } from "src/hooks/queries/useDiscogsReleaseQuery";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { discogsTrackFactory } from "src/tests/factories/DiscogsTrack.factory";
import { discogsVideoFactory } from "src/tests/factories/DiscogsVideo.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { createTestQueryClient } from "src/tests/utils/testQueryClient";
import {
  areCollectionRadioReleaseDetailsCached,
  buildReleaseDetailsFromQueryCache,
  planCollectionRadioStartFromDetail,
  planShuffledCollectionRadioStart,
  resolveIsCollectionRadioSelectionStale,
  shouldShowCollectionRadioPlayButton,
  shuffleCollectionRadioQueueFromDetails,
} from "./collectionRadioPlayback";

describe("collectionRadioPlayback", () => {
  const release = releaseFactory.build({ instance_id: "501" });

  it("shows the play button when filters are active", () => {
    expect(
      shouldShowCollectionRadioPlayButton({
        hasActiveFilters: true,
        matchingViewActive: false,
      }),
    ).toBe(true);
  });

  it("shows the play button when a saved view is active", () => {
    expect(
      shouldShowCollectionRadioPlayButton({
        hasActiveFilters: false,
        matchingViewActive: true,
      }),
    ).toBe(true);
  });

  it("marks collection radio stale when the filtered release set changes during a session", () => {
    const priorKey = ["1", "2"].join("\0");
    expect(
      resolveIsCollectionRadioSelectionStale({
        isCollectionRadioSession: true,
        sessionReleaseIdsKey: priorKey,
        currentReleaseIdsKey: "1",
      }),
    ).toBe(true);
    expect(
      resolveIsCollectionRadioSelectionStale({
        isCollectionRadioSession: true,
        sessionReleaseIdsKey: priorKey,
        currentReleaseIdsKey: priorKey,
      }),
    ).toBe(false);
    expect(
      resolveIsCollectionRadioSelectionStale({
        isCollectionRadioSession: false,
        sessionReleaseIdsKey: "1",
        currentReleaseIdsKey: "2",
      }),
    ).toBe(false);
  });

  it("hides the play button with no filters and no saved view", () => {
    expect(
      shouldShowCollectionRadioPlayButton({
        hasActiveFilters: false,
        matchingViewActive: false,
      }),
    ).toBe(false);
  });

  it("plans playback from the first playable track in release detail", () => {
    const plan = planCollectionRadioStartFromDetail(release, {
      tracklist: [
        discogsTrackFactory.build({
          position: "A1",
          title: "First",
          type_: "track",
        }),
        discogsTrackFactory.build({
          position: "A2",
          title: "Second",
          type_: "track",
        }),
      ],
      videos: [
        discogsVideoFactory.youtube({
          uri: "https://www.youtube.com/watch?v=abc12345678",
          title: "First",
        }),
        discogsVideoFactory.youtube({
          uri: "https://www.youtube.com/watch?v=def98765432",
          title: "Second",
        }),
      ],
    });

    expect(plan).not.toBeNull();
    expect(plan?.startItem.trackPosition).toBe("A1");
    expect(plan?.upcomingItems.map((item) => item.trackPosition)).toEqual([
      "A2",
    ]);
  });

  it("shuffles playable tracks from multiple filtered releases", () => {
    const secondRelease = releaseFactory.build({ instance_id: "502" });
    const playableDetail = {
      tracklist: [
        discogsTrackFactory.build({
          position: "A1",
          title: "First",
          type_: "track",
        }),
      ],
      videos: [
        discogsVideoFactory.youtube({
          uri: "https://www.youtube.com/watch?v=abc12345678",
          title: "First",
        }),
      ],
    };

    const shuffled = shuffleCollectionRadioQueueFromDetails(
      [release, secondRelease],
      [
        { release, detail: playableDetail },
        { release: secondRelease, detail: playableDetail },
      ],
      (items) => [...items],
    );

    expect(shuffled).toHaveLength(2);
    expect(new Set(shuffled.map((item) => item.instanceId))).toEqual(
      new Set(["501", "502"]),
    );
    expect(shuffled.every((item) => item.fromCollectionRadio)).toBe(true);
    expect(
      shuffled.every((item) => item.youtubeVideoId === "abc12345678"),
    ).toBe(true);
  });

  it("returns null when release detail has no playable tracks", () => {
    const plan = planCollectionRadioStartFromDetail(release, {
      tracklist: [
        discogsTrackFactory.build({
          position: "A1",
          title: "First",
          type_: "track",
        }),
      ],
      videos: [],
    });

    expect(plan).toBeNull();
  });

  it("builds a shuffled pool with youtube ids and collection radio markers", () => {
    const detail = {
      tracklist: [
        discogsTrackFactory.build({
          position: "A",
          title: "Track",
          type_: "track",
        }),
      ],
      videos: [
        discogsVideoFactory.youtube({
          uri: "https://www.youtube.com/watch?v=te2jJncBVG4",
          title: "Track",
        }),
      ],
    };

    const shuffled = shuffleCollectionRadioQueueFromDetails(
      [release],
      [{ release, detail }],
      (items) => [...items],
    );
    const plan = planShuffledCollectionRadioStart(shuffled);

    expect(plan?.startItem.fromCollectionRadio).toBe(true);
    expect(Array.isArray(plan?.startItem.release.tracklist)).toBe(true);
    expect(
      (plan?.startItem.release.videos as { uri: string }[] | undefined)?.length,
    ).toBeGreaterThan(0);
  });

  it("reports when every filtered release detail is present in the query cache", () => {
    const queryClient = createTestQueryClient();
    const cachedRelease = releaseFactory.withDisplayDefaults({
      basic_information: { id: 249504, title: "Cached" },
    });

    expect(
      areCollectionRadioReleaseDetailsCached(queryClient, [cachedRelease]),
    ).toBe(false);

    queryClient.setQueryData(
      discogsReleaseQueryOptions("249504").queryKey,
      discogsReleaseJsonFactory.withTracklistAndVideos({ id: 249504 }),
    );

    expect(
      areCollectionRadioReleaseDetailsCached(queryClient, [cachedRelease]),
    ).toBe(true);
  });

  it("builds release detail rows from the query cache without network", () => {
    const queryClient = createTestQueryClient();
    const release = releaseFactory.withDisplayDefaults({
      basic_information: { id: 249504, title: "Cached" },
    });
    const detail = discogsReleaseJsonFactory.withTracklistAndVideos({
      id: 249504,
    });

    queryClient.setQueryData(
      discogsReleaseQueryOptions("249504").queryKey,
      detail,
    );

    expect(buildReleaseDetailsFromQueryCache(queryClient, [release])).toEqual([
      { release, detail },
    ]);
  });
});
