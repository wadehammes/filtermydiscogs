import { describe, expect, it } from "@jest/globals";
import { PUBLIC_PLAYBACK_VIDEO_REPORT_ERROR_CODE } from "src/lib/sentry/playbackSkipSentrySource";
import { playlistTrackRowFactory } from "src/tests/factories/PlaylistTrackRow.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { buildPublicPlaybackVideoReportEntry } from "src/utils/buildPublicPlaybackVideoReportEntry";

describe("buildPublicPlaybackVideoReportEntry", () => {
  it("builds a skip log entry for Sentry with track and playlist context", () => {
    const track = playlistTrackRowFactory.opening({
      track_key: "k1",
      youtube_id: "abc123xyz01",
    });
    const release = releaseFactory.withDisplayDefaults({
      instance_id: track.instance_id,
      basic_information: { id: 42_424 },
    });

    const entry = buildPublicPlaybackVideoReportEntry(
      "pl-uuid",
      track,
      release,
    );

    expect(entry.errorCode).toBe(PUBLIC_PLAYBACK_VIDEO_REPORT_ERROR_CODE);
    expect(entry.trackLabel).toContain("A1");
    expect(entry.trackLabel).toContain("Opening");
    expect(entry.reason).toContain("public page");
    expect(entry.context?.trackKey).toBe("k1");
    expect(entry.context?.youtubeVideoId).toBe("abc123xyz01");
    expect(entry.context?.publicPlaylistId).toBe("pl-uuid");
    expect(entry.context?.releaseId).toBe(42_424);
  });
});
