import { type NextRequest, NextResponse } from "next/server";
import { discogsOAuthService } from "src/services/discogs-oauth.service";

function isLocalhost(url: string) {
  return (
    url.startsWith("http://localhost") || url.startsWith("http://127.0.0.1")
  );
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const oauthToken = searchParams.get("oauth_token");
    const oauthVerifier = searchParams.get("oauth_verifier");

    // Get stored tokens from cookies
    const storedOAuthToken = request.cookies.get("oauth_token")?.value;
    const storedOAuthTokenSecret =
      request.cookies.get("oauth_token_secret")?.value;

    if (
      !(
        oauthToken &&
        oauthVerifier &&
        storedOAuthToken &&
        storedOAuthTokenSecret
      )
    ) {
      return NextResponse.redirect(
        new URL("/?error=oauth_callback_invalid", request.url),
      );
    }

    console.log("OAuth callback parameters:", {
      oauthToken,
      oauthVerifier,
      storedOAuthToken: storedOAuthToken ? "present" : "missing",
      storedOAuthTokenSecret: storedOAuthTokenSecret ? "present" : "missing",
    });

    // Exchange request token for access token
    const accessTokens = await discogsOAuthService.getAccessToken(
      storedOAuthToken,
      storedOAuthTokenSecret,
      oauthVerifier,
    );

    // Get user identity to verify authentication
    const identity = await discogsOAuthService.getIdentity(
      accessTokens.oauth_token,
      accessTokens.oauth_token_secret,
    );

    // Store access tokens securely
    const response = NextResponse.redirect(
      new URL("/releases?auth=success", request.url),
    );

    // Use secure: false for localhost, true for production
    const isLocal = isLocalhost(request.url);
    const secureFlag = !isLocal;

    // Store access tokens in secure cookies
    response.cookies.set("discogs_access_token", accessTokens.oauth_token, {
      httpOnly: true,
      secure: secureFlag,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    response.cookies.set(
      "discogs_access_token_secret",
      accessTokens.oauth_token_secret,
      {
        httpOnly: true,
        secure: secureFlag,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      },
    );

    // Store user info (not httpOnly so it can be read by client-side JS)
    response.cookies.set("discogs_username", identity.username, {
      httpOnly: false,
      secure: secureFlag,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // Clear request tokens
    response.cookies.delete("oauth_token");
    response.cookies.delete("oauth_token_secret");

    return response;
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/?error=oauth_callback_failed", request.url),
    );
  }
}
