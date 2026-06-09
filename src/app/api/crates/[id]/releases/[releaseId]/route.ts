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
