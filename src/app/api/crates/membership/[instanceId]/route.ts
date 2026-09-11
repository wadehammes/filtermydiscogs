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
import { setReleaseCrateMembershipBodySchema } from "src/lib/validation/crate.schemas";
import { parseRequestBody } from "src/lib/validation/parseRequestBody";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string }> },
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
    const { instanceId } = await params;

    const rows = await orm.CrateReleases.where({
      userId: userIdNum,
      instanceId: String(instanceId),
    })
      .select("crateId")
      .all();

    return privateRouteJson({
      crateIds: rows.map((row) => row.crateId),
    });
  } catch (error) {
    console.error("Error fetching release crate membership:", error);
    return createErrorResponse(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string }> },
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
    const { instanceId: routeInstanceId } = await params;

    const parsedBody = await parseRequestBody(
      request,
      setReleaseCrateMembershipBodySchema,
    );

    if ("error" in parsedBody) {
      return privateRouteJson({ error: parsedBody.error }, { status: 400 });
    }

    const releaseValidation = validateReleaseDataForStorage(
      parsedBody.data.release,
    );

    if ("error" in releaseValidation) {
      return privateRouteJson(
        { error: releaseValidation.error },
        { status: 400 },
      );
    }

    const release = releaseValidation.release;
    const instanceId = release.instance_id;

    if (String(instanceId) !== String(routeInstanceId)) {
      return privateRouteJson(
        { error: "Release instance_id does not match route" },
        { status: 400 },
      );
    }

    const targetCrateIds = [...new Set(parsedBody.data.crateIds)];

    if (targetCrateIds.length > 0) {
      const ownedCrates = await orm.Crates.where({ userId: userIdNum })
        .where((crate) => crate.id.in(targetCrateIds))
        .select("id")
        .all();

      if (ownedCrates.length !== targetCrateIds.length) {
        return privateRouteJson(
          { error: "One or more crates not found" },
          { status: 404 },
        );
      }
    }

    const currentRows = await orm.CrateReleases.where({
      userId: userIdNum,
      instanceId,
    })
      .select("crateId")
      .all();

    const currentCrateIds = new Set(currentRows.map((row) => row.crateId));
    const targetCrateIdSet = new Set(targetCrateIds);
    const crateIdsToAdd = targetCrateIds.filter(
      (crateId) => !currentCrateIds.has(crateId),
    );
    const crateIdsToRemove = [...currentCrateIds].filter(
      (crateId) => !targetCrateIdSet.has(crateId),
    );

    const normalizedRelease = {
      ...release,
      instance_id: instanceId,
    };

    await db.transaction(async (tx) => {
      if (crateIdsToRemove.length > 0) {
        await tx.orm.public.CrateReleases.where({
          userId: userIdNum,
          instanceId,
        })
          .where((row) => row.crateId.in(crateIdsToRemove))
          .deleteAndCount();
      }

      for (const crateId of crateIdsToAdd) {
        const sortOrder = await getPrependCrateLayoutSortOrderForCrate({
          userId: userIdNum,
          crateId,
          tx,
        });

        await tx.orm.public.CrateReleases.create({
          userId: userIdNum,
          crateId,
          instanceId,
          releaseData: toOrmJson(normalizedRelease),
          sortOrder,
        });
      }
    });

    auditDatabaseOperation(userIdNum, "CrateRelease", "update", instanceId, {
      crate_ids: targetCrateIds,
      added: crateIdsToAdd,
      removed: crateIdsToRemove,
    });

    return privateRouteJson({
      success: true,
      crateIds: targetCrateIds,
    });
  } catch (error) {
    console.error("Error updating release crate membership:", error);
    return createErrorResponse(error);
  }
}
