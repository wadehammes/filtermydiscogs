import type { NextRequest } from "next/server";
import {
  auditDatabaseOperation,
  createErrorResponse,
  getVerifiedUserFromRequestWithRateLimit,
} from "src/lib/api-helpers";
import {
  computeCrateSyncDeletionPercentage,
  deleteCrateReleasesByInstanceIds,
  fetchCrateSyncOrphanState,
} from "src/lib/crate-sync.server";
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
          blockedReason: "collection_too_small",
          collectionSize: collectionInstanceIds.length,
          minRequired: MIN_COLLECTION_SIZE,
        },
        { status: 400 },
      );
    }

    const collectionInstanceIdSet = new Set(
      collectionInstanceIds.map((id) => String(id)),
    );

    const { totalRowCount, orphanedRowCount, orphanedInstanceIds } =
      await fetchCrateSyncOrphanState(userIdNum, collectionInstanceIdSet);

    if (orphanedRowCount === 0) {
      return privateRouteJson({
        success: true,
        removedCount: 0,
      });
    }

    const deletionPercentage = computeCrateSyncDeletionPercentage({
      totalRowCount,
      orphanedRowCount,
    });
    const deletionPercentageLabel = Number(deletionPercentage.toFixed(1));
    const MAX_DELETION_PERCENTAGE = 50;

    if (deletionPercentage > MAX_DELETION_PERCENTAGE && !force) {
      console.error(
        `SYNC BLOCKED: Attempting to delete ${orphanedRowCount} of ${totalRowCount} releases (${deletionPercentageLabel}%). This seems unsafe.`,
      );
      return privateRouteJson(
        {
          error: `Sync blocked: Would delete ${deletionPercentageLabel}% of releases (${orphanedRowCount} of ${totalRowCount}). This seems unsafe. Use force=true to override.`,
          blockedReason: "deletion_cap_blocked",
          orphanedCount: orphanedRowCount,
          totalCount: totalRowCount,
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
          orphanedCount: orphanedRowCount,
          totalCount: totalRowCount,
          deletionPercentage: deletionPercentageLabel,
        }),
      );
    }

    console.log(
      `[CRATE_SYNC] User ${userIdNum}: Removing ${orphanedRowCount} orphaned releases (${deletionPercentageLabel}% of ${totalRowCount} total)`,
    );

    const totalDeleted = await deleteCrateReleasesByInstanceIds(
      userIdNum,
      orphanedInstanceIds,
    );

    auditDatabaseOperation(
      userIdNum,
      "CrateRelease",
      "bulk_delete",
      undefined,
      {
        removedCount: totalDeleted,
        operation: usedForceOverride ? "sync_force_override" : "sync",
        deletionPercentage: deletionPercentageLabel,
      },
    );

    return privateRouteJson({
      success: true,
      removedCount: totalDeleted,
    });
  } catch (error) {
    return createErrorResponse(error, { route: "/api/crates/sync" });
  }
}
