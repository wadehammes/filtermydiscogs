import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "src/lib/db";

/**
 * Sync crates with collection - removes releases from crates that are no longer in the collection
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get("discogs_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userIdNum = parseInt(userId, 10);
    if (Number.isNaN(userIdNum)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const body = await request.json();
    const { collectionInstanceIds } = body;

    if (!Array.isArray(collectionInstanceIds)) {
      return NextResponse.json(
        { error: "collectionInstanceIds must be an array" },
        { status: 400 },
      );
    }

    // Get all releases in all crates for this user
    const allCrateReleases = await prisma.crateRelease.findMany({
      where: { user_id: userIdNum },
      select: { instance_id: true },
    });

    // Find releases that are in crates but not in collection
    const collectionInstanceIdSet = new Set(collectionInstanceIds);
    const orphanedReleases = allCrateReleases.filter(
      (r) => !collectionInstanceIdSet.has(r.instance_id),
    );

    if (orphanedReleases.length === 0) {
      return NextResponse.json({
        success: true,
        removedCount: 0,
      });
    }

    // Remove orphaned releases from all crates
    const instanceIds = orphanedReleases.map((r) => r.instance_id);
    const result = await prisma.crateRelease.deleteMany({
      where: {
        user_id: userIdNum,
        instance_id: {
          in: instanceIds,
        },
      },
    });

    return NextResponse.json({
      success: true,
      removedCount: result.count,
    });
  } catch (error) {
    console.error("Error syncing crates:", error);
    return NextResponse.json(
      { error: "Failed to sync crates" },
      { status: 500 },
    );
  }
}
