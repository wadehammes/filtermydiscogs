import { HttpResponse, http } from "msw";
import { E2E_PLAYLIST_ID } from "src/tests/msw/e2ePlaylist.constants";
import {
  buildE2eDefaultPlaylistDetail,
  buildE2eDefaultPlaylistSummary,
} from "src/tests/msw/e2ePlaylistData";
import type { PlaylistDetail } from "src/types/playlist.types";

export const createDefaultPlaylistApiHandlers = () => {
  const summary = buildE2eDefaultPlaylistSummary();
  const detail: PlaylistDetail = buildE2eDefaultPlaylistDetail();

  return [
    http.get("/api/playlists", () =>
      HttpResponse.json({ playlists: [summary] }),
    ),
    http.get("/api/playlists/:playlistId", ({ params }) => {
      if (params.playlistId === E2E_PLAYLIST_ID) {
        return HttpResponse.json({ playlist: detail });
      }

      return HttpResponse.json({ error: "Not found" }, { status: 404 });
    }),
  ];
};
