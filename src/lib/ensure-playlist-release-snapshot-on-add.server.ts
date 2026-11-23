import "server-only";

import { prisma } from "src/lib/db";
import { persistPlaylistReleaseSnapshots } from "src/lib/playlist-release-snapshot.server";
import {
  toPublicPlaylistReleaseSnapshot,
  toValidatedPublicPlaylistRelease,
  validateReleaseDataForStorage,
} from "src/lib/release-data-validation";
import type { DiscogsRelease } from "src/types";
import { playlistReleaseHasDisplayArt } from "src/utils/discogsReleaseArt";

const resolveReleaseForPlaylistSnapshot = (
  releaseFromRequest: unknown,
): DiscogsRelease | undefined => {
  if (releaseFromRequest === undefined) {
    return undefined;
  }

  const validated = validateReleaseDataForStorage(releaseFromRequest);

  if (!("release" in validated)) {
    return undefined;
  }

  return toPublicPlaylistReleaseSnapshot(validated.release);
};

export const ensurePlaylistReleaseSnapshotOnTrackAdd = async ({
  userId,
  playlistId,
  instanceId,
  releaseFromRequest,
}: {
  userId: number;
  playlistId: string;
  instanceId: string;
  releaseFromRequest?: unknown;
}): Promise<void> => {
  let release = resolveReleaseForPlaylistSnapshot(releaseFromRequest);

  if (!(release && playlistReleaseHasDisplayArt(release))) {
    const crateRow = await prisma.crateRelease.findFirst({
      where: {
        user_id: userId,
        instance_id: instanceId,
      },
      orderBy: { added_at: "desc" },
      select: { release_data: true },
    });
    const fromCrate = crateRow
      ? toValidatedPublicPlaylistRelease(crateRow.release_data)
      : undefined;

    if (fromCrate && playlistReleaseHasDisplayArt(fromCrate)) {
      release = fromCrate;
    }
  }

  if (!(release && playlistReleaseHasDisplayArt(release))) {
    return;
  }

  await persistPlaylistReleaseSnapshots({
    userId,
    playlistId,
    releases: [release],
  });
};
