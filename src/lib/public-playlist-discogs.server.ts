import "server-only";

import { DISCOGS_THROTTLE_CALLERS } from "src/constants/discogsThrottleCaller.constants";
import { fetchDiscogsReleaseRecordsSequential } from "src/lib/fetchDiscogsReleaseRecordsSequential.server";
import { toPublicPlaylistReleaseSnapshot } from "src/lib/release-data-validation";
import type { DiscogsRelease } from "src/types";
import type { DiscogsReleaseDetail } from "src/types/discogs-release-detail.types";
import type { PlaylistTrackRow } from "src/types/playlist.types";
import {
  buildDiscogsReleaseFromDetail,
  resolveDiscogsReleaseIdForPlaylistTrack,
} from "src/utils/discogsReleaseArt";

export const buildCollectionReleaseFromDiscogsDetail = (
  detail: DiscogsReleaseDetail,
  instanceId: string,
): DiscogsRelease => buildDiscogsReleaseFromDetail(detail, instanceId);

export const hydratePublicPlaylistReleases = async ({
  tracks,
  crateSnapshotsByInstanceId,
}: {
  tracks: PlaylistTrackRow[];
  crateSnapshotsByInstanceId: Map<string, DiscogsRelease>;
}): Promise<DiscogsRelease[]> => {
  const instanceIds = [
    ...new Set(tracks.map((track) => String(track.instance_id))),
  ];

  const trackByInstanceId = new Map(
    tracks.map((track) => [String(track.instance_id), track] as const),
  );
  const releaseIdByInstanceId = new Map<string, number>();

  for (const instanceId of instanceIds) {
    const track = trackByInstanceId.get(instanceId);

    if (!track) {
      continue;
    }

    const releaseId = resolveDiscogsReleaseIdForPlaylistTrack(
      track,
      crateSnapshotsByInstanceId.get(instanceId),
    );

    if (releaseId !== null) {
      releaseIdByInstanceId.set(instanceId, releaseId);
    }
  }

  const detailByReleaseId = new Map<number, DiscogsReleaseDetail>();
  const releaseIdsToFetchOrdered: string[] = [];
  const seenReleaseIds = new Set<string>();

  for (const instanceId of instanceIds) {
    if (crateSnapshotsByInstanceId.has(instanceId)) {
      continue;
    }

    const releaseId = releaseIdByInstanceId.get(instanceId);

    if (releaseId === undefined) {
      continue;
    }

    const releaseIdKey = String(releaseId);

    if (seenReleaseIds.has(releaseIdKey)) {
      continue;
    }

    seenReleaseIds.add(releaseIdKey);
    releaseIdsToFetchOrdered.push(releaseIdKey);
  }

  const releasesById =
    releaseIdsToFetchOrdered.length > 0
      ? await fetchDiscogsReleaseRecordsSequential({
          releaseIds: releaseIdsToFetchOrdered,
          useAuthenticatedSession: false,
          throttleCaller: DISCOGS_THROTTLE_CALLERS.publicPlaylistHydrate,
        })
      : {};

  for (const [releaseId, detail] of Object.entries(releasesById)) {
    detailByReleaseId.set(Number(releaseId), detail);
  }

  const releases: DiscogsRelease[] = [];

  for (const instanceId of instanceIds) {
    const releaseId = releaseIdByInstanceId.get(instanceId);
    const fetchedDetail =
      releaseId !== undefined ? detailByReleaseId.get(releaseId) : undefined;

    if (fetchedDetail) {
      releases.push(
        toPublicPlaylistReleaseSnapshot(
          buildCollectionReleaseFromDiscogsDetail(fetchedDetail, instanceId),
        ),
      );
      continue;
    }

    const crateSnapshot = crateSnapshotsByInstanceId.get(instanceId);
    if (crateSnapshot) {
      releases.push(crateSnapshot);
    }
  }

  return releases;
};
