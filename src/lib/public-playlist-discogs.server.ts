import "server-only";

import { fetchDiscogsReleaseRecord } from "src/lib/fetchDiscogsReleaseRecord.server";
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

export const fetchDiscogsReleaseDetailById = async (
  releaseId: number,
): Promise<DiscogsReleaseDetail | null> => {
  const releaseUrl = `https://api.discogs.com/releases/${releaseId}`;

  try {
    return (await fetchDiscogsReleaseRecord({
      releaseUrl,
      useAuthenticatedSession: false,
    })) as DiscogsReleaseDetail;
  } catch {
    return null;
  }
};

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

  const releaseIdByInstanceId = new Map<string, number>();

  for (const instanceId of instanceIds) {
    const track =
      tracks.find((row) => String(row.instance_id) === instanceId) ?? null;
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
  const uniqueReleaseIds = [...new Set(releaseIdByInstanceId.values())];

  const fetchedDetails = await Promise.all(
    uniqueReleaseIds.map(async (releaseId) => ({
      releaseId,
      detail: await fetchDiscogsReleaseDetailById(releaseId),
    })),
  );

  for (const { releaseId, detail } of fetchedDetails) {
    if (detail) {
      detailByReleaseId.set(releaseId, detail);
    }
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
