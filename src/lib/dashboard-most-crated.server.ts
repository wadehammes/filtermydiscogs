import "server-only";

import { prisma } from "src/lib/db";
import { validateReleaseDataForStorage } from "src/lib/release-data-validation";
import type { MostCratedRelease } from "src/types/dashboard.types";

type CrateMembershipPair = { instance_id: string; crate_id: string };

export const rankMostCratedInstances = (
  crateMembershipPairs: CrateMembershipPair[],
  limit: number,
): Array<{ instance_id: string; crate_count: number }> => {
  const cratesByInstance = new Map<string, Set<string>>();

  for (const pair of crateMembershipPairs) {
    const instanceId = String(pair.instance_id);
    const crateId = String(pair.crate_id);
    const crateIds = cratesByInstance.get(instanceId) ?? new Set<string>();
    crateIds.add(crateId);
    cratesByInstance.set(instanceId, crateIds);
  }

  return [...cratesByInstance.entries()]
    .map(([instance_id, crateIds]) => ({
      instance_id,
      crate_count: crateIds.size,
    }))
    .filter((row) => row.crate_count > 1)
    .sort((left, right) => right.crate_count - left.crate_count)
    .slice(0, limit);
};

export const fetchMostCratedReleasesForUser = async (
  userId: number,
  limit: number,
): Promise<MostCratedRelease[]> => {
  const crateMembershipPairs = await prisma.crateRelease.groupBy({
    by: ["instance_id", "crate_id"],
    where: { user_id: userId },
  });

  const ranked = rankMostCratedInstances(crateMembershipPairs, limit);
  if (ranked.length === 0) {
    return [];
  }

  const instanceIds = ranked.map((row) => row.instance_id);
  const releaseRows = await prisma.crateRelease.findMany({
    where: {
      user_id: userId,
      instance_id: { in: instanceIds },
    },
    select: {
      instance_id: true,
      release_data: true,
    },
    distinct: ["instance_id"],
  });

  const releaseByInstanceId = new Map<string, MostCratedRelease["release"]>();
  for (const row of releaseRows) {
    const validation = validateReleaseDataForStorage(row.release_data);
    if (validation.release) {
      releaseByInstanceId.set(String(row.instance_id), validation.release);
    }
  }

  const releases: MostCratedRelease[] = [];
  for (const row of ranked) {
    const release = releaseByInstanceId.get(row.instance_id);
    if (release) {
      releases.push({
        instance_id: row.instance_id,
        crate_count: row.crate_count,
        release,
      });
    }
  }

  return releases;
};
