import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import {
  createErrorResponse,
  createPaginatedResponse,
  getPaginationParams,
  getVerifiedUserFromRequestWithRateLimit,
} from "src/lib/api-helpers";
import { fetchCratePreviewThumbs } from "src/lib/crate-preview.server";
import { countRows, orm } from "src/lib/db";
import { mapCrateRow } from "src/lib/db-mappers";
import { privateRouteJson } from "src/lib/private-route-response";
import { createCrateBodySchema } from "src/lib/validation/crate.schemas";
import { parseRequestBody } from "src/lib/validation/parseRequestBody";

/**
 * Get all crates for the authenticated user
 * Automatically creates a default crate if none exists
 */
export async function GET(request: NextRequest) {
  try {
    const verified = await getVerifiedUserFromRequestWithRateLimit(request);
    if ("error" in verified) {
      return verified.error;
    }
    const { userId: userIdNum, username } = verified.user;

    const { skip, take, page, pageSize } = getPaginationParams(request);

    // Get total count for pagination
    const total = await countRows(orm.Crates.where({ userId: userIdNum }));

    // Get crates for the user with release counts (paginated)
    const crates = await orm.Crates.where({ userId: userIdNum })
      .orderBy((c) => c.createdAt.asc())
      .offset(skip)
      .limit(take)
      .include("crateReleases", (r) => r.count())
      .all();

    // If no crates exist and we're on the first page, create a default crate
    if (crates.length === 0 && page === 1 && total === 0) {
      const defaultCrate = await orm.Crates.create({
        userId: userIdNum,
        id: randomUUID(),
        name: "My Crate",
        username: username || null,
        isDefault: true,
      });

      const defaultCrateWithCount = {
        ...mapCrateRow(defaultCrate),
        releaseCount: 0,
        previewThumbs: [],
      };

      return privateRouteJson({
        data: [defaultCrateWithCount],
        pagination: {
          page: 1,
          pageSize: 1,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });
    }

    // Map crates to include release count in a cleaner format
    const previewThumbsByCrateId = await fetchCratePreviewThumbs({
      userId: userIdNum,
      crateIds: crates.map((crate) => crate.id),
    });

    const cratesWithCounts = crates.map((crate) => ({
      ...mapCrateRow(crate),
      releaseCount: crate.crateReleases as number,
      previewThumbs: previewThumbsByCrateId.get(crate.id) ?? [],
    }));

    return createPaginatedResponse(cratesWithCounts, total, page, pageSize);
  } catch (error) {
    console.error("Error fetching crates:", error);
    return createErrorResponse(error);
  }
}

/**
 * Create a new crate
 */
export async function POST(request: NextRequest) {
  try {
    const verified = await getVerifiedUserFromRequestWithRateLimit(
      request,
      true,
    );
    if ("error" in verified) {
      return verified.error;
    }
    const { userId: userIdNum, username } = verified.user;

    const parsedBody = await parseRequestBody(request, createCrateBodySchema);
    if ("error" in parsedBody) {
      return privateRouteJson({ error: parsedBody.error }, { status: 400 });
    }

    const { name } = parsedBody.data;

    // Check if a crate with this name already exists for this user
    const existingCrate = await orm.Crates.where({
      userId: userIdNum,
      name,
    })
      .select("id")
      .first();

    if (existingCrate) {
      return privateRouteJson(
        { error: "A crate with this name already exists" },
        { status: 409 },
      );
    }

    const crateId = randomUUID();
    const newCrate = await orm.Crates.create({
      userId: userIdNum,
      id: crateId,
      name,
      username: username || null,
      isDefault: false,
    });

    // Audit log
    const { auditDatabaseOperation } = await import("src/lib/api-helpers");
    auditDatabaseOperation(userIdNum, "Crate", "create", crateId, {
      name,
    });

    return privateRouteJson({ crate: mapCrateRow(newCrate) }, { status: 201 });
  } catch (error) {
    console.error("Error creating crate:", error);
    return createErrorResponse(error);
  }
}
