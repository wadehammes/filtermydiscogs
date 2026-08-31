import type { NextRequest } from "next/server";
import {
  auditDatabaseOperation,
  createErrorResponse,
  getVerifiedUserFromRequestWithRateLimit,
} from "src/lib/api-helpers";
import { getPrependCrateLayoutSortOrderForCrate } from "src/lib/crate-layout.server";
import { db, orm, toOrmJson } from "src/lib/db";
import { privateRouteJson } from "src/lib/private-route-response";
import { validateReleaseDataForStorage } from "src/lib/release-data-validation";
import { clearCrateFoundBodySchema } from "src/lib/validation/crate.schemas";
import { parseRequestBody } from "src/lib/validation/parseRequestBody";

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

    const parsedBody = await parseRequestBody(
      request,
      clearCrateFoundBodySchema,
    );

    if ("error" in parsedBody) {
      return privateRouteJson({ error: parsedBody.error }, { status: 400 });
    }

    const crate = await orm.Crates.where({ userId: userIdNum, id })
      .select("id")
      .first();

    if (!crate) {
      return privateRouteJson({ error: "Crate not found" }, { status: 404 });
    }

    const resultCount = await orm.CrateReleases.where({
      userId: userIdNum,
      crateId: id,
    })
      .where((r) => r.foundAt.isNotNull())
      .updateAndCount({ foundAt: null });

    auditDatabaseOperation(userIdNum, "CrateRelease", "update", id, {
      crate_id: id,
      clear_found: true,
      cleared_count: resultCount,
    });

    return privateRouteJson({
      success: true,
      cleared_count: resultCount,
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
    const crate = await orm.Crates.where({ userId: userIdNum, id })
      .select("id")
      .first();

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
    const existingRelease = await orm.CrateReleases.where({
      userId: userIdNum,
      crateId: id,
      instanceId,
    })
      .select("instanceId")
      .first();

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

    await db.transaction(async (tx) => {
      const sortOrder = await getPrependCrateLayoutSortOrderForCrate({
        userId: userIdNum,
        crateId: id,
        tx,
      });

      await tx.orm.public.CrateReleases.create({
        userId: userIdNum,
        crateId: id,
        instanceId,
        releaseData: toOrmJson(normalizedRelease),
        sortOrder,
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
