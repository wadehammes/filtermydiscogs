import { type NextRequest, NextResponse } from "next/server";
import { type Prisma, prisma } from "src/lib/db";
import type { DiscogsRelease } from "src/types";

/**
 * Add a release to a crate
 */
export async function POST(
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

    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      console.error("Failed to parse request body:", error);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const release = body as DiscogsRelease;

    if (!release?.instance_id) {
      console.error("Invalid release data:", {
        hasRelease: !!release,
        hasInstanceId: !!release?.instance_id,
        releaseKeys: release ? Object.keys(release) : [],
      });
      return NextResponse.json(
        { error: "Invalid release data: missing instance_id" },
        { status: 400 },
      );
    }

    // Ensure instance_id is a string (Discogs API returns it as a number)
    const instanceId = String(release.instance_id);

    // Check if release is already in crate
    const existingRelease = await prisma.crateRelease.findUnique({
      where: {
        user_id_crate_id_instance_id: {
          user_id: userIdNum,
          crate_id: id,
          instance_id: instanceId,
        },
      },
    });

    if (existingRelease) {
      return NextResponse.json(
        { error: "Release already in crate" },
        { status: 409 },
      );
    }

    // Normalize release data - ensure instance_id is a string in the JSON
    const normalizedRelease = {
      ...release,
      instance_id: instanceId, // Use the string version
    };

    // Add release to crate
    await prisma.crateRelease.create({
      data: {
        user_id: userIdNum,
        crate_id: id,
        instance_id: instanceId,
        release_data: normalizedRelease as unknown as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error adding release to crate:", error);

    // Check if it was a unique constraint violation
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Release already in crate" },
        { status: 409 },
      );
    }

    // Provide more detailed error information
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "message" in error
          ? String(error.message)
          : "Failed to add release to crate";

    console.error("Detailed error:", {
      error,
      errorMessage,
      errorType: typeof error,
      errorString: String(error),
    });

    // Check for connection/resource errors
    if (
      errorMessage.includes("INSUFFICIENT RESOURCES") ||
      errorMessage.includes("P1001") ||
      errorMessage.includes("connection") ||
      errorMessage.includes("timeout")
    ) {
      return NextResponse.json(
        {
          error: "Database connection error",
          details: "Please try again in a moment",
        },
        { status: 503 },
      );
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
