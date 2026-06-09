import { type NextRequest, NextResponse } from "next/server";
import {
  getVerifiedUserFromRequest,
  syncIdentityCookies,
} from "src/lib/auth-request";
import { discogsOAuthService } from "src/services/discogs-oauth.service";

function clearSessionCookies(response: NextResponse): void {
  const secureFlag = process.env.NODE_ENV === "production";

  const clearCookieOptions = {
    httpOnly: true,
    secure: secureFlag,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };

  const clearDisplayCookieOptions = {
    httpOnly: false,
    secure: secureFlag,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };

  response.cookies.set("discogs_username", "", clearDisplayCookieOptions);
  response.cookies.set("discogs_user_id", "", clearCookieOptions);
  response.cookies.set("discogs_access_token", "", clearCookieOptions);
  response.cookies.set("discogs_access_token_secret", "", clearCookieOptions);
  response.cookies.set("oauth_token", "", clearCookieOptions);
  response.cookies.set("oauth_token_secret", "", clearCookieOptions);
}

export async function GET(request: NextRequest) {
  try {
    const forceReauth = request.nextUrl.searchParams.get("force") === "1";

    const accessToken = request.cookies.get("discogs_access_token")?.value;
    const accessTokenSecret = request.cookies.get(
      "discogs_access_token_secret",
    )?.value;

    // Reuse existing tokens only when the user did not explicitly request re-auth.
    if (!forceReauth && accessToken && accessTokenSecret) {
      const verified = await getVerifiedUserFromRequest(request);

      if (!("error" in verified)) {
        const identity = verified.user;

        const response = NextResponse.redirect(
          new URL("/releases?auth=success", request.url),
        );

        syncIdentityCookies(response, identity);

        return response;
      }

      if (verified.error.status === 503) {
        return NextResponse.redirect(new URL("/releases", request.url));
      }

      console.log(
        "Existing tokens invalid, starting new OAuth flow:",
        verified.error.status,
      );
    }

    const callbackUrl = new URL("/api/auth/callback", request.url).toString();

    const requestTokens =
      await discogsOAuthService.getRequestToken(callbackUrl);

    const response = NextResponse.redirect(
      discogsOAuthService.getAuthorizationUrl(requestTokens.oauth_token),
    );

    clearSessionCookies(response);

    const secureFlag = process.env.NODE_ENV === "production";

    response.cookies.set("oauth_token", requestTokens.oauth_token, {
      httpOnly: true,
      secure: secureFlag,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    });

    response.cookies.set(
      "oauth_token_secret",
      requestTokens.oauth_token_secret,
      {
        httpOnly: true,
        secure: secureFlag,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 10,
      },
    );

    return response;
  } catch (error) {
    console.error("OAuth initiation error:", error);
    return NextResponse.redirect(
      new URL("/?error=oauth_init_failed", request.url),
    );
  }
}
