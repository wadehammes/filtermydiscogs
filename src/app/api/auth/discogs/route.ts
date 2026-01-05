import { type NextRequest, NextResponse } from "next/server";
import { discogsOAuthService } from "src/services/discogs-oauth.service";

export async function GET(request: NextRequest) {
  try {
    // Check if user already has valid access tokens
    const accessToken = request.cookies.get("discogs_access_token")?.value;
    const accessTokenSecret = request.cookies.get(
      "discogs_access_token_secret",
    )?.value;
    const username = request.cookies.get("discogs_username")?.value;

    // If tokens exist, verify they're still valid by checking identity
    if (accessToken && accessTokenSecret) {
      try {
        const identity = await discogsOAuthService.getIdentity(
          accessToken,
          accessTokenSecret,
        );

        // Tokens are valid - restore username and user_id if missing
        // This can happen if tokens were preserved from a previous session
        // or if the cookies expired but tokens are still valid
        const response = NextResponse.redirect(
          new URL("/releases?auth=success", request.url),
        );

        // Use secure: false for development, true for production
        const secureFlag = process.env.NODE_ENV === "production";

        const userId = request.cookies.get("discogs_user_id")?.value;

        // Restore username cookie if it's missing
        if (!username) {
          response.cookies.set("discogs_username", identity.username, {
            httpOnly: false,
            secure: secureFlag,
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 30, // 30 days
          });
        }

        // Restore user_id cookie if it's missing
        if (!userId) {
          response.cookies.set("discogs_user_id", identity.id.toString(), {
            httpOnly: false,
            secure: secureFlag,
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 30, // 30 days
          });
        }

        // Redirect to releases page - reuses existing tokens without requiring re-authorization
        // Note: Tokens are only preserved if user didn't explicitly log out
        return response;
      } catch (error) {
        // Tokens are invalid or expired, continue with OAuth flow
        console.log("Existing tokens invalid, starting new OAuth flow:", error);
      }
    }

    // No valid tokens found, start new OAuth flow
    // Construct callback URL from request
    const callbackUrl = new URL("/api/auth/callback", request.url).toString();

    // Get request token with the correct callback URL
    const requestTokens =
      await discogsOAuthService.getRequestToken(callbackUrl);

    // Store request tokens in session (we'll use cookies for now)
    const response = NextResponse.redirect(
      discogsOAuthService.getAuthorizationUrl(requestTokens.oauth_token),
    );

    // Use secure: false for development, true for production
    const secureFlag = process.env.NODE_ENV === "production";

    // Store tokens in secure cookies
    response.cookies.set("oauth_token", requestTokens.oauth_token, {
      httpOnly: true,
      secure: secureFlag,
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes
    });

    response.cookies.set(
      "oauth_token_secret",
      requestTokens.oauth_token_secret,
      {
        httpOnly: true,
        secure: secureFlag,
        sameSite: "lax",
        maxAge: 60 * 10, // 10 minutes
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
