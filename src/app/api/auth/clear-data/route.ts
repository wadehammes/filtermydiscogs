import { type NextRequest, NextResponse } from "next/server";
import { getVerifiedUserFromRequest } from "src/lib/auth-request";
import { prisma } from "src/lib/db";

export async function POST(request: NextRequest) {
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

  const verified = await getVerifiedUserFromRequest(request);
  if ("error" in verified) {
    return verified.error;
  }

  try {
    await prisma.crate.deleteMany({
      where: { user_id: verified.user.userId },
    });
  } catch (error) {
    console.error("Error clearing crate data for user:", error);
    return NextResponse.json(
      { error: "Failed to clear stored data" },
      { status: 500 },
    );
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set("discogs_username", "", clearDisplayCookieOptions);
  response.cookies.set("discogs_user_id", "", clearCookieOptions);
  response.cookies.set("discogs_access_token", "", clearCookieOptions);
  response.cookies.set("discogs_access_token_secret", "", clearCookieOptions);
  response.cookies.set("oauth_token", "", clearCookieOptions);
  response.cookies.set("oauth_token_secret", "", clearCookieOptions);

  return response;
}
