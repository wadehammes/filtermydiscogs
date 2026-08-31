import { SUPPORT_PROJECT_TOAST_LOGIN_THRESHOLD } from "src/constants/supportProjectToast.constants";
import { USER_LAST_SEEN_TOUCH_INTERVAL_MS } from "src/constants/userEngagement.constants";
import { prisma } from "src/lib/db";

type UpsertDiscogsUserInput = {
  discogsUserId: number;
  username: string;
};

export async function recordDiscogsLogin({
  discogsUserId,
  username,
}: UpsertDiscogsUserInput) {
  const now = new Date();
  const existingUser = await prisma.user.findUnique({
    where: { discogs_user_id: discogsUserId },
    select: {
      login_count: true,
      support_toast_dismissed: true,
    },
  });

  if (!existingUser) {
    return prisma.user.create({
      data: {
        discogs_user_id: discogsUserId,
        username,
        login_count: 1,
        support_toast_pending: false,
        last_seen_at: now,
      },
    });
  }

  const nextLoginCount = existingUser.login_count + 1;
  const shouldPromptForSupport =
    nextLoginCount >= SUPPORT_PROJECT_TOAST_LOGIN_THRESHOLD &&
    !existingUser.support_toast_dismissed;

  return prisma.user.update({
    where: { discogs_user_id: discogsUserId },
    data: {
      username,
      login_count: nextLoginCount,
      last_seen_at: now,
      ...(shouldPromptForSupport ? { support_toast_pending: true } : {}),
    },
  });
}

export async function touchUserLastSeen(discogsUserId: number): Promise<void> {
  const touchBefore = new Date(Date.now() - USER_LAST_SEEN_TOUCH_INTERVAL_MS);

  await prisma.user.updateMany({
    where: {
      discogs_user_id: discogsUserId,
      OR: [{ last_seen_at: null }, { last_seen_at: { lt: touchBefore } }],
    },
    data: {
      last_seen_at: new Date(),
    },
  });
}

export async function consumeSupportProjectToastPending(
  discogsUserId: number,
): Promise<boolean> {
  const result = await prisma.user.updateMany({
    where: {
      discogs_user_id: discogsUserId,
      support_toast_pending: true,
      support_toast_dismissed: false,
    },
    data: {
      support_toast_pending: false,
    },
  });

  return result.count > 0;
}

export async function dismissSupportProjectToastForUser(
  discogsUserId: number,
): Promise<void> {
  await prisma.user.update({
    where: { discogs_user_id: discogsUserId },
    data: {
      support_toast_dismissed: true,
      support_toast_pending: false,
    },
  });
}
