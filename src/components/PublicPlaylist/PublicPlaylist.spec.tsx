import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import {
  mockPrivatePlaylistApi,
  mockPublicPlaylistApi,
  PublicPlaylistPageObject,
} from "src/components/PublicPlaylist/PublicPlaylist.po";
import { NOW_PLAYING_REGION_LABEL } from "src/constants/accessibilityLabels.constants";
import { E2E_EMBED_MOCK_VIDEO_IDS } from "src/constants/e2eEmbedMock.constants";
import { playlistTrackRowFactory } from "src/tests/factories/PlaylistTrackRow.factory";
import { publicPlaylistResponseFactory } from "src/tests/factories/PublicPlaylistResponse.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { PLAYLIST_HERO_MOSAIC_MAX_TILES } from "src/utils/playlistMosaic";
import { screen, waitFor } from "test-utils";

describe("PublicPlaylistClient", () => {
  let po: PublicPlaylistPageObject;

  beforeEach(() => {
    jest.clearAllMocks();
    po = new PublicPlaylistPageObject();
  });

  it("when initialPublicPlaylist is provided, renders without calling the public API", async () => {
    const payload = publicPlaylistResponseFactory.build({
      playlist: {
        id: po.playlistId,
        name: "Server playlist",
        username: "collector",
        private: false,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
      },
    });

    po.setupPublicPlaylistApiMocks();
    po.renderPublicPlaylistClientWithPlaybackShell({
      initialPublicPlaylist: payload,
    });

    expect(
      await screen.findByRole("heading", { name: "Server playlist" }),
    ).toBeInTheDocument();
    expect(mockPublicPlaylistApi).not.toHaveBeenCalled();
  });

  it("loads a public playlist via the public API without the private playlist route", async () => {
    const payload = publicPlaylistResponseFactory.build({
      playlist: {
        id: po.playlistId,
        name: "Weekend rotation",
        username: "collector",
        private: false,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
      },
    });

    po.mockPublicPlaylistResponse(payload);
    po.renderPublicPlaylistClientWithPlaybackShell();

    await waitFor(() => {
      expect(mockPublicPlaylistApi).toHaveBeenCalledWith(po.playlistId);
    });

    expect(
      await screen.findByRole("heading", { name: "Weekend rotation" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/2 tracks/)).toBeInTheDocument();
    expect(mockPrivatePlaylistApi).not.toHaveBeenCalled();
    expect(
      screen.getByText(/without signing in like this one/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/public crate link like this one/i),
    ).not.toBeInTheDocument();
  });

  it("renders a cover collage from unique release art in the summary hero", async () => {
    const payload = publicPlaylistResponseFactory.build({
      playlist: {
        id: po.playlistId,
        name: "Collage list",
        username: "collector",
        private: false,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
      },
    });

    po.mockPublicPlaylistResponse(payload);
    po.renderPublicPlaylistClientWithPlaybackShell();

    const mosaic = await screen.findByTestId("fmdCoverArtMosaic");
    expect(mosaic).toHaveAttribute(
      "aria-label",
      "Collage list cover art collage",
    );
    expect(mosaic.querySelectorAll("img")).toHaveLength(
      Math.min(payload.mosaicThumbUrls.length, PLAYLIST_HERO_MOSAIC_MAX_TILES),
    );
  });

  it("limits the summary hero collage to the first four unique releases", async () => {
    const releases = releaseFactory.buildList(5);
    const tracks = releases.map((release, index) =>
      playlistTrackRowFactory.build({
        instance_id: String(release.instance_id),
        track_key: `${release.instance_id}:A1`,
        sort_order: (index + 1) * 10,
      }),
    );
    const payload = publicPlaylistResponseFactory.build({
      tracks,
      releases,
      mosaicThumbUrls: releases
        .map((release) => release.basic_information.thumb)
        .filter(Boolean),
    });

    po.mockPublicPlaylistResponse(payload);
    po.renderPublicPlaylistClientWithPlaybackShell();

    const mosaic = await screen.findByTestId("fmdCoverArtMosaic");
    expect(mosaic.querySelectorAll("img")).toHaveLength(
      PLAYLIST_HERO_MOSAIC_MAX_TILES,
    );
  });

  it("renders the public playlist shared-view banner", async () => {
    const payload = publicPlaylistResponseFactory.build({
      playlist: {
        id: po.playlistId,
        name: "Shared list",
        username: "dj-crate",
        private: false,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
      },
    });

    po.mockPublicPlaylistResponse(payload);
    po.renderPublicPlaylistClientWithPlaybackShell();

    expect(
      await screen.findByTestId("fmdPublicSharedViewBanner"),
    ).toHaveTextContent("Public playlist · Shared by dj-crate");
  });

  it("starts playback from Play All when PublicPlaylistPage supplies PublicSharePlaybackShell", async () => {
    const payload = publicPlaylistResponseFactory.build({
      playlist: {
        id: po.playlistId,
        name: "Queue me",
        username: "collector",
        private: false,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
      },
      tracks: publicPlaylistResponseFactory.build().tracks.map((track) => ({
        ...track,
        youtube_id: E2E_EMBED_MOCK_VIDEO_IDS.normal,
      })),
    });

    po.mockPublicPlaylistResponse(payload);
    po.renderPublicPlaylistPage();

    await screen.findByRole("heading", { name: "Queue me" });

    await userEvent.click(screen.getByRole("button", { name: "Play All" }));

    await waitFor(() => {
      expect(
        screen.getByRole("region", { name: NOW_PLAYING_REGION_LABEL }),
      ).toBeInTheDocument();
    });
  });
});
