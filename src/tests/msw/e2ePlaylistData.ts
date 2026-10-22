import { playlistSummaryFactory } from "src/tests/factories/PlaylistSummary.factory";
import { playlistTrackRowFactory } from "src/tests/factories/PlaylistTrackRow.factory";
import {
  E2E_PLAYLIST_ID,
  E2E_PLAYLIST_NAME,
  E2E_PLAYLIST_TRACK_INSTANCE_ID,
  E2E_PLAYLIST_TRACK_POSITION,
} from "src/tests/msw/e2ePlaylist.constants";
import { e2eTrackTitle } from "src/tests/msw/e2eReleaseDetailData";
import { E2E_ALBUM_ONE } from "src/tests/msw/e2eSession.constants";
import type { PlaylistDetail, PlaylistSummary } from "src/types/playlist.types";

const e2ePlaylistTrackTitle = e2eTrackTitle(E2E_ALBUM_ONE);

export const buildE2eDefaultPlaylistSummary = (): PlaylistSummary =>
  playlistSummaryFactory.build({
    id: E2E_PLAYLIST_ID,
    name: E2E_PLAYLIST_NAME,
    trackCount: 1,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  });

export const buildE2eDefaultPlaylistDetail = (): PlaylistDetail => ({
  id: E2E_PLAYLIST_ID,
  name: E2E_PLAYLIST_NAME,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  tracks: [
    playlistTrackRowFactory.build({
      track_key: `${E2E_PLAYLIST_TRACK_INSTANCE_ID}:${E2E_PLAYLIST_TRACK_POSITION}`,
      sort_order: 1,
      track_title: e2ePlaylistTrackTitle,
      track_position: E2E_PLAYLIST_TRACK_POSITION,
      instance_id: E2E_PLAYLIST_TRACK_INSTANCE_ID,
      artist: "Test Artist",
      release_title: E2E_ALBUM_ONE,
      youtube_id: null,
    }),
  ],
});
