import type { NextRequest } from "next/server";
import { getVerifiedUserFromRequestWithRateLimit } from "src/lib/api-helpers";
import { prisma } from "src/lib/db";
import { privateRouteJson } from "src/lib/private-route-response";
import {
  defaultUserPreferences,
  isValidUserPreferencesPatch,
  mergeUserPreferences,
  parseUserPreferences,
} from "src/lib/user-preferences.server";
import type { UserPreferencesPatch } from "src/types/userPreferences.types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
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
}

export async function PATCH(request: NextRequest) {
  const verified = await getVerifiedUserFromRequestWithRateLimit(request, true);
  if ("error" in verified) {
    return verified.error;
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return privateRouteJson({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return privateRouteJson({ error: "Invalid request body" }, { status: 400 });
  }

  const patch = body as UserPreferencesPatch;
  const patchError = isValidUserPreferencesPatch(patch);

  if (patchError) {
    return privateRouteJson({ error: patchError }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { discogs_user_id: verified.user.userId },
    select: { preferences: true },
  });

  const current = existing
    ? parseUserPreferences(existing.preferences)
    : defaultUserPreferences();
  const preferences = mergeUserPreferences(current, patch);

  const updated = await prisma.user.upsert({
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
    select: { preferences: true },
  });

  return privateRouteJson({
    preferences: parseUserPreferences(updated.preferences),
  });
}
