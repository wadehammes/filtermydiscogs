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
    const { collectionInstanceIds } = body;

    if (!Array.isArray(collectionInstanceIds)) {
      return NextResponse.json(
        { error: "collectionInstanceIds must be an array" },
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

    // Find releases that are in crates but not in collection
    const collectionInstanceIdSet = new Set(collectionInstanceIds);
    const orphanedReleases = allCrateReleases.filter(
      (r: { instance_id: string }) =>
        !collectionInstanceIdSet.has(r.instance_id),
    );

    if (orphanedReleases.length === 0) {
      return NextResponse.json({
        success: true,
        removedCount: 0,
      });
    }

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
