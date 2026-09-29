import { type NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedDiscogsUser } from "src/lib/auth-request";
import { buildDiscogsProxyErrorPayload } from "src/lib/discogs-api-error";
import { rethrowNextInternalError } from "src/lib/rethrowNextInternalError";
import { updateCollectionNoteBodySchema } from "src/lib/validation/collection.schemas";
import { parseRequestBody } from "src/lib/validation/parseRequestBody";
import { discogsOAuthService } from "src/services/discogs-oauth.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string; fieldId: string }> },
) {
  try {
    const { instanceId, fieldId } = await params;
    const parsedBody = await parseRequestBody(
      request,
      updateCollectionNoteBodySchema,
    );

    if ("error" in parsedBody) {
      return NextResponse.json({ error: parsedBody.error }, { status: 400 });
    }

    const { username, releaseId, folderId, value } = parsedBody.data;

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

    const session = await requireAuthenticatedDiscogsUser(request, username);
    if ("error" in session) {
      return session.error;
    }

    await discogsOAuthService.updateCollectionInstanceField({
      username: session.user.username,
      folderId,
      releaseId,
      instanceId: Number.parseInt(instanceId, 10),
      fieldId: Number.parseInt(fieldId, 10),
      value,
      oauthToken: session.accessToken,
      oauthTokenSecret: session.accessTokenSecret,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    rethrowNextInternalError(error);
    console.error("updateCollectionNote error:", error);
    const { body, status, rateLimitInit } = buildDiscogsProxyErrorPayload({
      error,
      fallbackMessage: "Failed to update collection note",
    });

    return NextResponse.json(body, {
      status,
      ...(rateLimitInit ?? {}),
    });
  }
}
