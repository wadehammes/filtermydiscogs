import type { NextRequest } from "next/server";
import {
  primeVerifiedIdentityCache,
  syncIdentityCookies,
} from "src/lib/auth-request";
import { privateRouteRedirect } from "src/lib/private-route-response";
import { upsertDiscogsUser } from "src/lib/user.server";
import { discogsOAuthService } from "src/services/discogs-oauth.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const oauthToken = searchParams.get("oauth_token");
    const oauthVerifier = searchParams.get("oauth_verifier");

    if (!(oauthToken && oauthVerifier)) {
      return privateRouteRedirect(
        new URL("/?error=oauth_callback_invalid", request.url),
      );
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(oauthToken) || oauthToken.length < 20) {
      return privateRouteRedirect(
        new URL("/?error=oauth_callback_invalid", request.url),
      );
    }

    if (!/^[a-zA-Z0-9]+$/.test(oauthVerifier) || oauthVerifier.length < 10) {
      return privateRouteRedirect(
        new URL("/?error=oauth_callback_invalid", request.url),
      );
    }

    const storedOAuthToken = request.cookies.get("oauth_token")?.value;
    const storedOAuthTokenSecret =
      request.cookies.get("oauth_token_secret")?.value;

    if (!(storedOAuthToken && storedOAuthTokenSecret)) {
      return privateRouteRedirect(
        new URL("/?error=oauth_callback_invalid", request.url),
      );
    }

    if (oauthToken !== storedOAuthToken) {
      return privateRouteRedirect(
        new URL("/?error=oauth_callback_invalid", request.url),
      );
    }

    const accessTokens = await discogsOAuthService.getAccessToken(
      storedOAuthToken,
      storedOAuthTokenSecret,
      oauthVerifier,
    );

    const verifiedIdentity = await discogsOAuthService.getIdentity(
      accessTokens.oauth_token,
      accessTokens.oauth_token_secret,
    );

    primeVerifiedIdentityCache(
      accessTokens.oauth_token,
      accessTokens.oauth_token_secret,
      {
        userId: verifiedIdentity.id,
        username: verifiedIdentity.username,
      },
    );

    await upsertDiscogsUser({
      discogsUserId: verifiedIdentity.id,
      username: verifiedIdentity.username,
    });

    const response = privateRouteRedirect(
      new URL("/releases?auth=success", request.url),
    );

    const secureFlag = process.env.NODE_ENV === "production";
    const cookieMaxAge = 60 * 60 * 24 * 30;

    response.cookies.set("discogs_access_token", accessTokens.oauth_token, {
      httpOnly: true,
      secure: secureFlag,
      sameSite: "lax",
      path: "/",
      maxAge: cookieMaxAge,
    });

    response.cookies.set(
      "discogs_access_token_secret",
      accessTokens.oauth_token_secret,
      {
        httpOnly: true,
        secure: secureFlag,
        sameSite: "lax",
        path: "/",
        maxAge: cookieMaxAge,
      },
    );

    syncIdentityCookies(response, {
      userId: verifiedIdentity.id,
      username: verifiedIdentity.username,
    });

    response.cookies.delete("oauth_token");
    response.cookies.delete("oauth_token_secret");

    return response;
  } catch (error) {
    console.error("OAuth callback error:", error);
    return privateRouteRedirect(
      new URL("/?error=oauth_callback_failed", request.url),
    );
  }
}
