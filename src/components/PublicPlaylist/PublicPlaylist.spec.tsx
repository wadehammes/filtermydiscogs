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
import { publicPlaylistInfoFactory } from "src/tests/factories/PublicPlaylistInfo.factory";
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

  it("when initialPublicPlaylist is provided, renders from SSR and hydrates viewer votes once", async () => {
    const payload = publicPlaylistResponseFactory.build({
      playlist: publicPlaylistInfoFactory.forDemoPage({
        id: po.playlistId,
        name: "Server playlist",
      }),
    });

    po.mockPublicPlaylistResponse(payload);
    po.renderPublicPlaylistClientWithPlaybackShell({
      initialPublicPlaylist: payload,
    });

    expect(
      await screen.findByRole("heading", { name: "Server playlist" }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(mockPublicPlaylistApi).toHaveBeenCalledTimes(1);
    });
    expect(mockPublicPlaylistApi).toHaveBeenCalledWith(po.playlistId);
    expect(mockPrivatePlaylistApi).not.toHaveBeenCalled();
  });

  it("loads a public playlist via the public API without the private playlist route", async () => {
    const payload = publicPlaylistResponseFactory.build({
      playlist: publicPlaylistInfoFactory.forDemoPage({
        id: po.playlistId,
        name: "Weekend rotation",
        publicDescription: "Sunday morning picks from my shelf.",
      }),
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
      screen.getByText("Sunday morning picks from my shelf."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Learn more" })).toHaveAttribute(
      "href",
      "/about",
    );
    expect(
      screen.queryByText(/without signing in like this one/i),
    ).not.toBeInTheDocument();
  });

  it("renders a cover collage from unique release art in the summary hero", async () => {
    const payload = publicPlaylistResponseFactory.build({
      playlist: publicPlaylistInfoFactory.forDemoPage({
        id: po.playlistId,
        name: "Collage list",
      }),
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
      playlist: publicPlaylistInfoFactory.forDemoPage({
        id: po.playlistId,
        name: "Shared list",
        username: "dj-crate",
      }),
    });

    po.mockPublicPlaylistResponse(payload);
    po.renderPublicPlaylistClientWithPlaybackShell();

    expect(
      await screen.findByTestId("fmdPublicSharedViewBanner"),
    ).toHaveTextContent("Public playlist · Shared by dj-crate");
  });

  it("starts playback from Play All when PublicPlaylistPage supplies PublicSharePlaybackShell", async () => {
    const payload = publicPlaylistResponseFactory.build({
      playlist: publicPlaylistInfoFactory.forDemoPage({
        id: po.playlistId,
        name: "Queue me",
      }),
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
