import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { discogsTrackFactory } from "src/tests/factories/DiscogsTrack.factory";
import { discogsVideoFactory } from "src/tests/factories/DiscogsVideo.factory";
import {
  E2E_ALBUM_ONE,
  E2E_ALBUM_THREE,
  E2E_ALBUM_TWO,
  E2E_DISCOGS_RELEASE_ID_ONE,
  E2E_DISCOGS_RELEASE_ID_THREE,
  E2E_DISCOGS_RELEASE_ID_TWO,
} from "src/tests/msw/e2eSession.constants";
import type { DiscogsReleaseDetail } from "src/types/discogs-release-detail.types";

const e2eTrackTitle = (albumTitle: string) => `${albumTitle} (E2E Track A)`;

function buildE2eReleaseDetail(
  id: number,
  title: string,
): DiscogsReleaseDetail {
  const trackTitle = e2eTrackTitle(title);

  return discogsReleaseJsonFactory.withTracklistAndVideos({
    id,
    title,
    artists: [{ name: "Test Artist" }],
    tracklist: [
      discogsTrackFactory.build({
        position: "A",
        title: trackTitle,
        duration: "3:32",
        type_: "track",
      }),
    ],
    videos: [
      discogsVideoFactory.youtube({
        description: trackTitle,
        duration: 212,
        title: trackTitle,
        uri: "https://www.youtube.com/watch?v=te2jJncBVG4",
      }),
    ],
  });
}

export function buildE2eReleaseDetailByDiscogsId(): Map<
  string,
  DiscogsReleaseDetail
> {
  return new Map([
    [
      String(E2E_DISCOGS_RELEASE_ID_ONE),
      buildE2eReleaseDetail(E2E_DISCOGS_RELEASE_ID_ONE, E2E_ALBUM_ONE),
    ],
    [
      String(E2E_DISCOGS_RELEASE_ID_TWO),
      buildE2eReleaseDetail(E2E_DISCOGS_RELEASE_ID_TWO, E2E_ALBUM_TWO),
    ],
    [
      String(E2E_DISCOGS_RELEASE_ID_THREE),
      buildE2eReleaseDetail(E2E_DISCOGS_RELEASE_ID_THREE, E2E_ALBUM_THREE),
    ],
  ]);
}

export { e2eTrackTitle };
