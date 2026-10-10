import { and, or } from "@prisma/orm-postgres/orm-client";
import { SUPPORT_PROJECT_TOAST_LOGIN_THRESHOLD } from "src/constants/supportProjectToast.constants";
import { USER_LAST_SEEN_TOUCH_INTERVAL_MS } from "src/constants/userEngagement.constants";
import { orm, ormTimestamp } from "src/lib/db";

type UpsertDiscogsUserInput = {
  discogsUserId: number;
  username: string;
};

export async function recordDiscogsLogin({
  discogsUserId,
  username,
}: UpsertDiscogsUserInput) {
  const now = ormTimestamp(new Date());
  const existingUser = await orm.Users.where({ discogsUserId })
    .select("loginCount", "supportToastDismissed")
    .first();

  if (!existingUser) {
    return orm.Users.create({
      discogsUserId,
      username,
      preferences: {},
      loginCount: 1,
      supportToastPending: false,
      lastSeenAt: now,
      updatedAt: now,
    });
  }

  const nextLoginCount = existingUser.loginCount + 1;
  const shouldPromptForSupport =
    nextLoginCount >= SUPPORT_PROJECT_TOAST_LOGIN_THRESHOLD &&
    !existingUser.supportToastDismissed;

  return orm.Users.where({ discogsUserId }).update({
    username,
    loginCount: nextLoginCount,
    lastSeenAt: now,
    updatedAt: now,
    ...(shouldPromptForSupport ? { supportToastPending: true } : {}),
  });
}

export async function touchUserLastSeen(discogsUserId: number): Promise<void> {
  const touchBefore = ormTimestamp(
    new Date(Date.now() - USER_LAST_SEEN_TOUCH_INTERVAL_MS),
  );

  await orm.Users.where((user) =>
    and(
      user.discogsUserId.eq(discogsUserId),
      or(user.lastSeenAt.isNull(), user.lastSeenAt.lt(touchBefore)),
    ),
  ).updateAndCount({
    lastSeenAt: ormTimestamp(new Date()),
    updatedAt: ormTimestamp(new Date()),
  });
}

export async function consumeSupportProjectToastPending(
  discogsUserId: number,
): Promise<boolean> {
  const updatedCount = await orm.Users.where((user) =>
    and(
      user.discogsUserId.eq(discogsUserId),
      user.supportToastPending.eq(true),
      user.supportToastDismissed.eq(false),
    ),
  ).updateAndCount({
    supportToastPending: false,
    updatedAt: ormTimestamp(new Date()),
  });

  return updatedCount > 0;
}

export async function dismissSupportProjectToastForUser(
  discogsUserId: number,
): Promise<void> {
  await orm.Users.where({ discogsUserId }).update({
    supportToastDismissed: true,
    supportToastPending: false,
    updatedAt: ormTimestamp(new Date()),
  });
}
