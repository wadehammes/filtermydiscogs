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
import { crateLegacyMigrateBodySchema } from "src/lib/validation/crate.schemas";
import { parseRequestBody } from "src/lib/validation/parseRequestBody";
import type { DiscogsRelease } from "src/types";

export async function POST(request: NextRequest) {
  try {
    const verified = await getVerifiedUserFromRequestWithRateLimit(
      request,
      true,
    );
    if ("error" in verified) {
      return verified.error;
    }

    const { userId: userIdNum } = verified.user;
    const parsedBody = await parseRequestBody(
      request,
      crateLegacyMigrateBodySchema,
    );

    if ("error" in parsedBody) {
      return privateRouteJson({ error: parsedBody.error }, { status: 400 });
    }

    const defaultCrate =
      (await orm.Crates.where({ userId: userIdNum, isDefault: true })
        .select("id")
        .first()) ??
      (await orm.Crates.where({ userId: userIdNum })
        .orderBy((crate) => crate.name.asc())
        .select("id")
        .first());

    if (!defaultCrate) {
      return privateRouteJson({ error: "No crate found" }, { status: 404 });
    }

    const validatedReleases: DiscogsRelease[] = [];
    let skippedCount = 0;

    for (const releaseBody of parsedBody.data.releases) {
      const validation = validateReleaseDataForStorage(releaseBody);

      if ("error" in validation) {
        skippedCount += 1;
        continue;
      }

      validatedReleases.push(validation.release);
    }

    if (validatedReleases.length === 0) {
      return privateRouteJson({
        success: true,
        crateId: defaultCrate.id,
        importedCount: 0,
        skippedCount,
      });
    }

    const existingRows = await orm.CrateReleases.where({
      userId: userIdNum,
      crateId: defaultCrate.id,
    })
      .where((release) =>
        release.instanceId.in(
          validatedReleases.map((release) => release.instance_id),
        ),
      )
      .select("instanceId")
      .all();
    const existingInstanceIds = new Set(
      existingRows.map((row) => row.instanceId),
    );

    const releasesToImport = validatedReleases.filter(
      (release) => !existingInstanceIds.has(release.instance_id),
    );
    skippedCount += validatedReleases.length - releasesToImport.length;

    if (releasesToImport.length === 0) {
      return privateRouteJson({
        success: true,
        crateId: defaultCrate.id,
        importedCount: 0,
        skippedCount,
      });
    }

    await db.transaction(async (tx) => {
      for (const release of releasesToImport) {
        const normalizedRelease = {
          ...release,
          instance_id: release.instance_id,
        };
        const sortOrder = await getPrependCrateLayoutSortOrderForCrate({
          userId: userIdNum,
          crateId: defaultCrate.id,
          tx,
        });

        await tx.orm.public.CrateReleases.create({
          userId: userIdNum,
          crateId: defaultCrate.id,
          instanceId: release.instance_id,
          releaseData: toOrmJson(normalizedRelease),
          sortOrder,
        });
      }
    });

    auditDatabaseOperation(
      userIdNum,
      "CrateRelease",
      "create",
      defaultCrate.id,
      {
        legacy_migration: true,
        imported_count: releasesToImport.length,
        skipped_count: skippedCount,
      },
    );

    return privateRouteJson({
      success: true,
      crateId: defaultCrate.id,
      importedCount: releasesToImport.length,
      skippedCount,
    });
  } catch (error) {
    console.error("Error migrating legacy crate releases:", error);
    return createErrorResponse(error);
  }
}
