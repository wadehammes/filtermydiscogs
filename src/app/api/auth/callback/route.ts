import { type NextRequest, NextResponse } from "next/server";
import { discogsOAuthService } from "src/services/discogs-oauth.service";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const oauthToken = searchParams.get("oauth_token");
    const oauthVerifier = searchParams.get("oauth_verifier");

    // Validate OAuth callback parameters
    if (!(oauthToken && oauthVerifier)) {
      return NextResponse.redirect(
        new URL("/?error=oauth_callback_invalid", request.url),
      );
    }

    // Validate token format (should be alphanumeric, typically 40+ chars)
    if (!/^[a-zA-Z0-9_-]+$/.test(oauthToken) || oauthToken.length < 20) {
      return NextResponse.redirect(
        new URL("/?error=oauth_callback_invalid", request.url),
      );
    }

    if (!/^[a-zA-Z0-9]+$/.test(oauthVerifier) || oauthVerifier.length < 10) {
      return NextResponse.redirect(
        new URL("/?error=oauth_callback_invalid", request.url),
      );
    }

    // Get stored tokens from cookies
    const storedOAuthToken = request.cookies.get("oauth_token")?.value;
    const storedOAuthTokenSecret =
      request.cookies.get("oauth_token_secret")?.value;

    if (!(storedOAuthToken && storedOAuthTokenSecret)) {
      return NextResponse.redirect(
        new URL("/?error=oauth_callback_invalid", request.url),
      );
    }

    // Exchange request token for access token
    const accessTokens = await discogsOAuthService.getAccessToken(
      storedOAuthToken,
      storedOAuthTokenSecret,
      oauthVerifier,
    );

    // Get user identity to verify authentication
    const verifiedIdentity = await discogsOAuthService.getIdentity(
      accessTokens.oauth_token,
      accessTokens.oauth_token_secret,
    );

    // Store access tokens securely
    const response = NextResponse.redirect(
      new URL("/releases?auth=success", request.url),
    );

    // Use secure: false for development, true for production
    const secureFlag = process.env.NODE_ENV === "production";

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
    response.cookies.set("discogs_username", verifiedIdentity.username, {
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
