import type { NextRequest } from "next/server";
import {
  auditDatabaseOperation,
  createErrorResponse,
  getVerifiedUserFromRequestWithRateLimit,
} from "src/lib/api-helpers";
import {
  applyCrateLayoutUpdate,
  buildCrateLayoutUpdate,
  parseCrateLayoutPutRequest,
} from "src/lib/crate-layout.server";
import {
  findCrateReleasesForLayout,
  findCrateSetMarkersForLayout,
  hasCrateSetMarkerDelegate,
} from "src/lib/crate-layout-query.server";
import {
  mapCrateReleaseRow,
  mapCrateSetMarkerRow,
} from "src/lib/crate-release-mapper";
import { prisma } from "src/lib/db";
import { privateRouteJson } from "src/lib/private-route-response";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const verified = await getVerifiedUserFromRequestWithRateLimit(
      request,
      true,
    );
    if ("error" in verified) {
      return verified.error;
    }

    const { userId: userIdNum } = verified.user;
    const { id: crateId } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      console.error("Failed to parse request body:", error);
      return privateRouteJson(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const parsedRequest = parseCrateLayoutPutRequest(body);
    if ("error" in parsedRequest) {
      return privateRouteJson({ error: parsedRequest.error }, { status: 400 });
    }

    const crate = await prisma.crate.findUnique({
      where: {
        user_id_id: {
          user_id: userIdNum,
          id: crateId,
        },
      },
      select: { id: true },
    });

    if (!crate) {
      return privateRouteJson({ error: "Crate not found" }, { status: 404 });
    }

    if (!hasCrateSetMarkerDelegate()) {
      return privateRouteJson(
        {
          error:
            "Crate layout is unavailable until the database migration is applied. Run pnpm db:migrate and restart the dev server.",
        },
        { status: 503 },
      );
    }

    const layoutWhere = {
      user_id: userIdNum,
      crate_id: crateId,
    };

    const [crateReleases, existingMarkers] = await Promise.all([
      prisma.crateRelease.findMany({
        where: layoutWhere,
        select: {
          instance_id: true,
        },
      }),
      findCrateSetMarkersForLayout({
        where: layoutWhere,
      }),
    ]);

    const layoutUpdate = buildCrateLayoutUpdate({
      items: parsedRequest.data.items,
      crateInstanceIds: new Set(crateReleases.map((row) => row.instance_id)),
      existingMarkerIds: new Set(existingMarkers.map((row) => row.id)),
    });

    if ("error" in layoutUpdate) {
      return privateRouteJson({ error: layoutUpdate.error }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await applyCrateLayoutUpdate({
        tx,
        userId: userIdNum,
        crateId,
        update: layoutUpdate.data,
      });
    });

    const [releases, markers] = await Promise.all([
      findCrateReleasesForLayout({
        where: layoutWhere,
      }),
      findCrateSetMarkersForLayout({
        where: layoutWhere,
      }),
    ]);

    auditDatabaseOperation(userIdNum, "Crate", "update", crateId, {
      layout_item_count: parsedRequest.data.items.length,
      marker_count: markers.length,
    });

    return privateRouteJson({
      success: true,
      releases: releases.map(mapCrateReleaseRow),
      markers: markers.map(mapCrateSetMarkerRow),
    });
  } catch (error) {
    console.error("Error updating crate layout:", error);
    return createErrorResponse(error);
  }
}
