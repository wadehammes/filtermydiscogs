import type { NextRequest } from "next/server";
import {
  auditDatabaseOperation,
  createErrorResponse,
  getVerifiedUserFromRequestWithRateLimit,
} from "src/lib/api-helpers";
import { orm } from "src/lib/db";
import { privateRouteJson } from "src/lib/private-route-response";

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

    const crate = await orm.Crates.where({ userId: userIdNum, id })
      .select("id")
      .first();

    if (!crate) {
      return privateRouteJson({ error: "Crate not found" }, { status: 404 });
    }

    const foundAt = found ? new Date() : null;

    const updated = await orm.CrateReleases.where({
      userId: userIdNum,
      crateId: id,
      instanceId: releaseId,
    }).update({ foundAt: foundAt as never });

    if (!updated) {
      return privateRouteJson(
        { error: "Release not found in crate" },
        { status: 404 },
      );
    }

    auditDatabaseOperation(userIdNum, "CrateRelease", "update", releaseId, {
      crate_id: id,
      found,
    });

    return privateRouteJson({
      success: true,
      found_at: updated.foundAt
        ? new Date(updated.foundAt as unknown as string).toISOString()
        : null,
    });
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
    const crate = await orm.Crates.where({ userId: userIdNum, id })
      .select("id")
      .first();

    if (!crate) {
      return privateRouteJson({ error: "Crate not found" }, { status: 404 });
    }

    // Remove release from crate
    const deleted = await orm.CrateReleases.where({
      userId: userIdNum,
      crateId: id,
      instanceId: releaseId,
    }).delete();

    if (!deleted) {
      return privateRouteJson(
        { error: "Release not found in crate" },
        { status: 404 },
      );
    }

    auditDatabaseOperation(userIdNum, "CrateRelease", "delete", releaseId, {
      crate_id: id,
    });

    return privateRouteJson({ success: true });
  } catch (error) {
    console.error("Error removing release from crate:", error);
    return createErrorResponse(error);
  }
}
