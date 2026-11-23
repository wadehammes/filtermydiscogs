import "server-only";

import {
  hasTrimmedUserEmail,
  isWelcomeSignupEmailEligibleAccount,
  welcomeSignupEmailEligibilityWhere,
} from "src/constants/welcomeSignupEmail.constants";
import { prisma } from "src/lib/db";
import { sendWelcomeSignupEmailIfEligible } from "src/lib/welcomeSignupEmail.server";
import type { AdminWelcomeEmailPendingUser } from "src/types/adminWelcomeEmail.types";

const mapPendingUser = (user: {
  discogs_user_id: number;
  username: string;
  email: string | null;
  created_at: Date;
  login_count: number;
}): AdminWelcomeEmailPendingUser => ({
  discogsUserId: user.discogs_user_id,
  username: user.username,
  email: user.email?.trim() ?? "",
  createdAt: user.created_at.toISOString(),
  loginCount: user.login_count,
});

export const listAdminWelcomeEmailPendingUsers = async (): Promise<
  AdminWelcomeEmailPendingUser[]
> => {
  const users = await prisma.user.findMany({
    where: {
      ...welcomeSignupEmailEligibilityWhere,
      email: { not: null },
    },
    select: {
      discogs_user_id: true,
      username: true,
      email: true,
      welcome_email_sent: true,
      created_at: true,
      login_count: true,
    },
    orderBy: { created_at: "desc" },
  });

  return users
    .filter(
      (user) =>
        hasTrimmedUserEmail(user.email) &&
        isWelcomeSignupEmailEligibleAccount(user),
    )
    .map(mapPendingUser);
};

export class AdminWelcomeEmailSendFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminWelcomeEmailSendFailedError";
  }
}

export const sendAdminWelcomeEmailForUser = async (
  discogsUserId: number,
): Promise<void> => {
  const before = await prisma.user.findUnique({
    where: { discogs_user_id: discogsUserId },
    select: {
      email: true,
      welcome_email_sent: true,
      created_at: true,
    },
  });

  if (
    before == null ||
    !isWelcomeSignupEmailEligibleAccount({
      email: before.email,
      welcome_email_sent: before.welcome_email_sent,
      created_at: before.created_at,
    })
  ) {
    throw new AdminWelcomeEmailSendFailedError(
      "Account is not eligible for a welcome email",
    );
  }

  await sendWelcomeSignupEmailIfEligible(discogsUserId);

  const after = await prisma.user.findUnique({
    where: { discogs_user_id: discogsUserId },
    select: { welcome_email_sent: true },
  });

  if (!after?.welcome_email_sent) {
    throw new AdminWelcomeEmailSendFailedError(
      "Welcome email was not sent — check Resend configuration",
    );
  }
};
