import type { NextRequest } from "next/server";
import {
  createErrorResponse,
  getPaginationParams,
  getVerifiedUserFromRequestWithRateLimit,
} from "src/lib/api-helpers";
import {
  findCrateReleasesForLayout,
  findCrateSetMarkersForLayout,
} from "src/lib/crate-layout-query.server";
import {
  mapCrateReleaseRow,
  mapCrateSetMarkerRow,
} from "src/lib/crate-release-mapper";
import { countRows, orm } from "src/lib/db";
import { mapCrateRow } from "src/lib/db-mappers";
import { privateRouteJson } from "src/lib/private-route-response";
import { updateCrateBodySchema } from "src/lib/validation/crate.schemas";
import { parseRequestBody } from "src/lib/validation/parseRequestBody";

type CrateUpdateData = {
  name?: string;
  username?: string | null;
  is_default?: boolean;
  private?: boolean;
  packed_enabled?: boolean;
  notes?: string | null;
};

/**
 * Get a single crate with its releases
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const verified = await getVerifiedUserFromRequestWithRateLimit(request);
    if ("error" in verified) {
      return verified.error;
    }
    const { userId: userIdNum } = verified.user;

    const { id } = await params;
    const { skip, take, page, pageSize } = getPaginationParams(request);

    // Get the crate first (without releases to reduce memory usage)
    const crate = await orm.Crates.where({ userId: userIdNum, id }).first();

    if (!crate) {
      return privateRouteJson({ error: "Crate not found" }, { status: 404 });
    }

    const releaseWhere = {
      userId: userIdNum,
      crateId: id,
    };

    const [total, releases, markers] = await Promise.all([
      countRows(orm.CrateReleases.where(releaseWhere)),
      findCrateReleasesForLayout({
        where: releaseWhere,
        skip,
        take,
      }),
      findCrateSetMarkersForLayout({
        where: releaseWhere,
      }),
    ]);

    const mappedReleases = releases.map(mapCrateReleaseRow);
    const mappedMarkers = markers.map(mapCrateSetMarkerRow);

    return privateRouteJson({
      crate: mapCrateRow(crate),
      releases: mappedReleases,
      markers: mappedMarkers,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasNextPage: page < Math.ceil(total / pageSize),
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching crate:", error);
    return createErrorResponse(error);
  }
}

/**
 * Update a crate (name or default status)
 */
export async function PUT(
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
    const { userId: userIdNum, username } = verified.user;

    const { id } = await params;

    const parsedBody = await parseRequestBody(request, updateCrateBodySchema);
    if ("error" in parsedBody) {
      return privateRouteJson({ error: parsedBody.error }, { status: 400 });
    }

    const {
      name,
      is_default,
      private: privateField,
      packed_enabled: packedEnabled,
      notes,
    } = parsedBody.data;

    const existingCrate = await orm.Crates.where({ userId: userIdNum, id })
      .select("id", "name", "isDefault", "private", "packedEnabled")
      .first();

    if (!existingCrate) {
      return privateRouteJson({ error: "Crate not found" }, { status: 404 });
    }

    const updateData: CrateUpdateData = {};

    if (username) {
      updateData.username = username;
    }

    if (name !== undefined) {
      const duplicateCrate = await orm.Crates.where({ userId: userIdNum, name })
        .where((c) => c.id.neq(id))
        .select("id")
        .first();

      if (duplicateCrate) {
        return privateRouteJson(
          { error: "A crate with this name already exists" },
          { status: 409 },
        );
      }

      updateData.name = name;
    }

    if (is_default !== undefined) {
      if (is_default) {
        const unsetCount = await orm.Crates.where({
          userId: userIdNum,
          isDefault: true,
        })
          .where((c) => c.id.neq(id))
          .updateAndCount({ isDefault: false });

        if (unsetCount > 0) {
          const { auditDatabaseOperation } = await import(
            "src/lib/api-helpers"
          );
          auditDatabaseOperation(userIdNum, "Crate", "update", undefined, {
            action: "unset_default",
            affectedCount: unsetCount,
          });
        }
      }

      updateData.is_default = is_default;
    }

    if (privateField !== undefined) {
      updateData.private = privateField;

      if (privateField === false && username) {
        updateData.username = username;
      }
    }

    if (packedEnabled !== undefined) {
      updateData.packed_enabled = packedEnabled;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (Object.keys(updateData).length === 0) {
      return privateRouteJson(
        { error: "No updates provided" },
        { status: 400 },
      );
    }

    const updatedCrate = await orm.Crates.where({
      userId: userIdNum,
      id,
    }).update({
      ...(updateData.name !== undefined ? { name: updateData.name } : {}),
      ...(updateData.username !== undefined
        ? { username: updateData.username }
        : {}),
      ...(updateData.is_default !== undefined
        ? { isDefault: updateData.is_default }
        : {}),
      ...(updateData.private !== undefined
        ? { private: updateData.private }
        : {}),
      ...(updateData.packed_enabled !== undefined
        ? { packedEnabled: updateData.packed_enabled }
        : {}),
      ...(updateData.notes !== undefined ? { notes: updateData.notes } : {}),
    });

    const { auditDatabaseOperation } = await import("src/lib/api-helpers");
    auditDatabaseOperation(userIdNum, "Crate", "update", id, updateData);

    if (!updatedCrate) {
      return privateRouteJson({ error: "Crate not found" }, { status: 404 });
    }

    return privateRouteJson({ crate: mapCrateRow(updatedCrate) });
  } catch (error) {
    console.error("Error updating crate:", error);
    return createErrorResponse(error);
  }
}

/**
 * Delete a crate
 */
export async function DELETE(
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

    // Check if this is the only crate
    const crateCount = await countRows(orm.Crates.where({ userId: userIdNum }));

    if (crateCount <= 1) {
      return privateRouteJson(
        { error: "Cannot delete the last remaining crate" },
        { status: 400 },
      );
    }

    // Get release count before deletion for audit
    const releaseCount = await countRows(
      orm.CrateReleases.where({ userId: userIdNum, crateId: id }),
    );

    // Verify crate exists and belongs to user, then delete (cascade will delete releases)
    await orm.Crates.where({ userId: userIdNum, id }).delete();

    // Audit log (sensitive operation)
    const { auditDatabaseOperation } = await import("src/lib/api-helpers");
    auditDatabaseOperation(userIdNum, "Crate", "delete", id, {
      releaseCount,
    });

    return privateRouteJson({ success: true });
  } catch (error) {
    console.error("Error deleting crate:", error);
    return createErrorResponse(error);
  }
}
