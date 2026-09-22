import { artistFactory } from "src/tests/factories/Artist.factory";
import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import {
  E2E_ALBUM_ONE,
  E2E_ALBUM_THREE,
  E2E_ALBUM_TWO,
} from "src/tests/msw/e2eSession.constants";
import type { DiscogsRelease } from "src/types";

const E2E_COVER_IMAGE = "https://placehold.co/600x600/png";
const E2E_THUMB_IMAGE = "https://placehold.co/150x150/png";

function e2eRelease(
  title: string,
  instanceId: string,
  dateAdded: string,
  styles: string[],
): DiscogsRelease {
  return releaseFactory.build({
    instance_id: instanceId,
    date_added: dateAdded,
    rating: 4,
    notes: [],
    basic_information: basicInformationFactory.build({
      title,
      year: 2020,
      styles,
      genres: ["Rock"],
      artists: [artistFactory.build({ name: "Test Artist" })],
      labels: [],
      thumb: E2E_THUMB_IMAGE,
      cover_image: E2E_COVER_IMAGE,
      resource_url: `https://api.discogs.com/releases/${instanceId}`,
    }),
  });
}

export function buildE2eCollectionReleases(): DiscogsRelease[] {
  const now = new Date();
  const thisYear = new Date(now.getFullYear(), 0, 15).toISOString();
  const lastYear = new Date(now.getFullYear() - 1, 6, 1).toISOString();
  const twoYearsAgo = new Date(now.getFullYear() - 2, 2, 10).toISOString();

  return [
    e2eRelease(E2E_ALBUM_ONE, "e2e-release-1", thisYear, ["Indie Rock"]),
    e2eRelease(E2E_ALBUM_TWO, "e2e-release-2", lastYear, ["Electronic"]),
    e2eRelease(E2E_ALBUM_THREE, "e2e-release-3", twoYearsAgo, ["Jazz"]),
  ];
}
