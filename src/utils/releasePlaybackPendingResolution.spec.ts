import { describe, expect, it } from "@jest/globals";
import { discogsTrackFactory } from "src/tests/factories/DiscogsTrack.factory";
import { discogsVideoFactory } from "src/tests/factories/DiscogsVideo.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { createQueueItem } from "src/utils/playbackQueue";
import {
  findPendingPreviewVideo,
  findQueueItemTrackResolutionIndex,
  isPlaybackReleaseDetailSynced,
  resolveIsQueueBuilding,
  resolvePlayQueueItemPendingTrackPlay,
  shouldApplyPendingAlbumQueueRebuild,
  shouldClearTransportForMissingVideo,
  shouldResetActiveTrackIndex,
} from "src/utils/releasePlaybackPendingResolution";

describe("releasePlaybackPendingResolution", () => {
  it("isPlaybackReleaseDetailSynced is true when release detail id matches the active release id", () => {
    expect(isPlaybackReleaseDetailSynced(42, 42)).toBe(true);
  });

  it("isPlaybackReleaseDetailSynced is false when release id or detail id is missing or mismatched", () => {
    expect(isPlaybackReleaseDetailSynced(null, 42)).toBe(false);
    expect(isPlaybackReleaseDetailSynced(42, undefined)).toBe(false);
    expect(isPlaybackReleaseDetailSynced(42, 99)).toBe(false);
  });

  it("findPendingPreviewVideo returns the matching preview video uri", () => {
    const video = discogsVideoFactory.build({
      uri: "https://youtube.com/watch?v=abc",
    });

    expect(
      findPendingPreviewVideo([video], "https://youtube.com/watch?v=abc"),
    ).toBe(video);
  });

  it("findPendingPreviewVideo returns undefined when the uri is missing from the release videos", () => {
    expect(
      findPendingPreviewVideo([], "https://youtube.com/watch?v=missing"),
    ).toBeUndefined();
  });

  it("shouldClearTransportForMissingVideo clears transport when tracks exist but no youtube match for album playback", () => {
    expect(
      shouldClearTransportForMissingVideo({
        tracksLength: 3,
        activeVideoId: null,
        embedVideoId: null,
        isReleasePreview: false,
        isReleaseDetailSynced: true,
      }),
    ).toBe(true);
  });

  it("shouldClearTransportForMissingVideo does not clear during release preview or when a video id is present", () => {
    expect(
      shouldClearTransportForMissingVideo({
        tracksLength: 3,
        activeVideoId: "abc",
        embedVideoId: null,
        isReleasePreview: false,
        isReleaseDetailSynced: true,
      }),
    ).toBe(false);
    expect(
      shouldClearTransportForMissingVideo({
        tracksLength: 3,
        activeVideoId: null,
        embedVideoId: null,
        isReleasePreview: true,
        isReleaseDetailSynced: true,
      }),
    ).toBe(false);
  });

  it("shouldClearTransportForMissingVideo does not clear transport while a user YouTube override is known for the active track", () => {
    expect(
      shouldClearTransportForMissingVideo({
        tracksLength: 3,
        activeVideoId: null,
        embedVideoId: null,
        isReleasePreview: false,
        isReleaseDetailSynced: true,
        activeTrackHasYoutubeOverride: true,
      }),
    ).toBe(false);
  });

  it("shouldClearTransportForMissingVideo waits for release detail sync and keeps transport when the embed already has a video", () => {
    expect(
      shouldClearTransportForMissingVideo({
        tracksLength: 3,
        activeVideoId: null,
        embedVideoId: null,
        isReleasePreview: false,
        isReleaseDetailSynced: false,
      }),
    ).toBe(false);
    expect(
      shouldClearTransportForMissingVideo({
        tracksLength: 3,
        activeVideoId: null,
        embedVideoId: "embed-id",
        isReleasePreview: false,
        isReleaseDetailSynced: true,
      }),
    ).toBe(false);
  });

  it("shouldResetActiveTrackIndex resets when the active index is out of range and no track is pending", () => {
    expect(
      shouldResetActiveTrackIndex({
        tracksLength: 2,
        activeTrackIndex: 2,
        pendingTrackPosition: null,
      }),
    ).toBe(true);
  });

  it("shouldResetActiveTrackIndex waits while a pending track position is resolving", () => {
    expect(
      shouldResetActiveTrackIndex({
        tracksLength: 2,
        activeTrackIndex: 2,
        pendingTrackPosition: "A1",
      }),
    ).toBe(false);
  });

  it("resolveIsQueueBuilding is false when pending track position is set but the release has no Discogs id", () => {
    expect(
      resolveIsQueueBuilding({
        isSimilarQueueLoading: false,
        pendingTrackPosition: "A1",
        releaseId: null,
        isReleaseDetailLoading: false,
        tracksLength: 0,
      }),
    ).toBe(false);
  });

  it("resolveIsQueueBuilding is true while release detail is loading for a pending album track", () => {
    expect(
      resolveIsQueueBuilding({
        isSimilarQueueLoading: false,
        pendingTrackPosition: "A1",
        releaseId: 42,
        isReleaseDetailLoading: true,
        tracksLength: 0,
      }),
    ).toBe(true);
  });

  it("resolveIsQueueBuilding is true when similar queue tail is loading", () => {
    expect(
      resolveIsQueueBuilding({
        isSimilarQueueLoading: true,
        pendingTrackPosition: null,
        releaseId: null,
        isReleaseDetailLoading: false,
        tracksLength: 0,
      }),
    ).toBe(true);
  });

  it("shouldApplyPendingAlbumQueueRebuild rebuilds when album tail is pending and the listener has not curated the queue", () => {
    expect(
      shouldApplyPendingAlbumQueueRebuild({
        shouldRebuildAlbumQueue: true,
        queueManuallyExtended: false,
      }),
    ).toBe(true);
  });

  it("shouldApplyPendingAlbumQueueRebuild does not rebuild after manual add or reorder while a late pending resolve runs", () => {
    expect(
      shouldApplyPendingAlbumQueueRebuild({
        shouldRebuildAlbumQueue: true,
        queueManuallyExtended: true,
      }),
    ).toBe(false);
  });

  it("findQueueItemTrackResolutionIndex prefers embedded tracklist for collection radio rows", () => {
    const release = releaseFactory.withDisplayDefaults();
    const item = createQueueItem({
      release: {
        ...release,
        tracklist: [
          discogsTrackFactory.build({
            position: "B1",
            title: "Second",
            type_: "track",
          }),
        ],
      },
      trackPosition: "B1",
      trackTitle: "Second",
    });
    item.fromCollectionRadio = true;

    const index = findQueueItemTrackResolutionIndex({
      item,
      isSameRelease: true,
      releaseDetailId: release.basic_information.id,
      sessionTracks: [
        discogsTrackFactory.build({
          position: "A1",
          title: "First",
          type_: "track",
        }),
      ],
    });

    expect(index).toBe(0);
  });

  it("resolvePlayQueueItemPendingTrackPlay clears pending for collection radio on same release when embedded tracklist resolves", () => {
    const release = releaseFactory.withDisplayDefaults();
    const item = createQueueItem({
      release: {
        ...release,
        tracklist: [
          discogsTrackFactory.build({
            position: "B1",
            title: "Second",
            type_: "track",
          }),
        ],
      },
      trackPosition: "B1",
      trackTitle: "Second",
    });
    item.fromCollectionRadio = true;

    const pending = resolvePlayQueueItemPendingTrackPlay({
      item,
      isSameRelease: true,
      releaseDetailId: release.basic_information.id,
      sessionTracks: [
        discogsTrackFactory.build({
          position: "A1",
          title: "First",
          type_: "track",
        }),
      ],
      resolvedYoutubeVideoId: "abc12345678",
    });

    expect(pending.pendingTrackPosition).toBeNull();
    expect(pending.canResolveTrackIndexFromLoadedDetail).toBe(true);
    expect(pending.resolutionIndex).toBe(0);
  });

  it("resolvePlayQueueItemPendingTrackPlay clears pending on same release when resolution uses enriched embedded tracklist", () => {
    const release = releaseFactory.withDisplayDefaults();
    const item = createQueueItem({
      release: {
        ...release,
        tracklist: [
          discogsTrackFactory.build({
            position: "A",
            title: "Playable",
            type_: "track",
          }),
        ],
      },
      trackPosition: "A",
      trackTitle: "Playable",
    });

    const pending = resolvePlayQueueItemPendingTrackPlay({
      item,
      isSameRelease: true,
      releaseDetailId: release.basic_information.id,
      sessionTracks: [
        discogsTrackFactory.build({
          position: "A1",
          title: "Other",
          type_: "track",
        }),
      ],
      resolvedYoutubeVideoId: "overrideVideo12",
    });

    expect(pending.pendingTrackPosition).toBeNull();
    expect(pending.canResolveTrackIndexFromLoadedDetail).toBe(true);
  });

  it("resolvePlayQueueItemPendingTrackPlay clears pending track when index resolves cross-release", () => {
    const release = releaseFactory.withDisplayDefaults();
    const item = createQueueItem({
      release: {
        ...release,
        tracklist: [
          discogsTrackFactory.build({
            position: "A1",
            title: "First",
            type_: "track",
          }),
        ],
      },
      trackPosition: "A1",
      trackTitle: "First",
    });

    const pending = resolvePlayQueueItemPendingTrackPlay({
      item,
      isSameRelease: false,
      releaseDetailId: undefined,
      sessionTracks: [],
      resolvedYoutubeVideoId: null,
    });

    expect(pending.pendingTrackPosition).toBeNull();
    expect(pending.canResolveTrackIndexFromLoadedDetail).toBe(true);
  });
});
