import type { NextRequest } from "next/server";
import {
  auditDatabaseOperation,
  createErrorResponse,
  getVerifiedUserFromRequestWithRateLimit,
} from "src/lib/api-helpers";
import { getPrependCrateLayoutSortOrderForCrate } from "src/lib/crate-layout.server";
import { prisma } from "src/lib/db";
import { privateRouteJson } from "src/lib/private-route-response";
import { revalidatePublicCrateShareWhenPublic } from "src/lib/public-share-cache.server";
import { validateReleaseDataForStorage } from "src/lib/release-data-validation";
import { clearCrateFoundBodySchema } from "src/lib/validation/crate.schemas";
import { parseRequestBody } from "src/lib/validation/parseRequestBody";
import { toPrismaInputJsonValue } from "src/utils/toPrismaJsonValue";

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
    return createErrorResponse(error, { route: "/api/crates/[id]/releases" });
  }
}

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
    } catch (_error) {
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
          release_data: toPrismaInputJsonValue(normalizedRelease),
          sort_order: sortOrder,
        },
      });
    });

    auditDatabaseOperation(userIdNum, "CrateRelease", "create", instanceId, {
      crate_id: id,
    });

    await revalidatePublicCrateShareWhenPublic(id);

    return privateRouteJson({ success: true }, { status: 201 });
  } catch (error) {
    return createErrorResponse(error, { route: "/api/crates/[id]/releases" });
  }
}
