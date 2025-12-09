import { type NextRequest, NextResponse } from "next/server";
import { discogsOAuthService } from "src/services/discogs-oauth.service";

export async function GET(request: NextRequest) {
  try {
    // Construct callback URL from request
    const callbackUrl = new URL("/api/auth/callback", request.url).toString();

    // Get request token with the correct callback URL
    const requestTokens =
      await discogsOAuthService.getRequestToken(callbackUrl);

    // Store request tokens in session (we'll use cookies for now)
    const response = NextResponse.redirect(
      discogsOAuthService.getAuthorizationUrl(requestTokens.oauth_token),
    );

    // Store tokens in secure cookies
    response.cookies.set("oauth_token", requestTokens.oauth_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes
    });

    response.cookies.set(
      "oauth_token_secret",
      requestTokens.oauth_token_secret,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
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
