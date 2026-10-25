import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { PublicPlaylistTrackItemPageObject } from "src/components/PublicPlaylistTrackItem/PublicPlaylistTrackItem.po";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { screen } from "test-utils";

let po: PublicPlaylistTrackItemPageObject;

describe("PublicPlaylistTrackItem", () => {
  beforeEach(() => {
    po = new PublicPlaylistTrackItemPageObject();
  });

  it("renders PublicPlaylistTrackItem", () => {
    po.renderPublicPlaylistTrackItem();

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
  });

  it("shows a play control on inactive rows", () => {
    po.renderPublicPlaylistTrackItem();

    expect(
      screen.getByTestId("fmdPublicPlaylistTrackPlaybackControl"),
    ).toHaveAccessibleName("Play A1 - Opening");
    expect(screen.queryByTestId("fmdPlayingIndicator")).toBeNull();
  });

  it("shows a playing indicator on the active row while playback is running", () => {
    const release = releaseFactory.withDisplayDefaults({ instance_id: 9001 });
    po.mockPlaybackState({
      release,
      activeTrackPosition: "A1",
      isMiniPlayerVisible: true,
      isPlaying: true,
      isPaused: false,
    });
    po.renderPublicPlaylistTrackItem();

    expect(screen.getByTestId("fmdPlayingIndicator")).toHaveAttribute(
      "data-playback-state",
      "playing",
    );
    expect(
      screen.getByTestId("fmdPublicPlaylistTrackPlaybackControl"),
    ).toHaveAccessibleName("Pause A1 - Opening");
  });

  it("shows a pause icon on the active row when playback is paused", () => {
    const release = releaseFactory.withDisplayDefaults({ instance_id: 9001 });
    po.mockPlaybackState({
      release,
      activeTrackPosition: "A1",
      isMiniPlayerVisible: true,
      isPlaying: false,
      isPaused: true,
    });
    po.renderPublicPlaylistTrackItem();

    expect(screen.queryByTestId("fmdPlayingIndicator")).toBeNull();
    expect(
      screen.getByTestId("fmdPublicPlaylistTrackPlaybackControl"),
    ).toHaveAccessibleName("Resume A1 - Opening");
  });

  it("toggles playback from the trailing control when the row is active", async () => {
    const user = userEvent.setup();
    const release = releaseFactory.withDisplayDefaults({ instance_id: 9001 });
    po.mockPlaybackState({
      release,
      activeTrackPosition: "A1",
      isMiniPlayerVisible: true,
      isPlaying: true,
      isPaused: false,
    });
    po.renderPublicPlaylistTrackItem();

    await user.click(
      screen.getByTestId("fmdPublicPlaylistTrackPlaybackControl"),
    );

    expect(po.togglePlayback).toHaveBeenCalledTimes(1);
  });
});
