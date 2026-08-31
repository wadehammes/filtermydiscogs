import type { NextRequest } from "next/server";
import { getVerifiedUserFromRequestWithRateLimit } from "src/lib/api-helpers";
import { privateRouteJson } from "src/lib/private-route-response";
import { dismissSupportProjectToastForUser } from "src/lib/user.server";

export async function POST(request: NextRequest) {
  const verified = await getVerifiedUserFromRequestWithRateLimit(request, true);
  if ("error" in verified) {
    return verified.error;
  }

  await dismissSupportProjectToastForUser(verified.user.userId);

  return privateRouteJson({ success: true });
}
