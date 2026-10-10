import "server-only";

import { prisma } from "src/lib/db";

export const resolveOrphanedInstanceIds = (
  instanceGroups: Array<{ instance_id: string }>,
  collectionInstanceIdSet: Set<string>,
): string[] =>
  instanceGroups
    .map((group) => String(group.instance_id))
    .filter((instanceId) => !collectionInstanceIdSet.has(instanceId));

export const computeCrateSyncDeletionPercentage = ({
  totalRowCount,
  orphanedRowCount,
}: {
  totalRowCount: number;
  orphanedRowCount: number;
}): number =>
  totalRowCount === 0 ? 0 : (orphanedRowCount / totalRowCount) * 100;

export const fetchCrateSyncOrphanState = async (
  userId: number,
  collectionInstanceIdSet: Set<string>,
) => {
  const totalRowCount = await prisma.crateRelease.count({
    where: { user_id: userId },
  });

  if (totalRowCount === 0) {
    return {
      totalRowCount: 0,
      orphanedRowCount: 0,
      orphanedInstanceIds: [],
    };
  }

  const instanceGroups = await prisma.crateRelease.groupBy({
    by: ["instance_id"],
    where: { user_id: userId },
  });

  const orphanedInstanceIds = resolveOrphanedInstanceIds(
    instanceGroups,
    collectionInstanceIdSet,
  );

  if (orphanedInstanceIds.length === 0) {
    return {
      totalRowCount,
      orphanedRowCount: 0,
      orphanedInstanceIds,
    };
  }

  const orphanedRowCount = await prisma.crateRelease.count({
    where: {
      user_id: userId,
      instance_id: { in: orphanedInstanceIds },
    },
  });

  return {
    totalRowCount,
    orphanedRowCount,
    orphanedInstanceIds,
  };
};

export const deleteCrateReleasesByInstanceIds = async (
  userId: number,
  instanceIds: string[],
  batchSize = 1000,
): Promise<number> => {
  let totalDeleted = 0;

  for (let index = 0; index < instanceIds.length; index += batchSize) {
    const batch = instanceIds.slice(index, index + batchSize);
    const result = await prisma.crateRelease.deleteMany({
      where: {
        user_id: userId,
        instance_id: {
          in: batch,
        },
      },
    });
    totalDeleted += result.count;
  }

  return totalDeleted;
};
