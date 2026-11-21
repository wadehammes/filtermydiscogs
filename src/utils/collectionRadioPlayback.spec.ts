import { describe, expect, it } from "@jest/globals";
import { discogsTrackFactory } from "src/tests/factories/DiscogsTrack.factory";
import { discogsVideoFactory } from "src/tests/factories/DiscogsVideo.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import {
  planCollectionRadioStartFromDetail,
  shouldShowCollectionRadioPlayButton,
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
});
