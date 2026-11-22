import { USER_LAST_SEEN_TOUCH_INTERVAL_MS } from "src/constants/userEngagement.constants";
import { prisma } from "src/lib/db";
import {
  type DiscogsProfileEmailCredentials,
  fetchDiscogsProfileEmailForLogin,
} from "src/lib/discogs-profile-email.server";

type RecordDiscogsLoginInput = {
  discogsUserId: number;
  username: string;
  discogsProfileEmail?: string | null;
  oauthCredentials?: DiscogsProfileEmailCredentials;
  loginRouteLabel?: string;
};

export type RecordDiscogsLoginResult = {
  discogsUserId: number;
};

const emailBackfillFromDiscogs = (
  storedEmail: string | null,
  discogsProfileEmail: string | null | undefined,
): string | undefined => {
  if (storedEmail != null || !discogsProfileEmail) {
    return undefined;
  }

  return discogsProfileEmail;
};

const resolveDiscogsProfileEmailForLogin = async (
  existingEmail: string | null | undefined,
  discogsProfileEmail: string | null | undefined,
  oauthCredentials: DiscogsProfileEmailCredentials | undefined,
  loginRouteLabel: string | undefined,
): Promise<string | null> => {
  if (discogsProfileEmail !== undefined) {
    return discogsProfileEmail;
  }

  if ((existingEmail?.trim() ?? "") !== "") {
    return null;
  }

  if (!oauthCredentials) {
    return null;
  }

  return fetchDiscogsProfileEmailForLogin(
    oauthCredentials,
    loginRouteLabel ?? "/api/auth/callback",
  );
};

export async function recordDiscogsLogin({
  discogsUserId,
  username,
  discogsProfileEmail,
  oauthCredentials,
  loginRouteLabel,
}: RecordDiscogsLoginInput): Promise<RecordDiscogsLoginResult> {
  const now = new Date();
  const existingUser = await prisma.user.findUnique({
    where: { discogs_user_id: discogsUserId },
    select: {
      login_count: true,
      support_toast_dismissed: true,
      email: true,
      welcome_email_sent: true,
    },
  });

  const resolvedProfileEmail = await resolveDiscogsProfileEmailForLogin(
    existingUser?.email,
    discogsProfileEmail,
    oauthCredentials,
    loginRouteLabel,
  );

  if (!existingUser) {
    const email = resolvedProfileEmail ?? null;

    await prisma.user.create({
      data: {
        discogs_user_id: discogsUserId,
        username,
        login_count: 1,
        support_toast_pending: false,
        email,
        last_seen_at: now,
      },
    });

    return { discogsUserId };
  }

  const emailBackfill = emailBackfillFromDiscogs(
    existingUser.email,
    resolvedProfileEmail,
  );

  await prisma.user.update({
    where: { discogs_user_id: discogsUserId },
    data: {
      username,
      login_count: existingUser.login_count + 1,
      last_seen_at: now,
      ...(emailBackfill !== undefined ? { email: emailBackfill } : {}),
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
    select: { support_toast_dismissed: true },
  });

  if (user == null) {
    return true;
  }

  return !user.support_toast_dismissed;
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
