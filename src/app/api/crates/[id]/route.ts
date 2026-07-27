import type { NextRequest } from "next/server";
import {
  createErrorResponse,
  getPaginationParams,
  getVerifiedUserFromRequestWithRateLimit,
} from "src/lib/api-helpers";
import { mapCrateReleaseRow } from "src/lib/crate-release-mapper";
import { prisma } from "src/lib/db";
import { privateRouteJson } from "src/lib/private-route-response";

export const dynamic = "force-dynamic";

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
        created_at: true,
        updated_at: true,
      },
    });

    if (!crate) {
      return privateRouteJson({ error: "Crate not found" }, { status: 404 });
    }

    const [total, releases] = await Promise.all([
      prisma.crateRelease.count({
        where: {
          user_id: userIdNum,
          crate_id: id,
        },
      }),
      prisma.crateRelease.findMany({
        where: {
          user_id: userIdNum,
          crate_id: id,
        },
        orderBy: {
          added_at: "desc",
        },
        skip,
        take,
        select: {
          release_data: true,
          found_at: true,
        },
      }),
    ]);

    const mappedReleases = releases.map(mapCrateReleaseRow);

    return privateRouteJson({
      crate,
      releases: mappedReleases,
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

    // Verify crate exists and belongs to user
    const existingCrate = await prisma.crate.findUnique({
      where: {
        user_id_id: {
          user_id: userIdNum,
          id,
        },
      },
      select: { id: true, name: true, is_default: true, private: true },
    });

    if (!existingCrate) {
      return privateRouteJson({ error: "Crate not found" }, { status: 404 });
    }

    const updateData: {
      name?: string;
      username?: string | null;
      is_default?: boolean;
      private?: boolean;
    } = {};

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

      if (name.length > 100) {
        return privateRouteJson(
          { error: "Crate name must be 100 characters or less" },
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

    // Check if private field was explicitly provided (can be true or false)
    if (privateField !== undefined && privateField !== null) {
      if (typeof privateField !== "boolean") {
        return privateRouteJson(
          { error: "private must be a boolean" },
          { status: 400 },
        );
      }

      updateData.private = privateField;

      // When making a crate public, ensure username is set
      if (privateField === false && username) {
        updateData.username = username;
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
