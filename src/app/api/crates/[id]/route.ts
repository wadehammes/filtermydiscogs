import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "src/lib/db";
import type { DiscogsRelease } from "src/types";

/**
 * Get a single crate with its releases
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = request.cookies.get("discogs_user_id")?.value;
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userIdNum = parseInt(userId, 10);
    if (Number.isNaN(userIdNum)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Get the crate with releases
    const crate = await prisma.crate.findUnique({
      where: {
        user_id_id: {
          user_id: userIdNum,
          id: id,
        },
      },
      include: {
        releases: {
          orderBy: {
            added_at: "desc",
          },
        },
      },
    });

    if (!crate) {
      return NextResponse.json({ error: "Crate not found" }, { status: 404 });
    }

    // Map releases and ensure instance_id is consistent
    const releases = crate.releases.map((r) => {
      const releaseData = r.release_data as DiscogsRelease;
      // Ensure instance_id matches the stored string format
      if (releaseData && typeof releaseData.instance_id !== "string") {
        releaseData.instance_id = String(releaseData.instance_id);
      }
      return releaseData;
    });

    return NextResponse.json({
      crate,
      releases,
    });
  } catch (error) {
    console.error("Error fetching crate:", error);
    return NextResponse.json(
      { error: "Failed to fetch crate" },
      { status: 500 },
    );
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
    const userId = request.cookies.get("discogs_user_id")?.value;
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userIdNum = parseInt(userId, 10);
    if (Number.isNaN(userIdNum)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const body = await request.json();
    const { name, is_default } = body;

    // Verify crate exists and belongs to user
    const existingCrate = await prisma.crate.findUnique({
      where: {
        user_id_id: {
          user_id: userIdNum,
          id,
        },
      },
    });

    if (!existingCrate) {
      return NextResponse.json({ error: "Crate not found" }, { status: 404 });
    }

    const updateData: {
      name?: string;
      is_default?: boolean;
    } = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
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

      // Check if another crate with this name exists
      const duplicateCrate = await prisma.crate.findFirst({
        where: {
          user_id: userIdNum,
          name: name.trim(),
          NOT: {
            id,
          },
        },
      });

      if (duplicateCrate) {
        return NextResponse.json(
          { error: "A crate with this name already exists" },
          { status: 409 },
        );
      }

      updateData.name = name.trim();
    }

    if (is_default !== undefined) {
      if (typeof is_default !== "boolean") {
        return NextResponse.json(
          { error: "is_default must be a boolean" },
          { status: 400 },
        );
      }

      if (is_default) {
        // If setting this as default, unset other defaults
        // This ensures only one default crate per user
        await prisma.crate.updateMany({
          where: {
            user_id: userIdNum,
            is_default: true,
            NOT: {
              id,
            },
          },
          data: {
            is_default: false,
          },
        });
      }

      updateData.is_default = is_default;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No updates provided" },
        { status: 400 },
      );
    }

    const updatedCrate = await prisma.crate.update({
      where: {
        user_id_id: {
          user_id: userIdNum,
          id,
        },
      },
      data: updateData,
    });

    return NextResponse.json({ crate: updatedCrate });
  } catch (error) {
    console.error("Error updating crate:", error);
    return NextResponse.json(
      { error: "Failed to update crate" },
      { status: 500 },
    );
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
    const userId = request.cookies.get("discogs_user_id")?.value;
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userIdNum = parseInt(userId, 10);
    if (Number.isNaN(userIdNum)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Check if this is the only crate
    const crateCount = await prisma.crate.count({
      where: { user_id: userIdNum },
    });

    if (crateCount <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the last remaining crate" },
        { status: 400 },
      );
    }

    // Verify crate exists and belongs to user, then delete (cascade will delete releases)
    await prisma.crate.delete({
      where: {
        user_id_id: {
          user_id: userIdNum,
          id,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting crate:", error);
    // Check if it was a not found error
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Crate not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete crate" },
      { status: 500 },
    );
  }
}
