import { type NextRequest, NextResponse } from "next/server";
import { getPaginationParams, sanitizeError } from "src/lib/api-helpers";
import { getOptionalVerifiedUserFromRequest } from "src/lib/auth-request";
import { prisma } from "src/lib/db";
import type { DiscogsRelease } from "src/types";

/**
 * Get a public crate by ID (no authentication required)
 * Only returns crates where private === false
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { skip, take, page, pageSize } = getPaginationParams(request);

    // Get the crate - only return if it exists and is public
    const crate = await prisma.crate.findFirst({
      where: {
        id,
        private: false,
      },
      select: {
        user_id: true,
        id: true,
        name: true,
        username: true,
        is_default: true,
        private: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!crate) {
      return NextResponse.json(
        { error: "Crate not found or is private" },
        { status: 404 },
      );
    }

    // If username is missing, backfill when the verified owner is viewing their crate.
    const viewer = await getOptionalVerifiedUserFromRequest(request);
    const isOwner = viewer?.userId === crate.user_id;

    let finalUsername = crate.username;

    if (!finalUsername && isOwner && viewer?.username) {
      await prisma.crate.update({
        where: {
          user_id_id: {
            user_id: crate.user_id,
            id: crate.id,
          },
        },
        data: {
          username: viewer.username,
        },
      });
      finalUsername = viewer.username;
    }

    const crateWithUsername = {
      id: crate.id,
      name: crate.name,
      username: finalUsername,
      is_default: crate.is_default,
      private: crate.private,
      created_at: crate.created_at,
      updated_at: crate.updated_at,
    };

    // Get total count for pagination
    const total = await prisma.crateRelease.count({
      where: {
        user_id: crate.user_id,
        crate_id: id,
      },
    });

    // Get releases separately with pagination to avoid loading all at once
    const releases = await prisma.crateRelease.findMany({
      where: {
        user_id: crate.user_id,
        crate_id: id,
      },
      orderBy: {
        added_at: "desc",
      },
      skip,
      take,
      select: {
        release_data: true,
      },
    });

    // Map releases and ensure instance_id is consistent
    const mappedReleases = releases.map((r: { release_data: unknown }) => {
      const releaseData = r.release_data as DiscogsRelease;
      // Ensure instance_id matches the stored string format
      if (releaseData && typeof releaseData.instance_id !== "string") {
        releaseData.instance_id = String(releaseData.instance_id);
      }
      return releaseData;
    });

    return NextResponse.json(
      {
        crate: crateWithUsername,
        releases: mappedReleases,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
          hasNextPage: page < Math.ceil(total / pageSize),
          hasPreviousPage: page > 1,
        },
      },
      {
        headers: {
          "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    console.error("Error fetching public crate:", error);
    const sanitized = sanitizeError(error);
    return NextResponse.json(
      { error: sanitized.message },
      { status: sanitized.status },
    );
  }
}
