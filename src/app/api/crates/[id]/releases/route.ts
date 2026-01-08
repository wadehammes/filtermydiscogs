import { type NextRequest, NextResponse } from "next/server";
import {
  auditDatabaseOperation,
  checkRateLimitWithResponse,
  getUserIdFromRequest,
  sanitizeError,
} from "src/lib/api-helpers";
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

    const { id } = await params;

    // Verify crate exists and belongs to user
    const crate = await prisma.crate.findUnique({
      where: {
        user_id_id: {
          user_id: userIdNum,
          id,
        },
      },
      select: { id: true },
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
      select: { instance_id: true },
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

    // Audit log
    auditDatabaseOperation(userIdNum, "CrateRelease", "create", instanceId, {
      crate_id: id,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error adding release to crate:", error);
    const sanitized = sanitizeError(error);
    return NextResponse.json(
      { error: sanitized.message },
      { status: sanitized.status },
    );
  }
}
