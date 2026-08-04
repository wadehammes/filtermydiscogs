import type { NextRequest } from "next/server";
import {
  CRATE_NAME_MAX_LENGTH,
  CRATE_NOTES_MAX_LENGTH,
} from "src/constants/crate";
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

type CrateUpdateData = {
  name?: string;
  username?: string | null;
  is_default?: boolean;
  private?: boolean;
  packed_enabled?: boolean;
  notes?: string | null;
};

function assignOptionalBoolean(
  value: unknown,
  fieldName: string,
  updateData: CrateUpdateData,
  key: "private" | "packed_enabled",
): ReturnType<typeof privateRouteJson> | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "boolean") {
    return privateRouteJson(
      { error: `${fieldName} must be a boolean` },
      { status: 400 },
    );
  }

  updateData[key] = value;
  return null;
}

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
    const { skip, take, page, pageSize } = getPaginationParams(request);

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
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasNextPage: page < Math.ceil(total / pageSize),
        hasPreviousPage: page > 1,
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

    if (!body || typeof body !== "object") {
      return privateRouteJson(
        { error: "Request body must be an object" },
        { status: 400 },
      );
    }

    // Handle 'private' keyword by accessing it directly from body object
    // Use type assertion to safely access properties
    const bodyObj = body as Record<string, unknown>;
    const name = bodyObj.name;
    const is_default = bodyObj.is_default;
    // Access 'private' using bracket notation to avoid reserved keyword issues
    const privateField = bodyObj.private;
    const packedEnabled = bodyObj.packed_enabled;
    const notes = bodyObj.notes;

    // Verify crate exists and belongs to user
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

    // Always update username if available (to keep it current)
    if (username) {
      updateData.username = username;
    }

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return privateRouteJson(
          { error: "Crate name is required" },
          { status: 400 },
        );
      }

      if (name.length > CRATE_NAME_MAX_LENGTH) {
        return privateRouteJson(
          {
            error: `Crate name must be ${CRATE_NAME_MAX_LENGTH} characters or less`,
          },
          { status: 400 },
        );
      }

      // Check if another crate with this name exists
      const duplicateCrate = await prisma.crate.findFirst({
        where: {
          user_id: userIdNum,
          name: name.trim(),
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

      updateData.name = name.trim();
    }

    if (is_default !== undefined) {
      if (typeof is_default !== "boolean") {
        return privateRouteJson(
          { error: "is_default must be a boolean" },
          { status: 400 },
        );
      }

      if (is_default) {
        // If setting this as default, unset other defaults
        // This ensures only one default crate per user
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

        // Audit log for bulk update
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

    const privateError = assignOptionalBoolean(
      privateField,
      "private",
      updateData,
      "private",
    );
    if (privateError) {
      return privateError;
    }

    if (updateData.private === false && username) {
      updateData.username = username;
    }

    const packedEnabledError = assignOptionalBoolean(
      packedEnabled,
      "packed_enabled",
      updateData,
      "packed_enabled",
    );
    if (packedEnabledError) {
      return packedEnabledError;
    }

    if (notes !== undefined) {
      if (notes === null) {
        updateData.notes = null;
      } else if (typeof notes !== "string") {
        return privateRouteJson(
          { error: "notes must be a string or null" },
          { status: 400 },
        );
      } else {
        const trimmedNotes = notes.trim();
        if (trimmedNotes.length > CRATE_NOTES_MAX_LENGTH) {
          return privateRouteJson(
            {
              error: `Crate notes must be ${CRATE_NOTES_MAX_LENGTH} characters or less`,
            },
            { status: 400 },
          );
        }
        updateData.notes = trimmedNotes.length === 0 ? null : trimmedNotes;
      }
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

    // Audit log
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
