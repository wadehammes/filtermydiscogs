import type { NextRequest } from "next/server";
import {
  createErrorResponse,
  getVerifiedUserFromRequestWithRateLimit,
} from "src/lib/api-helpers";
import { prisma } from "src/lib/db";
import { privateRouteJson } from "src/lib/private-route-response";
import {
  defaultUserPreferences,
  mergeUserPreferences,
  parseUserPreferences,
} from "src/lib/user-preferences.server";
import { parseRequestBody } from "src/lib/validation/parseRequestBody";
import { userPreferencesPatchSchema } from "src/lib/validation/userPreferences.schemas";
import type { UserPreferencesPatch } from "src/types/userPreferences.types";

export async function GET(request: NextRequest) {
  try {
    const verified = await getVerifiedUserFromRequestWithRateLimit(request);
    if ("error" in verified) {
      return verified.error;
    }

    const user = await prisma.user.findUnique({
      where: { discogs_user_id: verified.user.userId },
      select: { preferences: true },
    });

    const preferences = user
      ? parseUserPreferences(user.preferences)
      : defaultUserPreferences();

    return privateRouteJson({ preferences });
  } catch (error) {
    return createErrorResponse(error, { route: "/api/user/preferences" });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const verified = await getVerifiedUserFromRequestWithRateLimit(
      request,
      true,
    );
    if ("error" in verified) {
      return verified.error;
    }

    const parsedBody = await parseRequestBody(
      request,
      userPreferencesPatchSchema,
      { invalidJsonMessage: "Invalid JSON body" },
    );
    if ("error" in parsedBody) {
      return privateRouteJson({ error: parsedBody.error }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { discogs_user_id: verified.user.userId },
      select: { preferences: true },
    });

    const current = existing
      ? parseUserPreferences(existing.preferences)
      : defaultUserPreferences();
    const preferences = mergeUserPreferences(
      current,
      parsedBody.data as UserPreferencesPatch,
    );

    await prisma.user.upsert({
      where: { discogs_user_id: verified.user.userId },
      create: {
        discogs_user_id: verified.user.userId,
        username: verified.user.username,
        preferences,
      },
      update: {
        username: verified.user.username,
        preferences,
      },
    });

    return privateRouteJson({ preferences });
  } catch (error) {
    return createErrorResponse(error, { route: "/api/user/preferences" });
  }
}
