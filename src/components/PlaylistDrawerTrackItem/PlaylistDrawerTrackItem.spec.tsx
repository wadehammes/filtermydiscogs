import { beforeEach, describe, expect, it } from "@jest/globals";
import { PlaylistDrawerTrackItemPageObject } from "src/components/PlaylistDrawerTrackItem/PlaylistDrawerTrackItem.po";
import { playlistTrackRowFactory } from "src/tests/factories/PlaylistTrackRow.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { screen } from "test-utils";

let po: PlaylistDrawerTrackItemPageObject;

describe("PlaylistDrawerTrackItem", () => {
  beforeEach(() => {
    po = new PlaylistDrawerTrackItemPageObject();
  });

  it("renders PlaylistDrawerTrackItem", () => {
    po.renderPlaylistDrawerTrackItem();

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
  });

  it("shows a playing indicator when the track matches active playback", () => {
    const release = releaseFactory.withDisplayDefaults({ instance_id: 9001 });
    const track = playlistTrackRowFactory.opening();

    po.mockPlaybackState({
      release,
      activeTrackPosition: "A1",
      isMiniPlayerVisible: true,
      isPlaying: true,
      isPaused: false,
    });
    po.renderPlaylistDrawerTrackItem({ track, release });

    expect(screen.getByTestId("fmdPlayingIndicator")).toHaveAttribute(
      "data-playback-state",
      "playing",
    );
    expect(screen.getByTestId(po.testId)).toHaveAttribute(
      "data-playlist-track-active",
      "",
    );
  });

  it("does not show a playing indicator for a different track", () => {
    const release = releaseFactory.withDisplayDefaults({ instance_id: 9001 });

    po.mockPlaybackState({
      release,
      activeTrackPosition: "B1",
      isMiniPlayerVisible: true,
      isPlaying: true,
    });
    po.renderPlaylistDrawerTrackItem({ release });

    expect(screen.queryByTestId("fmdPlayingIndicator")).toBeNull();
  });
});
