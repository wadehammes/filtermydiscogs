import { type NextRequest, NextResponse } from "next/server";
import {
  auditDatabaseOperation,
  checkRateLimitWithResponse,
  getUserIdFromRequest,
  sanitizeError,
} from "src/lib/api-helpers";
import { prisma } from "src/lib/db";

/**
 * Remove a release from a crate
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; releaseId: string }> },
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
      return NextResponse.json({ error: "Crate not found" }, { status: 404 });
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
        return NextResponse.json(
          { error: "Release not found in crate" },
          { status: 404 },
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing release from crate:", error);
    const sanitized = sanitizeError(error);
    return NextResponse.json(
      { error: sanitized.message },
      { status: sanitized.status },
    );
  }
}
