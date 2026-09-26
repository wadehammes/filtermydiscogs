import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { discogsTrackFactory } from "src/tests/factories/DiscogsTrack.factory";
import { discogsVideoFactory } from "src/tests/factories/DiscogsVideo.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import type { DiscogsRelease } from "src/types";
import type { DiscogsReleaseDetail } from "src/types/discogs-release-detail.types";

export const RELEASE_ID = 249504;
export const SHORT_RELEASE_ID = 100_002;

const MAIN_VIDEO_A1 = "te2jJncBVG4";
const MAIN_VIDEO_B1 = "abc12345678";
const SHORT_VIDEO = "def98765432";
const SIMILAR_VIDEO = "similar12345";

const mainTrackA1 = discogsTrackFactory.build({
  position: "A1",
  title: "Never Gonna Give You Up",
  duration: "3:32",
  type_: "track",
});

const mainTrackB1 = discogsTrackFactory.build({
  position: "B1",
  title: "Never Gonna Give You Up (Instrumental)",
  duration: "3:30",
  type_: "track",
});

const shortTrack1 = discogsTrackFactory.build({
  position: "1",
  title: "Short A",
  duration: "2:00",
  type_: "track",
});

export const releaseDetail: DiscogsReleaseDetail =
  discogsReleaseJsonFactory.withTracklistAndVideos({
    id: RELEASE_ID,
    tracklist: [mainTrackA1, mainTrackB1],
    videos: [
      discogsVideoFactory.youtube({
        description: "Rick Astley - Never Gonna Give You Up",
        duration: 330,
        title: "Rick Astley - Never Gonna Give You Up",
        uri: `https://www.youtube.com/watch?v=${MAIN_VIDEO_A1}`,
      }),
      discogsVideoFactory.youtube({
        description: "Rick Astley - Never Gonna Give You Up (Instrumental)",
        duration: 330,
        title: "Rick Astley - Never Gonna Give You Up (Instrumental)",
        uri: `https://www.youtube.com/watch?v=${MAIN_VIDEO_B1}`,
      }),
    ],
  });

export const shortReleaseDetail: DiscogsReleaseDetail =
  discogsReleaseJsonFactory.withTracklistAndVideos({
    id: SHORT_RELEASE_ID,
    tracklist: [shortTrack1],
    videos: [
      discogsVideoFactory.youtube({
        description: "Short A",
        duration: 120,
        title: "Short A",
        uri: `https://www.youtube.com/watch?v=${SHORT_VIDEO}`,
      }),
    ],
  });

export const similarHouseReleaseDetail: DiscogsReleaseDetail =
  discogsReleaseJsonFactory.withTracklistAndVideos({
    id: SHORT_RELEASE_ID,
    tracklist: [
      discogsTrackFactory.build({
        position: "A1",
        title: "Similar Track",
        duration: "4:00",
        type_: "track",
      }),
    ],
    videos: [
      discogsVideoFactory.youtube({
        description: "Similar Track",
        duration: 240,
        title: "Similar Track",
        uri: `https://www.youtube.com/watch?v=${SIMILAR_VIDEO}`,
      }),
    ],
  });

export const collectionRelease: DiscogsRelease =
  releaseFactory.withDisplayDefaults({
    basic_information: basicInformationFactory.build({
      id: RELEASE_ID,
      title: "Never Gonna Give You Up",
      resource_url: `https://api.discogs.com/releases/${RELEASE_ID}`,
    }),
  });

export const shortCollectionRelease: DiscogsRelease =
  releaseFactory.withDisplayDefaults({
    basic_information: basicInformationFactory.build({
      id: SHORT_RELEASE_ID,
      title: "Short EP",
      resource_url: `https://api.discogs.com/releases/${SHORT_RELEASE_ID}`,
    }),
  });

export const playbackSpecDualReleaseApiMap: Record<string, DiscogsReleaseDetail> =
  {
    [String(SHORT_RELEASE_ID)]: shortReleaseDetail,
  };
