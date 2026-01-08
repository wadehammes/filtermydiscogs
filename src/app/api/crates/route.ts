import { randomUUID } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import {
  checkRateLimitWithResponse,
  createPaginatedResponse,
  getPaginationParams,
  getUserIdFromRequest,
  sanitizeError,
} from "src/lib/api-helpers";
import { prisma } from "src/lib/db";

/**
 * Get all crates for the authenticated user
 * Automatically creates a default crate if none exists
 */
export async function GET(request: NextRequest) {
  try {
    const userIdResult = getUserIdFromRequest(request);
    if ("error" in userIdResult) {
      return userIdResult.error;
    }
    const { userId: userIdNum } = userIdResult;

    // Check rate limit
    const rateLimitError = checkRateLimitWithResponse(userIdNum, false);
    if (rateLimitError) {
      return rateLimitError;
    }

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
        is_default: true,
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
          is_default: true,
        },
        select: {
          user_id: true,
          id: true,
          name: true,
          is_default: true,
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
        is_default: defaultCrate.is_default,
        created_at: defaultCrate.created_at,
        updated_at: defaultCrate.updated_at,
        releaseCount: defaultCrate._count.releases,
      };

      return NextResponse.json({
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
      is_default: crate.is_default,
      created_at: crate.created_at,
      updated_at: crate.updated_at,
      releaseCount: crate._count.releases,
    }));

    return createPaginatedResponse(cratesWithCounts, total, page, pageSize);
  } catch (error) {
    console.error("Error fetching crates:", error);
    const sanitized = sanitizeError(error);
    return NextResponse.json(
      { error: sanitized.message },
      { status: sanitized.status },
    );
  }
}

/**
 * Create a new crate
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Crate name is required" },
        { status: 400 },
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: "Crate name must be 100 characters or less" },
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
      return NextResponse.json(
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
        is_default: false,
      },
    });

    // Audit log
    const { auditDatabaseOperation } = await import("src/lib/api-helpers");
    auditDatabaseOperation(userIdNum, "Crate", "create", crateId, {
      name: name.trim(),
    });

    return NextResponse.json({ crate: newCrate }, { status: 201 });
  } catch (error) {
    console.error("Error creating crate:", error);
    const sanitized = sanitizeError(error);
    return NextResponse.json(
      { error: sanitized.message },
      { status: sanitized.status },
    );
  }
}
