import { mostCratedReleaseFactory } from "src/tests/factories/MostCratedRelease.factory";
import { topUserTrackFactory } from "src/tests/factories/TopUserTrack.factory";
import { topUserTracksResponseFactory } from "src/tests/factories/TopUserTracksResponse.factory";
import type { DiscogsRelease } from "src/types";
import type {
  MostCratedRelease,
  TopUserTracksResponse,
} from "src/types/dashboard.types";

export function buildE2eDashboardMostCrated(
  releases: DiscogsRelease[],
): MostCratedRelease[] {
  const release = releases[0];

  if (!release) {
    return [];
  }

  return [
    mostCratedReleaseFactory.fromRelease(release, {
      crate_count: 2,
    }),
  ];
}

export function buildE2eDashboardTopTracks(
  releases: DiscogsRelease[],
): TopUserTracksResponse {
  const release = releases[0];

  if (!release) {
    return topUserTracksResponseFactory.empty();
  }

  const instanceId = String(release.instance_id);

  return topUserTracksResponseFactory.build({
    most_played: [
      topUserTrackFactory.fromRelease(release, {
        track_key: `${instanceId}:A1`,
        track_title: "E2E Track One",
        track_position: "A1",
        artist: "Test Artist",
        play_count: 4,
        listen_count: 1,
      }),
    ],
    most_listened: [
      topUserTrackFactory.fromRelease(release, {
        track_key: `${instanceId}:B1`,
        track_title: "E2E Track Two",
        track_position: "B1",
        artist: "Test Artist",
        play_count: 1,
        listen_count: 5,
      }),
    ],
  });
}
