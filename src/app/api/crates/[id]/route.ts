import type { NextRequest } from "next/server";
import { CRATE_DETAIL_ALL_MAX } from "src/constants/crate";
import {
  createErrorResponse,
  getPaginationParams,
  getVerifiedUserFromRequestWithRateLimit,
} from "src/lib/api-helpers";
import {
  findCrateReleasesForLayout,
  findCrateSetMarkersForLayout,
} from "src/lib/crate-layout-query.server";
import {
  mapCrateReleaseRow,
  mapCrateSetMarkerRow,
} from "src/lib/crate-release-mapper";
import { prisma } from "src/lib/db";
import { privateRouteJson } from "src/lib/private-route-response";
import { updateCrateBodySchema } from "src/lib/validation/crate.schemas";
import { parseRequestBody } from "src/lib/validation/parseRequestBody";

type CrateUpdateData = {
  name?: string;
  username?: string | null;
  is_default?: boolean;
  private?: boolean;
  packed_enabled?: boolean;
  notes?: string | null;
};

/**
 * Get a single crate with its releases
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const verified = await getVerifiedUserFromRequestWithRateLimit(request);
    if ("error" in verified) {
      return verified.error;
    }
    const { userId: userIdNum } = verified.user;

    const { id } = await params;
    const { skip, take, page, pageSize, all } = getPaginationParams(request, {
      allMaxTake: CRATE_DETAIL_ALL_MAX,
    });

    // Get the crate first (without releases to reduce memory usage)
    const crate = await prisma.crate.findUnique({
      where: {
        user_id_id: {
          user_id: userIdNum,
          id: id,
        },
      },
      select: {
        user_id: true,
        id: true,
        name: true,
        username: true,
        is_default: true,
        private: true,
        packed_enabled: true,
        notes: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!crate) {
      return privateRouteJson({ error: "Crate not found" }, { status: 404 });
    }

    const releaseWhere = {
      user_id: userIdNum,
      crate_id: id,
    };

    const [total, releases, markers] = await Promise.all([
      prisma.crateRelease.count({
        where: releaseWhere,
      }),
      findCrateReleasesForLayout({
        where: releaseWhere,
        skip,
        take,
      }),
      findCrateSetMarkersForLayout({
        where: releaseWhere,
      }),
    ]);

    const mappedReleases = releases.map(mapCrateReleaseRow);
    const mappedMarkers = markers.map(mapCrateSetMarkerRow);

    return privateRouteJson({
      crate,
      releases: mappedReleases,
      markers: mappedMarkers,
      pagination: {
        page: all ? 1 : page,
        pageSize: all ? total : pageSize,
        total,
        totalPages: all ? 1 : Math.ceil(total / pageSize),
        hasNextPage: all ? false : page < Math.ceil(total / pageSize),
        hasPreviousPage: all ? false : page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching crate:", error);
    return createErrorResponse(error);
  }
}

/**
 * Update a crate (name or default status)
 */
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
    const { userId: userIdNum, username } = verified.user;

    const { id } = await params;

    const parsedBody = await parseRequestBody(request, updateCrateBodySchema);
    if ("error" in parsedBody) {
      return privateRouteJson({ error: parsedBody.error }, { status: 400 });
    }

    const {
      name,
      is_default,
      private: privateField,
      packed_enabled: packedEnabled,
      notes,
    } = parsedBody.data;

    const existingCrate = await prisma.crate.findUnique({
      where: {
        user_id_id: {
          user_id: userIdNum,
          id,
        },
      },
      select: {
        id: true,
        name: true,
        is_default: true,
        private: true,
        packed_enabled: true,
      },
    });

    if (!existingCrate) {
      return privateRouteJson({ error: "Crate not found" }, { status: 404 });
    }

    const updateData: CrateUpdateData = {};

    if (username) {
      updateData.username = username;
    }

    if (name !== undefined) {
      const duplicateCrate = await prisma.crate.findFirst({
        where: {
          user_id: userIdNum,
          name,
          NOT: {
            id,
          },
        },
        select: { id: true },
      });

      if (duplicateCrate) {
        return privateRouteJson(
          { error: "A crate with this name already exists" },
          { status: 409 },
        );
      }

      updateData.name = name;
    }

    if (is_default !== undefined) {
      if (is_default) {
        const updateResult = await prisma.crate.updateMany({
          where: {
            user_id: userIdNum,
            is_default: true,
            NOT: {
              id,
            },
          },
          data: {
            is_default: false,
          },
        });

        if (updateResult.count > 0) {
          const { auditDatabaseOperation } = await import(
            "src/lib/api-helpers"
          );
          auditDatabaseOperation(userIdNum, "Crate", "update", undefined, {
            action: "unset_default",
            affectedCount: updateResult.count,
          });
        }
      }

      updateData.is_default = is_default;
    }

    if (privateField !== undefined) {
      updateData.private = privateField;

      if (privateField === false && username) {
        updateData.username = username;
      }
    }

    if (packedEnabled !== undefined) {
      updateData.packed_enabled = packedEnabled;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (Object.keys(updateData).length === 0) {
      return privateRouteJson(
        { error: "No updates provided" },
        { status: 400 },
      );
    }

    const updatedCrate = await prisma.crate.update({
      where: {
        user_id_id: {
          user_id: userIdNum,
          id,
        },
      },
      data: updateData,
    });

    const { auditDatabaseOperation } = await import("src/lib/api-helpers");
    auditDatabaseOperation(userIdNum, "Crate", "update", id, updateData);

    return privateRouteJson({ crate: updatedCrate });
  } catch (error) {
    console.error("Error updating crate:", error);
    return createErrorResponse(error);
  }
}

/**
 * Delete a crate
 */
export async function DELETE(
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

    const { id } = await params;

    // Check if this is the only crate
    const crateCount = await prisma.crate.count({
      where: { user_id: userIdNum },
    });

    if (crateCount <= 1) {
      return privateRouteJson(
        { error: "Cannot delete the last remaining crate" },
        { status: 400 },
      );
    }

    // Get release count before deletion for audit
    const releaseCount = await prisma.crateRelease.count({
      where: {
        user_id: userIdNum,
        crate_id: id,
      },
    });

    // Verify crate exists and belongs to user, then delete (cascade will delete releases)
    await prisma.crate.delete({
      where: {
        user_id_id: {
          user_id: userIdNum,
          id,
        },
      },
    });

    // Audit log (sensitive operation)
    const { auditDatabaseOperation } = await import("src/lib/api-helpers");
    auditDatabaseOperation(userIdNum, "Crate", "delete", id, {
      releaseCount,
    });

    return privateRouteJson({ success: true });
  } catch (error) {
    console.error("Error deleting crate:", error);
    return createErrorResponse(error);
  }
}
