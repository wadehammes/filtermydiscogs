import type { NextRequest } from "next/server";
import { getVerifiedUserFromRequestWithRateLimit } from "src/lib/api-helpers";
import { orm, ormTimestamp, toOrmJson } from "src/lib/db";
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
  const verified = await getVerifiedUserFromRequestWithRateLimit(request);
  if ("error" in verified) {
    return verified.error;
  }

  const user = await orm.Users.where({
    discogsUserId: verified.user.userId,
  })
    .select("preferences")
    .first();

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

  const parsedBody = await parseRequestBody(
    request,
    userPreferencesPatchSchema,
    { invalidJsonMessage: "Invalid JSON body" },
  );
  if ("error" in parsedBody) {
    return privateRouteJson({ error: parsedBody.error }, { status: 400 });
  }

  const existing = await orm.Users.where({
    discogsUserId: verified.user.userId,
  })
    .select("preferences")
    .first();

  const current = existing
    ? parseUserPreferences(existing.preferences)
    : defaultUserPreferences();
  const preferences = mergeUserPreferences(
    current,
    parsedBody.data as UserPreferencesPatch,
  );

  const now = ormTimestamp(new Date());

  const updated = await orm.Users.upsert({
    create: {
      discogsUserId: verified.user.userId,
      username: verified.user.username,
      preferences: toOrmJson(preferences),
      updatedAt: now,
    },
    update: {
      username: verified.user.username,
      preferences: toOrmJson(preferences),
      updatedAt: now,
    },
    conflictOn: { discogsUserId: verified.user.userId },
  });

  return privateRouteJson({
    preferences: parseUserPreferences(updated.preferences),
  });
}
