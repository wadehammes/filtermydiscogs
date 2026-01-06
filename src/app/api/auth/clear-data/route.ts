import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "src/lib/db";

export async function POST(_request: NextRequest) {
  const response = NextResponse.json({ success: true });

  // Use secure: false for development, true for production
  const secureFlag = process.env.NODE_ENV === "production";

  // Clear all OAuth-related cookies by setting them to expire immediately
  const clearCookieOptions = {
    httpOnly: true,
    secure: secureFlag,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0, // Expire immediately
  };

  // Attempt to clear all crate data for this user from the database
  try {
    const userId = _request.cookies.get("discogs_user_id")?.value;

    if (userId) {
      const userIdNum = parseInt(userId, 10);
      if (!Number.isNaN(userIdNum)) {
        // This will cascade delete related crate releases via Prisma schema
        await prisma.crate.deleteMany({
          where: { user_id: userIdNum },
        });
      }
    }
  } catch (error) {
    // Log but do not fail the clear-data request if DB cleanup has an issue
    console.error("Error clearing crate data for user:", error);
  }

  // Clear all authentication cookies
  response.cookies.set("discogs_username", "", clearCookieOptions);
  response.cookies.set("discogs_user_id", "", clearCookieOptions);
  response.cookies.set("discogs_access_token", "", clearCookieOptions);
  response.cookies.set("discogs_access_token_secret", "", clearCookieOptions);
  response.cookies.set("oauth_token", "", clearCookieOptions);
  response.cookies.set("oauth_token_secret", "", clearCookieOptions);

  return response;
}
