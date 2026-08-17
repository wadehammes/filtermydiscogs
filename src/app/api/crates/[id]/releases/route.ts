import type { NextRequest } from "next/server";
import {
  auditDatabaseOperation,
  createErrorResponse,
  getVerifiedUserFromRequestWithRateLimit,
} from "src/lib/api-helpers";
import { getPrependCrateLayoutSortOrderForCrate } from "src/lib/crate-layout.server";
import { type Prisma, prisma } from "src/lib/db";
import { privateRouteJson } from "src/lib/private-route-response";
import { validateReleaseDataForStorage } from "src/lib/release-data-validation";

/**
 * Clear packed status for all releases in a crate
 */
export async function PATCH(
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

    const clearFound = (body as Record<string, unknown>).clear_found;
    if (clearFound !== true) {
      return privateRouteJson(
        { error: "clear_found must be true" },
        { status: 400 },
      );
    }

    const crate = await prisma.crate.findUnique({
      where: {
        user_id_id: {
          user_id: userIdNum,
          id,
        },
      },
      select: { id: true },
    });

    if (!crate) {
      return privateRouteJson({ error: "Crate not found" }, { status: 404 });
    }

    const result = await prisma.crateRelease.updateMany({
      where: {
        user_id: userIdNum,
        crate_id: id,
        found_at: { not: null },
      },
      data: {
        found_at: null,
      },
    });

    auditDatabaseOperation(userIdNum, "CrateRelease", "update", id, {
      crate_id: id,
      clear_found: true,
      cleared_count: result.count,
    });

    return privateRouteJson({
      success: true,
      cleared_count: result.count,
    });
  } catch (error) {
    console.error("Error clearing crate release packed status:", error);
    return createErrorResponse(error);
  }
}

/**
 * Add a release to a crate
 */
export async function POST(
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

    // Verify crate exists and belongs to user
    const crate = await prisma.crate.findUnique({
      where: {
        user_id_id: {
          user_id: userIdNum,
          id,
        },
      },
      select: { id: true },
    });

    if (!crate) {
      return privateRouteJson({ error: "Crate not found" }, { status: 404 });
    }

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

    const validation = validateReleaseDataForStorage(body);
    if ("error" in validation) {
      return privateRouteJson({ error: validation.error }, { status: 400 });
    }

    const release = validation.release;
    const instanceId = release.instance_id;

    // Check if release is already in crate
    const existingRelease = await prisma.crateRelease.findUnique({
      where: {
        user_id_crate_id_instance_id: {
          user_id: userIdNum,
          crate_id: id,
          instance_id: instanceId,
        },
      },
      select: { instance_id: true },
    });

    if (existingRelease) {
      return privateRouteJson(
        { error: "Release already in crate" },
        { status: 409 },
      );
    }

    // Normalize release data - ensure instance_id is a string in the JSON
    const normalizedRelease = {
      ...release,
      instance_id: instanceId,
    };

    await prisma.$transaction(async (tx) => {
      const sortOrder = await getPrependCrateLayoutSortOrderForCrate({
        userId: userIdNum,
        crateId: id,
        tx,
      });

      await tx.crateRelease.create({
        data: {
          user_id: userIdNum,
          crate_id: id,
          instance_id: instanceId,
          release_data: normalizedRelease as unknown as Prisma.InputJsonValue,
          sort_order: sortOrder,
        },
      });
    });

    // Audit log
    auditDatabaseOperation(userIdNum, "CrateRelease", "create", instanceId, {
      crate_id: id,
    });

    return privateRouteJson({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error adding release to crate:", error);
    return createErrorResponse(error);
  }
}
