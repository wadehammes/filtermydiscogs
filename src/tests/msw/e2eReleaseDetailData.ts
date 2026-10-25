import { E2E_EMBED_MOCK_VIDEO_IDS } from "src/constants/e2eEmbedMock.constants";
import { artistFactory } from "src/tests/factories/Artist.factory";
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
import { formatTrackPositionTitle } from "src/utils/userTrack";

export const E2E_RELEASE_TRACK_POSITION = "A";

const e2eTrackTitle = (albumTitle: string) => `${albumTitle} (E2E Track A)`;

export const e2eTrackRowTitle = (albumTitle: string) =>
  formatTrackPositionTitle(
    E2E_RELEASE_TRACK_POSITION,
    e2eTrackTitle(albumTitle),
  );

export const e2eTrackPlayButtonLabel = (albumTitle: string) =>
  `Play ${e2eTrackRowTitle(albumTitle)}`;

function buildE2eReleaseDetail(
  id: number,
  title: string,
  youtubeVideoId: string = E2E_EMBED_MOCK_VIDEO_IDS.normal,
): DiscogsReleaseDetail {
  const trackTitle = e2eTrackTitle(title);

  return discogsReleaseJsonFactory.withTracklistAndVideos({
    id,
    title,
    artists: [artistFactory.build({ name: "Test Artist" })],
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
        uri: `https://www.youtube.com/watch?v=${youtubeVideoId}`,
      }),
    ],
  });
}

export function buildE2eReleaseDetailWithYoutubeVideoId(
  id: number,
  title: string,
  youtubeVideoId: string,
): DiscogsReleaseDetail {
  return buildE2eReleaseDetail(id, title, youtubeVideoId);
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
