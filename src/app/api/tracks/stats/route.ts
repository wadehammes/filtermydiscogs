import type { NextRequest } from "next/server";
import { getVerifiedUserFromRequestWithRateLimit } from "src/lib/api-helpers";
import { privateRouteJson } from "src/lib/private-route-response";
import { fetchUserTrackStats } from "src/lib/user-track.server";
import { userTrackStatsQuerySchema } from "src/lib/validation/userTrack.schemas";

export const GET = async (request: NextRequest) => {
  const verified = await getVerifiedUserFromRequestWithRateLimit(request, true);

  if ("error" in verified) {
    return verified.error;
  }

  const url = new URL(request.url);
  const parsed = userTrackStatsQuerySchema.safeParse({
    keys: url.searchParams.get("keys") ?? "",
  });

  if (!parsed.success) {
    return privateRouteJson(
      { error: "Invalid query", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const stats = await fetchUserTrackStats(
    verified.user.userId,
    parsed.data.keys,
  );

  return privateRouteJson({ stats });
};
