import { type NextRequest, NextResponse } from "next/server";
import {
  checkRateLimitWithResponse,
  getPaginationParams,
  getUserIdFromRequest,
  sanitizeError,
} from "src/lib/api-helpers";
import { prisma } from "src/lib/db";
import type { DiscogsRelease } from "src/types";

/**
 * Get a single crate with its releases
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
        is_default: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!crate) {
      return NextResponse.json({ error: "Crate not found" }, { status: 404 });
    }

    // Get total count for pagination
    const total = await prisma.crateRelease.count({
      where: {
        user_id: userIdNum,
        crate_id: id,
      },
    });

    // Get releases separately with pagination to avoid loading all at once
    // This prevents memory issues with large crates
    const releases = await prisma.crateRelease.findMany({
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

    return NextResponse.json({
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
    const sanitized = sanitizeError(error);
    return NextResponse.json(
      { error: sanitized.message },
      { status: sanitized.status },
    );
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
    const userIdResult = getUserIdFromRequest(request);
    if ("error" in userIdResult) {
      return userIdResult.error;
    }
    const { userId: userIdNum } = userIdResult;

    // Check rate limit (write operation)
    const rateLimitError = checkRateLimitWithResponse(userIdNum, true);
    if (rateLimitError) {
      return rateLimitError;
    }

    const { id } = await params;

    const body = await request.json();
    const { name, is_default } = body;

    // Verify crate exists and belongs to user
    const existingCrate = await prisma.crate.findUnique({
      where: {
        user_id_id: {
          user_id: userIdNum,
          id,
        },
      },
      select: { id: true, name: true, is_default: true },
    });

    if (!existingCrate) {
      return NextResponse.json({ error: "Crate not found" }, { status: 404 });
    }

    const updateData: {
      name?: string;
      is_default?: boolean;
    } = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          { error: "Crate name is required" },
          { status: 400 },
        );
      }

      if (name.length > 100) {
        return NextResponse.json(
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
        return NextResponse.json(
          { error: "A crate with this name already exists" },
          { status: 409 },
        );
      }

      updateData.name = name.trim();
    }

    if (is_default !== undefined) {
      if (typeof is_default !== "boolean") {
        return NextResponse.json(
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

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
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

    return NextResponse.json({ crate: updatedCrate });
  } catch (error) {
    console.error("Error updating crate:", error);
    const sanitized = sanitizeError(error);
    return NextResponse.json(
      { error: sanitized.message },
      { status: sanitized.status },
    );
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
    const userIdResult = getUserIdFromRequest(request);
    if ("error" in userIdResult) {
      return userIdResult.error;
    }
    const { userId: userIdNum } = userIdResult;

    // Check rate limit (write operation)
    const rateLimitError = checkRateLimitWithResponse(userIdNum, true);
    if (rateLimitError) {
      return rateLimitError;
    }

    const { id } = await params;

    // Check if this is the only crate
    const crateCount = await prisma.crate.count({
      where: { user_id: userIdNum },
    });

    if (crateCount <= 1) {
      return NextResponse.json(
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting crate:", error);
    const sanitized = sanitizeError(error);
    return NextResponse.json(
      { error: sanitized.message },
      { status: sanitized.status },
    );
  }
}
