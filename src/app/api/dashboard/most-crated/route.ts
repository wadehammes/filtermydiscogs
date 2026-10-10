import { type NextRequest, NextResponse } from "next/server";
import {
  createErrorResponse,
  getVerifiedUserFromRequestWithRateLimit,
} from "src/lib/api-helpers";
import { fetchMostCratedReleasesForUser } from "src/lib/dashboard-most-crated.server";

export async function GET(request: NextRequest) {
  try {
    const verified = await getVerifiedUserFromRequestWithRateLimit(request);
    if ("error" in verified) {
      return verified.error;
    }
    const { userId: userIdNum } = verified.user;

    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "10", 10) || 10,
      50,
    );

    const releases = await fetchMostCratedReleasesForUser(userIdNum, limit);

    return NextResponse.json({ releases });
  } catch (error) {
    return createErrorResponse(error, { route: "/api/dashboard/most-crated" });
  }
}
