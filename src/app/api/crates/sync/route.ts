import type { NextRequest } from "next/server";
import {
  auditDatabaseOperation,
  createErrorResponse,
  getVerifiedUserFromRequestWithRateLimit,
} from "src/lib/api-helpers";
import { orm } from "src/lib/db";
import { privateRouteJson } from "src/lib/private-route-response";
import { crateSyncBodySchema } from "src/lib/validation/crate.schemas";
import { parseRequestBody } from "src/lib/validation/parseRequestBody";

export async function POST(request: NextRequest) {
  try {
    const verified = await getVerifiedUserFromRequestWithRateLimit(
      request,
      true,
    );
    if ("error" in verified) {
      return verified.error;
    }
    const { userId: userIdNum } = verified.user;

    const parsedBody = await parseRequestBody(request, crateSyncBodySchema);

    if ("error" in parsedBody) {
      return privateRouteJson({ error: parsedBody.error }, { status: 400 });
    }

    const { collectionInstanceIds, force } = parsedBody.data;

    const MIN_COLLECTION_SIZE = 10;
    if (collectionInstanceIds.length < MIN_COLLECTION_SIZE) {
      console.warn(
        `Sync blocked: Collection too small (${collectionInstanceIds.length} < ${MIN_COLLECTION_SIZE}). This may indicate incomplete data.`,
      );
      return privateRouteJson(
        {
          error: `Collection appears incomplete (${collectionInstanceIds.length} items). Sync requires at least ${MIN_COLLECTION_SIZE} items.`,
          collectionSize: collectionInstanceIds.length,
          minRequired: MIN_COLLECTION_SIZE,
        },
        { status: 400 },
      );
    }

    const MAX_RELEASES_TO_CHECK = 10000;
    const allCrateReleases = await orm.CrateReleases.where({
      userId: userIdNum,
    })
      .select("instanceId")
      .limit(MAX_RELEASES_TO_CHECK)
      .all();

    const normalizedCollectionIds = collectionInstanceIds.map((id) =>
      String(id),
    );
    const collectionInstanceIdSet = new Set(normalizedCollectionIds);

    const orphanedReleases = allCrateReleases.filter((r) => {
      const normalizedCrateId = String(r.instanceId);
      return !collectionInstanceIdSet.has(normalizedCrateId);
    });

    if (orphanedReleases.length === 0) {
      return privateRouteJson({
        success: true,
        removedCount: 0,
      });
    }

    const totalCrateReleases = allCrateReleases.length;
    const deletionPercentage =
      (orphanedReleases.length / totalCrateReleases) * 100;
    const MAX_DELETION_PERCENTAGE = 50;

    if (deletionPercentage > MAX_DELETION_PERCENTAGE && !force) {
      console.error(
        `SYNC BLOCKED: Attempting to delete ${orphanedReleases.length} of ${totalCrateReleases} releases (${deletionPercentage.toFixed(1)}%). This seems unsafe.`,
      );
      return privateRouteJson(
        {
          error: `Sync blocked: Would delete ${deletionPercentage.toFixed(1)}% of releases (${orphanedReleases.length} of ${totalCrateReleases}). This seems unsafe. Use force=true to override.`,
          orphanedCount: orphanedReleases.length,
          totalCount: totalCrateReleases,
          percentage: deletionPercentage,
          maxAllowed: MAX_DELETION_PERCENTAGE,
        },
        { status: 400 },
      );
    }

    const usedForceOverride =
      force && deletionPercentage > MAX_DELETION_PERCENTAGE;

    if (usedForceOverride) {
      console.warn(
        JSON.stringify({
          event: "crate_sync_force_override",
          userId: userIdNum,
          orphanedCount: orphanedReleases.length,
          totalCount: totalCrateReleases,
          deletionPercentage: Number(deletionPercentage.toFixed(1)),
        }),
      );
    }

    console.log(
      `[CRATE_SYNC] User ${userIdNum}: Removing ${orphanedReleases.length} orphaned releases (${deletionPercentage.toFixed(1)}% of ${totalCrateReleases} total)`,
    );

    const instanceIds = orphanedReleases.map((r) => r.instanceId);

    const BATCH_SIZE = 1000;
    let totalDeleted = 0;

    for (let i = 0; i < instanceIds.length; i += BATCH_SIZE) {
      const batch = instanceIds.slice(i, i + BATCH_SIZE);
      const deleted = await orm.CrateReleases.where({ userId: userIdNum })
        .where((r) => r.instanceId.in(batch))
        .deleteAndCount();
      totalDeleted += deleted;
    }

    auditDatabaseOperation(
      userIdNum,
      "CrateRelease",
      "bulk_delete",
      undefined,
      {
        removedCount: totalDeleted,
        operation: usedForceOverride ? "sync_force_override" : "sync",
        deletionPercentage: Number(deletionPercentage.toFixed(1)),
      },
    );

    return privateRouteJson({
      success: true,
      removedCount: totalDeleted,
    });
  } catch (error) {
    console.error("Error syncing crates:", error);
    return createErrorResponse(error);
  }
}
