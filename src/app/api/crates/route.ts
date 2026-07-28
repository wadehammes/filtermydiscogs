import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { CRATE_NAME_MAX_LENGTH } from "src/constants/crate";
import {
  createErrorResponse,
  createPaginatedResponse,
  getPaginationParams,
  getVerifiedUserFromRequestWithRateLimit,
} from "src/lib/api-helpers";
import { prisma } from "src/lib/db";
import { privateRouteJson } from "src/lib/private-route-response";

export const dynamic = "force-dynamic";

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
    const total = await prisma.crate.count({
      where: { user_id: userIdNum },
    });

    // Get crates for the user with release counts (paginated)
    const crates = await prisma.crate.findMany({
      where: { user_id: userIdNum },
      orderBy: [{ is_default: "desc" }, { created_at: "asc" }],
      skip,
      take,
      select: {
        user_id: true,
        id: true,
        name: true,
        username: true,
        is_default: true,
        private: true,
        packed_enabled: true,
        notes: true,
        created_at: true,
        updated_at: true,
        _count: {
          select: {
            releases: true,
          },
        },
      },
    });

    // If no crates exist and we're on the first page, create a default crate
    if (crates.length === 0 && page === 1 && total === 0) {
      const defaultCrate = await prisma.crate.create({
        data: {
          user_id: userIdNum,
          id: randomUUID(),
          name: "My Crate",
          username: username || null,
          is_default: true,
        },
        select: {
          user_id: true,
          id: true,
          name: true,
          username: true,
          is_default: true,
          private: true,
          packed_enabled: true,
          notes: true,
          created_at: true,
          updated_at: true,
          _count: {
            select: {
              releases: true,
            },
          },
        },
      });

      // Map default crate to include release count
      const defaultCrateWithCount = {
        user_id: defaultCrate.user_id,
        id: defaultCrate.id,
        name: defaultCrate.name,
        username: defaultCrate.username,
        is_default: defaultCrate.is_default,
        private: defaultCrate.private,
        packed_enabled: defaultCrate.packed_enabled,
        notes: defaultCrate.notes,
        created_at: defaultCrate.created_at,
        updated_at: defaultCrate.updated_at,
        releaseCount: defaultCrate._count.releases,
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
    const cratesWithCounts = crates.map((crate) => ({
      user_id: crate.user_id,
      id: crate.id,
      name: crate.name,
      username: crate.username,
      is_default: crate.is_default,
      private: crate.private,
      packed_enabled: crate.packed_enabled,
      notes: crate.notes,
      created_at: crate.created_at,
      updated_at: crate.updated_at,
      releaseCount: crate._count.releases,
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

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return privateRouteJson(
        { error: "Crate name is required" },
        { status: 400 },
      );
    }

    if (name.length > CRATE_NAME_MAX_LENGTH) {
      return privateRouteJson(
        {
          error: `Crate name must be ${CRATE_NAME_MAX_LENGTH} characters or less`,
        },
        { status: 400 },
      );
    }

    // Check if a crate with this name already exists for this user
    const existingCrate = await prisma.crate.findFirst({
      where: {
        user_id: userIdNum,
        name: name.trim(),
      },
      select: { id: true },
    });

    if (existingCrate) {
      return privateRouteJson(
        { error: "A crate with this name already exists" },
        { status: 409 },
      );
    }

    const crateId = randomUUID();
    const newCrate = await prisma.crate.create({
      data: {
        user_id: userIdNum,
        id: crateId,
        name: name.trim(),
        username: username || null,
        is_default: false,
      },
    });

    // Audit log
    const { auditDatabaseOperation } = await import("src/lib/api-helpers");
    auditDatabaseOperation(userIdNum, "Crate", "create", crateId, {
      name: name.trim(),
    });

    return privateRouteJson({ crate: newCrate }, { status: 201 });
  } catch (error) {
    console.error("Error creating crate:", error);
    return createErrorResponse(error);
  }
}
