import { HttpResponse, http } from "msw";
import { E2E_EMBED_MOCK_VIDEO_IDS } from "src/constants/e2eEmbedMock.constants";
import {
  LOGIN_DEMO_PUBLIC_PLAYLIST_ID,
  LOGIN_DEMO_PUBLIC_PLAYLIST_TITLE,
} from "src/constants/publicPlaylist.constants";
import { buildE2eCollectionReleases } from "src/tests/msw/e2eCollectionData";
import { E2E_RELEASE_TRACK_POSITION } from "src/tests/msw/e2eReleaseDetailData";
import {
  E2E_AUTH_USERNAME,
  E2E_DISCOGS_RELEASE_ID_ONE,
  E2E_DISCOGS_RELEASE_ID_TWO,
  E2E_TRACK_ONE,
  E2E_TRACK_TWO,
} from "src/tests/msw/e2eSession.constants";
import type { DiscogsRelease } from "src/types";
import type {
  PlaylistTrackRow,
  PublicPlaylistEngagementResponse,
  PublicPlaylistResponse,
  PublicPlaylistShareStats,
} from "src/types/playlist.types";

const E2E_PUBLIC_PLAYLIST_API_PATHS = [
  "/api/playlists/public/:playlistId",
  "http://localhost:6767/api/playlists/public/:playlistId",
  "http://127.0.0.1:6767/api/playlists/public/:playlistId",
] as const;

const E2E_PUBLIC_PLAYLIST_VIEW_API_PATHS = [
  "/api/playlists/public/:playlistId/view",
  "http://localhost:6767/api/playlists/public/:playlistId/view",
  "http://127.0.0.1:6767/api/playlists/public/:playlistId/view",
] as const;

const E2E_PUBLIC_PLAYLIST_PLAY_API_PATHS = [
  "/api/playlists/public/:playlistId/play",
  "http://localhost:6767/api/playlists/public/:playlistId/play",
  "http://127.0.0.1:6767/api/playlists/public/:playlistId/play",
] as const;

let e2eDemoPublicPlaylistShareStats: PublicPlaylistShareStats = {
  publicViewCount: 0,
  publicPlayCount: 0,
};

export const resetE2eDemoPublicPlaylistEngagement = (): void => {
  e2eDemoPublicPlaylistShareStats = {
    publicViewCount: 0,
    publicPlayCount: 0,
  };
};

const isE2eDemoPublicPlaylistId = (playlistId: string): boolean =>
  playlistId === LOGIN_DEMO_PUBLIC_PLAYLIST_ID;

const buildE2eDemoPublicPlaylistEngagementResponse = (
  shareStats: PublicPlaylistShareStats,
): PublicPlaylistEngagementResponse => ({
  ok: true,
  shareStats,
});

const recordE2eDemoPublicPlaylistView = (): PublicPlaylistShareStats => {
  e2eDemoPublicPlaylistShareStats = {
    ...e2eDemoPublicPlaylistShareStats,
    publicViewCount: e2eDemoPublicPlaylistShareStats.publicViewCount + 1,
  };
  return e2eDemoPublicPlaylistShareStats;
};

const recordE2eDemoPublicPlaylistPlay = (): PublicPlaylistShareStats => {
  e2eDemoPublicPlaylistShareStats = {
    ...e2eDemoPublicPlaylistShareStats,
    publicPlayCount: e2eDemoPublicPlaylistShareStats.publicPlayCount + 1,
  };
  return e2eDemoPublicPlaylistShareStats;
};

export const buildE2eDemoPublicPlaylistResponse =
  (): PublicPlaylistResponse => {
    const releases = buildE2eCollectionReleases().slice(0, 2);
    const releaseByInstanceId = new Map<string, DiscogsRelease>(
      releases.map((release) => [String(release.instance_id), release]),
    );

    const tracks: PlaylistTrackRow[] = [
      {
        track_key: `e2e-release-1:${E2E_RELEASE_TRACK_POSITION}`,
        sort_order: 10,
        track_title: E2E_TRACK_ONE,
        track_position: E2E_RELEASE_TRACK_POSITION,
        instance_id: "e2e-release-1",
        artist: "Test Artist",
        release_title:
          releaseByInstanceId.get("e2e-release-1")?.basic_information.title ??
          null,
        youtube_id: E2E_EMBED_MOCK_VIDEO_IDS.normal,
        discogs_release_id: E2E_DISCOGS_RELEASE_ID_ONE,
        upCount: 0,
        downCount: 0,
      },
      {
        track_key: `e2e-release-2:${E2E_RELEASE_TRACK_POSITION}`,
        sort_order: 20,
        track_title: E2E_TRACK_TWO,
        track_position: E2E_RELEASE_TRACK_POSITION,
        instance_id: "e2e-release-2",
        artist: "Test Artist",
        release_title:
          releaseByInstanceId.get("e2e-release-2")?.basic_information.title ??
          null,
        youtube_id: E2E_EMBED_MOCK_VIDEO_IDS.normal,
        discogs_release_id: E2E_DISCOGS_RELEASE_ID_TWO,
        upCount: 0,
        downCount: 0,
      },
    ];

    const now = "2026-01-01T00:00:00.000Z";

    return {
      playlist: {
        id: LOGIN_DEMO_PUBLIC_PLAYLIST_ID,
        name: LOGIN_DEMO_PUBLIC_PLAYLIST_TITLE,
        username: E2E_AUTH_USERNAME,
        private: false,
        publicDescription: null,
        created_at: now,
        updated_at: now,
      },
      tracks,
      releases,
      mosaicThumbUrls: releases
        .map((release) => release.basic_information.thumb)
        .filter((url): url is string => Boolean(url)),
      shareStats: { ...e2eDemoPublicPlaylistShareStats },
    };
  };

type PublicPlaylistRouteParams = {
  params: Record<string, string | readonly string[] | undefined>;
};

const publicPlaylistNotFoundResponse = () =>
  HttpResponse.json(
    { error: "Playlist not found or is private" },
    { status: 404 },
  );

const requireE2eDemoPublicPlaylistId = ({
  params,
}: PublicPlaylistRouteParams) => {
  const playlistId = String(params.playlistId);

  if (!isE2eDemoPublicPlaylistId(playlistId)) {
    return publicPlaylistNotFoundResponse();
  }

  return playlistId;
};

const respondPublicPlaylistEngagementPost = (
  context: PublicPlaylistRouteParams,
  recordEngagement: () => PublicPlaylistShareStats,
) => {
  const playlistIdOrResponse = requireE2eDemoPublicPlaylistId(context);

  if (typeof playlistIdOrResponse !== "string") {
    return playlistIdOrResponse;
  }

  const shareStats = recordEngagement();
  return HttpResponse.json(
    buildE2eDemoPublicPlaylistEngagementResponse(shareStats),
  );
};

export const createDefaultPublicPlaylistApiHandlers = () => {
  const respondGet = (context: PublicPlaylistRouteParams) => {
    const playlistIdOrResponse = requireE2eDemoPublicPlaylistId(context);

    if (typeof playlistIdOrResponse !== "string") {
      return playlistIdOrResponse;
    }

    return HttpResponse.json(buildE2eDemoPublicPlaylistResponse(), {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      },
    });
  };

  const respondViewPost = (context: PublicPlaylistRouteParams) =>
    respondPublicPlaylistEngagementPost(
      context,
      recordE2eDemoPublicPlaylistView,
    );

  const respondPlayPost = (context: PublicPlaylistRouteParams) =>
    respondPublicPlaylistEngagementPost(
      context,
      recordE2eDemoPublicPlaylistPlay,
    );

  return [
    ...E2E_PUBLIC_PLAYLIST_API_PATHS.map((path) => http.get(path, respondGet)),
    ...E2E_PUBLIC_PLAYLIST_VIEW_API_PATHS.map((path) =>
      http.post(path, respondViewPost),
    ),
    ...E2E_PUBLIC_PLAYLIST_PLAY_API_PATHS.map((path) =>
      http.post(path, respondPlayPost),
    ),
  ];
};
