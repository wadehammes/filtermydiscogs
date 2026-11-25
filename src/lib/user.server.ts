import { USER_LAST_SEEN_TOUCH_INTERVAL_MS } from "src/constants/userEngagement.constants";
import { prisma } from "src/lib/db";

type RecordDiscogsLoginInput = {
  discogsUserId: number;
  username: string;
};

export type RecordDiscogsLoginResult = {
  discogsUserId: number;
};

export async function recordDiscogsLogin({
  discogsUserId,
  username,
}: RecordDiscogsLoginInput): Promise<RecordDiscogsLoginResult> {
  const now = new Date();
  const existingUser = await prisma.user.findUnique({
    where: { discogs_user_id: discogsUserId },
    select: {
      login_count: true,
    },
  });

  if (!existingUser) {
    await prisma.user.create({
      data: {
        discogs_user_id: discogsUserId,
        username,
        login_count: 1,
        support_toast_pending: false,
        last_seen_at: now,
      },
    });

    return { discogsUserId };
  }

  await prisma.user.update({
    where: { discogs_user_id: discogsUserId },
    data: {
      username,
      login_count: existingUser.login_count + 1,
      last_seen_at: now,
    },
  });

  return { discogsUserId };
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

export async function readSupportProjectToastEligible(
  discogsUserId: number,
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { discogs_user_id: discogsUserId },
    select: { support_toast_dismissed: true, login_count: true },
  });

  if (user == null) {
    return true;
  }

  if (user.support_toast_dismissed) {
    return false;
  }

  return user.login_count > 1;
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
