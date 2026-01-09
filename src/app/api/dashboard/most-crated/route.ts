import { type NextRequest, NextResponse } from "next/server";
import {
  checkRateLimitWithResponse,
  getUserIdFromRequest,
  sanitizeError,
} from "src/lib/api-helpers";
import { prisma } from "src/lib/db";
import type { DiscogsRelease } from "src/types";

interface MostCratedRelease {
  instance_id: string;
  crate_count: number;
  release: DiscogsRelease;
}

/**
 * Get releases that appear in multiple crates, sorted by crate count
 */
export async function GET(request: NextRequest) {
  try {
    const userIdResult = getUserIdFromRequest(request);
    if ("error" in userIdResult) {
      return userIdResult.error;
    }
    const { userId: userIdNum } = userIdResult;

    // Check rate limit
    const rateLimitError = checkRateLimitWithResponse(userIdNum, false);
    if (rateLimitError) {
      return rateLimitError;
    }

    // Get query params for limit
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "10", 10) || 10,
      50,
    );

    // Get all crate releases for the user
    const allCrateReleases = await prisma.crateRelease.findMany({
      where: {
        user_id: userIdNum,
      },
      select: {
        instance_id: true,
        crate_id: true,
        release_data: true,
      },
    });

    // Group by instance_id and count distinct crate_ids
    const crateCountMap = new Map<string, Set<string>>();
    const releaseDataMap = new Map<string, DiscogsRelease>();

    for (const crateRelease of allCrateReleases) {
      const { instance_id, crate_id, release_data } = crateRelease;

      // Skip if instance_id or crate_id is missing
      if (!(instance_id && crate_id)) {
        continue;
      }

      // Track unique crates per instance_id
      if (!crateCountMap.has(instance_id)) {
        crateCountMap.set(instance_id, new Set());
      }
      crateCountMap.get(instance_id)?.add(crate_id);

      // Store release data (will be overwritten if duplicate, but that's fine)
      // Only store if release_data is valid
      if (
        !releaseDataMap.has(instance_id) &&
        release_data &&
        typeof release_data === "object"
      ) {
        try {
          // Validate that release_data has the expected structure
          const release = release_data as DiscogsRelease;
          if (release.basic_information) {
            releaseDataMap.set(instance_id, release);
          }
        } catch {
          // Skip invalid release_data
        }
      }
    }

    // Filter to only releases in multiple crates and sort by count
    const mostCratedReleases: MostCratedRelease[] = Array.from(
      crateCountMap.entries(),
    )
      .map(([instance_id, crateIds]) => {
        const release = releaseDataMap.get(instance_id);
        return {
          instance_id,
          crate_count: crateIds.size,
          release,
        };
      })
      .filter(
        (item): item is MostCratedRelease =>
          item.crate_count > 1 &&
          item.release !== undefined &&
          item.release !== null &&
          item.release.basic_information !== undefined,
      )
      .sort((a, b) => b.crate_count - a.crate_count)
      .slice(0, limit);

    return NextResponse.json({ releases: mostCratedReleases });
  } catch (error) {
    console.error("Error fetching most crated releases:", error);

    // Log more details in development
    if (process.env.NODE_ENV === "development") {
      console.error("Most crated error details:", {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      });
    }

    const sanitized = sanitizeError(error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to fetch most crated releases";

    return NextResponse.json(
      { error: errorMessage },
      { status: sanitized.status || 500 },
    );
  }
}
