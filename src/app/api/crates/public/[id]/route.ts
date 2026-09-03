import { type NextRequest, NextResponse } from "next/server";
import { CRATE_DETAIL_ALL_MAX } from "src/constants/crate";
import {
  getPaginationParams,
  rethrowNextInternalError,
  sanitizeError,
} from "src/lib/api-helpers";
import { getOptionalVerifiedUserFromRequest } from "src/lib/auth-request";
import { isValidCrateId } from "src/lib/crate-id";
import { findCrateReleasesForLayout } from "src/lib/crate-layout-query.server";
import { prisma } from "src/lib/db";
import {
  getIpRateLimitResponse,
  PUBLIC_CRATE_RATE_LIMIT_CONFIG,
} from "src/lib/ip-rate-limit";
import { findPublicCrateById } from "src/lib/public-crate-query.server";
import { toPublicReleaseSnapshot } from "src/lib/release-data-validation";
import type { DiscogsRelease } from "src/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rateLimitResponse = getIpRateLimitResponse(
    request,
    PUBLIC_CRATE_RATE_LIMIT_CONFIG,
  );

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { id } = await params;

    if (!isValidCrateId(id)) {
      return NextResponse.json({ error: "Invalid crate id" }, { status: 400 });
    }

    const { skip, take, page, pageSize, all } = getPaginationParams(request, {
      allMaxTake: CRATE_DETAIL_ALL_MAX,
    });

    const crate = await findPublicCrateById(id);

    if (!crate) {
      return NextResponse.json(
        { error: "Crate not found or is private" },
        { status: 404 },
      );
    }

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

    const total = await prisma.crateRelease.count({
      where: {
        user_id: crate.user_id,
        crate_id: id,
      },
    });

    const releases = await findCrateReleasesForLayout({
      where: {
        user_id: crate.user_id,
        crate_id: id,
      },
      skip,
      take,
    });

    const mappedReleases = releases
      .map((r: { release_data: unknown }) => r.release_data as DiscogsRelease)
      .filter(
        (releaseData) =>
          releaseData?.instance_id && releaseData.basic_information,
      )
      .map((releaseData) => toPublicReleaseSnapshot(releaseData));

    return NextResponse.json(
      {
        crate: crateWithUsername,
        releases: mappedReleases,
        pagination: {
          page: all ? 1 : page,
          pageSize: all ? total : pageSize,
          total,
          totalPages: all ? 1 : Math.ceil(total / pageSize),
          hasNextPage: all ? false : page < Math.ceil(total / pageSize),
          hasPreviousPage: all ? false : page > 1,
        },
      },
      {
        headers: {
          "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    rethrowNextInternalError(error);
    console.error("Error fetching public crate:", error);
    const sanitized = sanitizeError(error);
    return NextResponse.json(
      { error: sanitized.message },
      { status: sanitized.status },
    );
  }
}
