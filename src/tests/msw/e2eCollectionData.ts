import { artistFactory } from "src/tests/factories/Artist.factory";
import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import {
  E2E_ALBUM_ONE,
  E2E_ALBUM_THREE,
  E2E_ALBUM_TWO,
  E2E_DISCOGS_RELEASE_ID_ONE,
  E2E_DISCOGS_RELEASE_ID_THREE,
  E2E_DISCOGS_RELEASE_ID_TWO,
} from "src/tests/msw/e2eSession.constants";
import type { DiscogsRelease } from "src/types";

const E2E_COVER_IMAGE = "https://placehold.co/600x600/png";
const E2E_THUMB_IMAGE = "https://placehold.co/150x150/png";

type E2eCollectionReleaseInput = {
  title: string;
  instanceId: string;
  discogsReleaseId: number;
  dateAdded: string;
  styles: string[];
};

const buildE2eCollectionRelease = ({
  title,
  instanceId,
  discogsReleaseId,
  dateAdded,
  styles,
}: E2eCollectionReleaseInput): DiscogsRelease =>
  releaseFactory.build({
    instance_id: instanceId,
    date_added: dateAdded,
    rating: 4,
    notes: [],
    basic_information: basicInformationFactory.build({
      id: discogsReleaseId,
      title,
      year: 2020,
      styles,
      genres: ["Rock"],
      artists: [artistFactory.build({ name: "Test Artist" })],
      labels: [],
      thumb: E2E_THUMB_IMAGE,
      cover_image: E2E_COVER_IMAGE,
      resource_url: `https://api.discogs.com/releases/${discogsReleaseId}`,
      uri: `https://www.discogs.com/release/${discogsReleaseId}`,
    }),
  });

export const buildE2eCollectionReleases = (): DiscogsRelease[] => {
  const now = new Date();
  const thisYear = new Date(now.getFullYear(), 0, 15).toISOString();
  const lastYear = new Date(now.getFullYear() - 1, 6, 1).toISOString();
  const twoYearsAgo = new Date(now.getFullYear() - 2, 2, 10).toISOString();

  return [
    buildE2eCollectionRelease({
      title: E2E_ALBUM_ONE,
      instanceId: "e2e-release-1",
      discogsReleaseId: E2E_DISCOGS_RELEASE_ID_ONE,
      dateAdded: thisYear,
      styles: ["Indie Rock"],
    }),
    buildE2eCollectionRelease({
      title: E2E_ALBUM_TWO,
      instanceId: "e2e-release-2",
      discogsReleaseId: E2E_DISCOGS_RELEASE_ID_TWO,
      dateAdded: lastYear,
      styles: ["Electronic"],
    }),
    buildE2eCollectionRelease({
      title: E2E_ALBUM_THREE,
      instanceId: "e2e-release-3",
      discogsReleaseId: E2E_DISCOGS_RELEASE_ID_THREE,
      dateAdded: twoYearsAgo,
      styles: ["Jazz"],
    }),
  ];
};

export const buildE2eSimilarTailCollectionReleases = (): DiscogsRelease[] => {
  const collection = buildE2eCollectionReleases();
  const sourceRelease = collection.find(
    (release) => release.basic_information.id === E2E_DISCOGS_RELEASE_ID_ONE,
  );

  if (!sourceRelease) {
    throw new Error("E2E collection missing album one");
  }

  const peerGenres = sourceRelease.basic_information.genres ?? ["Rock"];
  const peerStyles = sourceRelease.basic_information.styles ?? ["Indie Rock"];

  return collection.map((release) => {
    if (release.basic_information.id === E2E_DISCOGS_RELEASE_ID_ONE) {
      return release;
    }

    const { basic_information: basicInfo } = release;
    const discogsReleaseId = basicInfo.id;

    if (discogsReleaseId === undefined) {
      throw new Error(`E2E collection release missing id: ${basicInfo.title}`);
    }

    return releaseFactory.build({
      instance_id: release.instance_id,
      date_added: release.date_added,
      rating: release.rating,
      notes: release.notes,
      basic_information: basicInformationFactory.build({
        id: discogsReleaseId,
        title: basicInfo.title,
        year: basicInfo.year,
        styles: peerStyles,
        genres: peerGenres,
        artists: basicInfo.artists,
        labels: basicInfo.labels,
        thumb: basicInfo.thumb,
        cover_image: basicInfo.cover_image,
        resource_url: basicInfo.resource_url,
        uri: basicInfo.uri,
      }),
    });
  });
};
