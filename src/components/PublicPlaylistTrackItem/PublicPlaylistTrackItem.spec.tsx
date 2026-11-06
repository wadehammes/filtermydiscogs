import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { PublicPlaylistTrackItemPageObject } from "src/components/PublicPlaylistTrackItem/PublicPlaylistTrackItem.po";
import { PUBLIC_PLAYBACK_VIDEO_REPORT_ERROR_CODE } from "src/lib/sentry/playbackSkipSentrySource";
import { playlistTrackRowFactory } from "src/tests/factories/PlaylistTrackRow.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { buildPublicPlaybackVideoReportEntry } from "src/utils/buildPublicPlaybackVideoReportEntry";
import { screen } from "test-utils";

const defaultPublicPlaylistId = "11111111-2222-3333-4444-555555555555";

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

  it("shows a report control when the row has a YouTube id after hovering the row", async () => {
    const user = userEvent.setup();
    po.renderPublicPlaylistTrackItem();

    await user.hover(screen.getByTestId(po.testId));

    expect(
      screen.getByTestId("fmdPublicPlaylistTrackReportWrongVideo"),
    ).toHaveAccessibleName("Report wrong video for this track");
  });

  it("omits the report control when the row has no YouTube id", () => {
    po.renderPublicPlaylistTrackItem({
      track: playlistTrackRowFactory.opening({ youtube_id: null }),
    });

    expect(
      screen.queryByTestId("fmdPublicPlaylistTrackReportWrongVideo"),
    ).toBeNull();
  });

  it("opens the skip report dialog with public playback context when Report is pressed", async () => {
    const user = userEvent.setup();
    const track = playlistTrackRowFactory.opening({
      track_key: "rpt-key",
      youtube_id: "ytid1234567",
    });
    const release = releaseFactory.withDisplayDefaults({
      instance_id: track.instance_id,
    });
    po.renderPublicPlaylistTrackItem({ track, release });

    await user.hover(screen.getByTestId(po.testId));
    await user.click(
      screen.getByTestId("fmdPublicPlaylistTrackReportWrongVideo"),
    );

    expect(po.openPlaybackSkipReportDialog).toHaveBeenCalledTimes(1);
    expect(po.openPlaybackSkipReportDialog).toHaveBeenCalledWith(
      buildPublicPlaybackVideoReportEntry(
        defaultPublicPlaylistId,
        track,
        release,
      ),
    );
    expect(po.openPlaybackSkipReportDialog.mock.calls[0]?.[0]?.errorCode).toBe(
      PUBLIC_PLAYBACK_VIDEO_REPORT_ERROR_CODE,
    );
  });
});
