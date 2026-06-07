import { type NextRequest, NextResponse } from "next/server";
import { discogsOAuthService } from "src/services/discogs-oauth.service";

export interface VerifiedDiscogsUser {
  userId: number;
  username: string;
}

export type VerifiedUserResult =
  | { user: VerifiedDiscogsUser; error?: never }
  | { user?: never; error: NextResponse };

/**
 * Resolve the authenticated Discogs user from httpOnly OAuth cookies.
 * Never trust discogs_user_id or discogs_username cookies for authorization.
 */
export async function getVerifiedUserFromRequest(
  request: NextRequest,
): Promise<VerifiedUserResult> {
  const accessToken = request.cookies.get("discogs_access_token")?.value;
  const accessTokenSecret = request.cookies.get(
    "discogs_access_token_secret",
  )?.value;

  if (!(accessToken && accessTokenSecret)) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  try {
    const identity = await discogsOAuthService.getIdentity(
      accessToken,
      accessTokenSecret,
    );

    return {
      user: {
        userId: identity.id,
        username: identity.username,
      },
    };
  } catch (error) {
    console.error("OAuth identity verification failed:", error);
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
}

/**
 * Optional identity lookup for routes that behave differently for signed-in viewers.
 */
export async function getOptionalVerifiedUserFromRequest(
  request: NextRequest,
): Promise<VerifiedDiscogsUser | null> {
  const result = await getVerifiedUserFromRequest(request);
  if ("error" in result) {
    return null;
  }

  return result.user;
}

export type AuthenticatedDiscogsSession =
  | {
      user: VerifiedDiscogsUser;
      accessToken: string;
      accessTokenSecret: string;
      error?: never;
    }
  | { error: NextResponse };

/**
 * Verify OAuth session and ensure the caller may act as the requested username.
 */
export async function requireAuthenticatedDiscogsUser(
  request: NextRequest,
  requestedUsername: string,
): Promise<AuthenticatedDiscogsSession> {
  const accessToken = request.cookies.get("discogs_access_token")?.value;
  const accessTokenSecret = request.cookies.get(
    "discogs_access_token_secret",
  )?.value;

  if (!(accessToken && accessTokenSecret)) {
    return {
      error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    };
  }

  const verified = await getVerifiedUserFromRequest(request);
  if ("error" in verified) {
    return { error: verified.error };
  }

  if (
    verified.user.username.toLowerCase() !== requestedUsername.toLowerCase()
  ) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 403 }),
    };
  }

  return {
    user: verified.user,
    accessToken,
    accessTokenSecret,
  };
}
