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

    const defaultCrate = await prisma.crate.findFirst({
      where: { user_id: userIdNum },
      orderBy: [{ is_default: "desc" }, { name: "asc" }],
      select: { id: true },
    });

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

    const existingRows = await prisma.crateRelease.findMany({
      where: {
        user_id: userIdNum,
        crate_id: defaultCrate.id,
        instance_id: {
          in: validatedReleases.map((release) => release.instance_id),
        },
      },
      select: { instance_id: true },
    });
    const existingInstanceIds = new Set(
      existingRows.map((row) => row.instance_id),
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

    await prisma.$transaction(async (tx) => {
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

        await tx.crateRelease.create({
          data: {
            user_id: userIdNum,
            crate_id: defaultCrate.id,
            instance_id: release.instance_id,
            release_data: normalizedRelease as unknown as Prisma.InputJsonValue,
            sort_order: sortOrder,
          },
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
