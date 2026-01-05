import { randomUUID } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "src/lib/db";

/**
 * Get all crates for the authenticated user
 * Automatically creates a default crate if none exists
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get("discogs_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userIdNum = parseInt(userId, 10);
    if (Number.isNaN(userIdNum)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Get all crates for the user with release counts
    const crates = await prisma.crate.findMany({
      where: { user_id: userIdNum },
      orderBy: [{ is_default: "desc" }, { created_at: "asc" }],
      include: {
        _count: {
          select: {
            releases: true,
          },
        },
      },
    });

    // If no crates exist, create a default crate
    if (crates.length === 0) {
      const defaultCrate = await prisma.crate.create({
        data: {
          user_id: userIdNum,
          id: randomUUID(),
          name: "My Crate",
          is_default: true,
        },
        include: {
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

      return NextResponse.json({ crates: [defaultCrateWithCount] });
    }

    // Map crates to include release count in a cleaner format
    const cratesWithCounts = crates.map((crate: (typeof crates)[0]) => ({
      user_id: crate.user_id,
      id: crate.id,
      name: crate.name,
      is_default: crate.is_default,
      created_at: crate.created_at,
      updated_at: crate.updated_at,
      releaseCount: crate._count.releases,
    }));

    return NextResponse.json({ crates: cratesWithCounts });
  } catch (error) {
    console.error("Error fetching crates:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Check if it's a Prisma initialization error
    if (
      errorMessage.includes("Prisma Client") ||
      errorMessage.includes("Cannot find module '@prisma/client'")
    ) {
      console.error(
        "Prisma Client not generated. Run: pnpm db:generate && pnpm db:push",
      );
      return NextResponse.json(
        {
          error: "Database not initialized",
          details:
            "Prisma Client not generated. Please run 'pnpm db:generate' and 'pnpm db:push'",
        },
        { status: 503 },
      );
    }

    // Check if it's a database connection error
    if (
      errorMessage.includes("Can't reach database") ||
      errorMessage.includes("P1001") ||
      errorMessage.includes("DATABASE_URL")
    ) {
      console.error(
        "Database connection error. Check DATABASE_URL environment variable.",
      );
      return NextResponse.json(
        {
          error: "Database connection failed",
          details: "Please check your DATABASE_URL environment variable",
        },
        { status: 503 },
      );
    }

    console.error("Error details:", { errorMessage, errorStack });
    return NextResponse.json(
      {
        error: "Failed to fetch crates",
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}

/**
 * Create a new crate
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get("discogs_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userIdNum = parseInt(userId, 10);
    if (Number.isNaN(userIdNum)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
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
    });

    if (existingCrate) {
      return NextResponse.json(
        { error: "A crate with this name already exists" },
        { status: 409 },
      );
    }

    const newCrate = await prisma.crate.create({
      data: {
        user_id: userIdNum,
        id: randomUUID(),
        name: name.trim(),
        is_default: false,
      },
    });

    return NextResponse.json({ crate: newCrate }, { status: 201 });
  } catch (error) {
    console.error("Error creating crate:", error);
    return NextResponse.json(
      { error: "Failed to create crate" },
      { status: 500 },
    );
  }
}
