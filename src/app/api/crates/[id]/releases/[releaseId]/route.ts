import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "src/lib/db";

/**
 * Remove a release from a crate
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; releaseId: string }> },
) {
  try {
    const userId = request.cookies.get("discogs_user_id")?.value;
    const { id, releaseId } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userIdNum = parseInt(userId, 10);
    if (Number.isNaN(userIdNum)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Verify crate exists and belongs to user
    const crate = await prisma.crate.findUnique({
      where: {
        user_id_id: {
          user_id: userIdNum,
          id,
        },
      },
    });

    if (!crate) {
      return NextResponse.json({ error: "Crate not found" }, { status: 404 });
    }

    // Remove release from crate
    try {
      await prisma.crateRelease.delete({
        where: {
          user_id_crate_id_instance_id: {
            user_id: userIdNum,
            crate_id: id,
            instance_id: releaseId,
          },
        },
      });
    } catch (error) {
      // Check if it was a not found error
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "P2025"
      ) {
        return NextResponse.json(
          { error: "Release not found in crate" },
          { status: 404 },
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing release from crate:", error);
    return NextResponse.json(
      { error: "Failed to remove release from crate" },
      { status: 500 },
    );
  }
}
