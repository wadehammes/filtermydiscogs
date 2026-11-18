import "server-only";

import { prisma } from "src/lib/db";
import {
  toPublicPlaylistReleaseSnapshot,
  validateReleaseDataForStorage,
} from "src/lib/release-data-validation";
import type { DiscogsRelease } from "src/types";

export const loadPlaylistReleaseSnapshots = async ({
  userId,
  playlistId,
  instanceIds,
}: {
  userId: number;
  playlistId: string;
  instanceIds: string[];
}): Promise<Map<string, DiscogsRelease>> => {
  const snapshotsByInstanceId = new Map<string, DiscogsRelease>();

  if (instanceIds.length === 0) {
    return snapshotsByInstanceId;
  }

  const rows = await prisma.playlistReleaseSnapshot.findMany({
    where: {
      user_id: userId,
      playlist_id: playlistId,
      instance_id: { in: instanceIds },
    },
    select: {
      instance_id: true,
      release_data: true,
    },
  });

  for (const row of rows) {
    const validated = validateReleaseDataForStorage(row.release_data);
    if (!("release" in validated)) {
      continue;
    }

    snapshotsByInstanceId.set(
      row.instance_id,
      toPublicPlaylistReleaseSnapshot(validated.release),
    );
  }

  return snapshotsByInstanceId;
};

export const persistPlaylistReleaseSnapshots = async ({
  userId,
  playlistId,
  releases,
}: {
  userId: number;
  playlistId: string;
  releases: DiscogsRelease[];
}): Promise<void> => {
  const uniqueByInstance = new Map<string, DiscogsRelease>();

  for (const release of releases) {
    const instanceId = String(release.instance_id);
    if (!uniqueByInstance.has(instanceId)) {
      uniqueByInstance.set(instanceId, release);
    }
  }

  if (uniqueByInstance.size === 0) {
    return;
  }

  const upserts = [...uniqueByInstance.entries()].flatMap(
    ([instanceId, release]) => {
      const validated = validateReleaseDataForStorage(release);
      if (!("release" in validated)) {
        return [];
      }

      return [
        prisma.playlistReleaseSnapshot.upsert({
          where: {
            user_id_playlist_id_instance_id: {
              user_id: userId,
              playlist_id: playlistId,
              instance_id: instanceId,
            },
          },
          create: {
            user_id: userId,
            playlist_id: playlistId,
            instance_id: instanceId,
            release_data: validated.release,
          },
          update: {
            release_data: validated.release,
          },
        }),
      ];
    },
  );

  if (upserts.length === 0) {
    return;
  }

  await prisma.$transaction(upserts);
};
