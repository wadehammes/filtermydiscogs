import { type NextRequest, NextResponse } from "next/server";
import { isValidDiscogsUsername } from "src/lib/discogs-username";
import { discogsOAuthService } from "src/services/discogs-oauth.service";

interface UpdateCollectionNoteBody {
  username?: string;
  releaseId?: number;
  folderId?: number;
  value?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string; fieldId: string }> },
) {
  try {
    const { instanceId, fieldId } = await params;
    const body = (await request.json()) as UpdateCollectionNoteBody;
    const username = body.username;
    const releaseId = body.releaseId;
    const folderId = body.folderId ?? 0;
    const value = body.value;

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 },
      );
    }

    if (!isValidDiscogsUsername(username)) {
      return NextResponse.json(
        { error: "Invalid username format" },
        { status: 400 },
      );
    }

    if (!/^\d+$/.test(instanceId)) {
      return NextResponse.json(
        { error: "Invalid instance ID format" },
        { status: 400 },
      );
    }

    if (!/^\d+$/.test(fieldId)) {
      return NextResponse.json(
        { error: "Invalid field ID format" },
        { status: 400 },
      );
    }

    if (typeof releaseId !== "number" || releaseId <= 0) {
      return NextResponse.json(
        { error: "Valid release ID is required" },
        { status: 400 },
      );
    }

    if (typeof value !== "string") {
      return NextResponse.json(
        { error: "Note value must be a string" },
        { status: 400 },
      );
    }

    if (typeof folderId !== "number" || folderId < 0) {
      return NextResponse.json(
        { error: "Valid folder ID is required" },
        { status: 400 },
      );
    }

    const accessToken = request.cookies.get("discogs_access_token")?.value;
    const accessTokenSecret = request.cookies.get(
      "discogs_access_token_secret",
    )?.value;
    const storedUsername = request.cookies.get("discogs_username")?.value;

    if (!(accessToken && accessTokenSecret && storedUsername)) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (storedUsername.toLowerCase() !== username.toLowerCase()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await discogsOAuthService.updateCollectionInstanceField({
      username,
      folderId,
      releaseId,
      instanceId: Number.parseInt(instanceId, 10),
      fieldId: Number.parseInt(fieldId, 10),
      value,
      oauthToken: accessToken,
      oauthTokenSecret: accessTokenSecret,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("updateCollectionNote error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to update collection note";
    const upstreamStatus =
      error instanceof Error
        ? (error as Error & { status?: number }).status
        : undefined;

    let status =
      upstreamStatus ??
      (errorMessage.toLowerCase().includes("too many requests") ? 429 : 500);

    if (
      upstreamStatus !== undefined &&
      upstreamStatus >= 500 &&
      upstreamStatus < 600
    ) {
      status = 502;
    }

    const clientError =
      status === 429
        ? "Rate limit exceeded. Please try again in a moment."
        : errorMessage || "Failed to update collection note";

    return NextResponse.json(
      {
        error: clientError,
        ...(process.env.NODE_ENV === "development"
          ? { details: errorMessage }
          : {}),
      },
      { status },
    );
  }
}
