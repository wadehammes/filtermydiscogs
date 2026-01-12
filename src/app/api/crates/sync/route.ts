import { type NextRequest, NextResponse } from "next/server";
import {
  auditDatabaseOperation,
  checkRateLimitWithResponse,
  getUserIdFromRequest,
  sanitizeError,
} from "src/lib/api-helpers";
import { prisma } from "src/lib/db";

/**
 * Sync crates with collection - removes releases from crates that are no longer in the collection
 *
 * SAFETY: This endpoint can delete user data. It should only be called:
 * 1. When collection is fully loaded (validated client-side)
 * 2. With explicit user confirmation (handled client-side)
 * 3. With proper safeguards in place (minimum collection size, deletion percentage limits)
 */
export async function POST(request: NextRequest) {
  try {
    const userIdResult = getUserIdFromRequest(request);
    if ("error" in userIdResult) {
      return userIdResult.error;
    }
    const { userId: userIdNum } = userIdResult;

    // Check rate limit (write operation - bulk delete)
    const rateLimitError = checkRateLimitWithResponse(userIdNum, true);
    if (rateLimitError) {
      return rateLimitError;
    }

    const body = await request.json();
    const { collectionInstanceIds, force = false } = body;

    if (!Array.isArray(collectionInstanceIds)) {
      return NextResponse.json(
        { error: "collectionInstanceIds must be an array" },
        { status: 400 },
      );
    }

    // SAFETY CHECK: Require minimum collection size to prevent syncing with incomplete data
    const MIN_COLLECTION_SIZE = 10;
    if (collectionInstanceIds.length < MIN_COLLECTION_SIZE && !force) {
      console.warn(
        `Sync blocked: Collection too small (${collectionInstanceIds.length} < ${MIN_COLLECTION_SIZE}). This may indicate incomplete data.`,
      );
      return NextResponse.json(
        {
          error: `Collection appears incomplete (${collectionInstanceIds.length} items). Sync requires at least ${MIN_COLLECTION_SIZE} items or force=true.`,
          collectionSize: collectionInstanceIds.length,
          minRequired: MIN_COLLECTION_SIZE,
        },
        { status: 400 },
      );
    }

    // Get all releases in all crates for this user (limit to prevent memory issues)
    const MAX_RELEASES_TO_CHECK = 10000;
    const allCrateReleases = await prisma.crateRelease.findMany({
      where: { user_id: userIdNum },
      select: { instance_id: true },
      take: MAX_RELEASES_TO_CHECK,
    });

    // Normalize collection instance IDs to strings for comparison
    const normalizedCollectionIds = collectionInstanceIds.map((id) =>
      String(id),
    );
    const collectionInstanceIdSet = new Set(normalizedCollectionIds);

    // Find releases that are in crates but not in collection
    // Normalize crate instance_ids to strings for comparison
    const orphanedReleases = allCrateReleases.filter(
      (r: { instance_id: string }) => {
        const normalizedCrateId = String(r.instance_id);
        return !collectionInstanceIdSet.has(normalizedCrateId);
      },
    );

    if (orphanedReleases.length === 0) {
      return NextResponse.json({
        success: true,
        removedCount: 0,
      });
    }

    // SAFETY CHECK: Log warning if deleting a large percentage of releases
    const totalCrateReleases = allCrateReleases.length;
    const deletionPercentage =
      (orphanedReleases.length / totalCrateReleases) * 100;
    const MAX_DELETION_PERCENTAGE = 50; // Warn if deleting more than 50% of releases

    if (deletionPercentage > MAX_DELETION_PERCENTAGE && !force) {
      console.error(
        `SYNC BLOCKED: Attempting to delete ${orphanedReleases.length} of ${totalCrateReleases} releases (${deletionPercentage.toFixed(1)}%). This seems unsafe.`,
      );
      return NextResponse.json(
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

    // Log the sync operation for monitoring
    console.log(
      `[CRATE_SYNC] User ${userIdNum}: Removing ${orphanedReleases.length} orphaned releases (${deletionPercentage.toFixed(1)}% of ${totalCrateReleases} total)`,
    );

    // Remove orphaned releases from all crates (batch delete for performance)
    const instanceIds = orphanedReleases.map(
      (r: { instance_id: string }) => r.instance_id,
    );

    // Process in batches to avoid query size limits
    const BATCH_SIZE = 1000;
    let totalDeleted = 0;

    for (let i = 0; i < instanceIds.length; i += BATCH_SIZE) {
      const batch = instanceIds.slice(i, i + BATCH_SIZE);
      const result = await prisma.crateRelease.deleteMany({
        where: {
          user_id: userIdNum,
          instance_id: {
            in: batch,
          },
        },
      });
      totalDeleted += result.count;
    }

    // Audit log (sensitive bulk operation)
    auditDatabaseOperation(
      userIdNum,
      "CrateRelease",
      "bulk_delete",
      undefined,
      {
        removedCount: totalDeleted,
        operation: "sync",
      },
    );

    return NextResponse.json({
      success: true,
      removedCount: totalDeleted,
    });
  } catch (error) {
    console.error("Error syncing crates:", error);
    const sanitized = sanitizeError(error);
    return NextResponse.json(
      { error: sanitized.message },
      { status: sanitized.status },
    );
  }
}
