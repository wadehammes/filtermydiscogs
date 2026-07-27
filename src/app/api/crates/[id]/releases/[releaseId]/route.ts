import type { NextRequest } from "next/server";
import {
  auditDatabaseOperation,
  createErrorResponse,
  getVerifiedUserFromRequestWithRateLimit,
  sanitizeError,
} from "src/lib/api-helpers";
import { prisma } from "src/lib/db";
import { privateRouteJson } from "src/lib/private-route-response";

export const dynamic = "force-dynamic";

/**
 * Update packed status for a release in a crate
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; releaseId: string }> },
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

    const { id, releaseId } = await params;

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

    const found = (body as Record<string, unknown>).found;
    if (typeof found !== "boolean") {
      return privateRouteJson(
        { error: "found must be a boolean" },
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

    const foundAt = found ? new Date() : null;

    try {
      const updated = await prisma.crateRelease.update({
        where: {
          user_id_crate_id_instance_id: {
            user_id: userIdNum,
            crate_id: id,
            instance_id: releaseId,
          },
        },
        data: {
          found_at: foundAt,
        },
        select: {
          found_at: true,
        },
      });

      auditDatabaseOperation(userIdNum, "CrateRelease", "update", releaseId, {
        crate_id: id,
        found,
      });

      return privateRouteJson({
        success: true,
        found_at: updated.found_at?.toISOString() ?? null,
      });
    } catch (error) {
      const sanitized = sanitizeError(error);
      if (sanitized.code === "NOT_FOUND") {
        return privateRouteJson(
          { error: "Release not found in crate" },
          { status: 404 },
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Error updating crate release found status:", error);
    return createErrorResponse(error);
  }
}

/**
 * Remove a release from a crate
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; releaseId: string }> },
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

    const { id, releaseId } = await params;

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

    // Remove release from crate
    try {
      await prisma.crateRelease.delete({
        where: {
          user_id_crate_id_instance_id: {
            user_id: userIdNum,
            crate_id: id,
            instance_id: releaseId,
          },
        },
      });

      // Audit log
      auditDatabaseOperation(userIdNum, "CrateRelease", "delete", releaseId, {
        crate_id: id,
      });
    } catch (error) {
      // Check if it was a not found error
      const sanitized = sanitizeError(error);
      if (sanitized.code === "NOT_FOUND") {
        return privateRouteJson(
          { error: "Release not found in crate" },
          { status: 404 },
        );
      }
      throw error;
    }

    return privateRouteJson({ success: true });
  } catch (error) {
    console.error("Error removing release from crate:", error);
    return createErrorResponse(error);
  }
}
