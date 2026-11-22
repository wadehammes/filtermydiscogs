import "server-only";

import {
  buildWelcomeSignupEmailClaimWhere,
  isWelcomeSignupEmailEligibleAccount,
} from "src/constants/welcomeSignupEmail.constants";
import { prisma } from "src/lib/db";
import { renderWelcomeSignupEmail } from "src/lib/renderWelcomeSignupEmail.server";
import { getResendClient, getResendFromEmail } from "src/lib/resend.server";

export const sendWelcomeSignupEmailIfEligible = async (
  discogsUserId: number,
): Promise<void> => {
  const resend = getResendClient();
  const from = getResendFromEmail();

  if (!(resend && from)) {
    return;
  }

  const user = await prisma.user.findUnique({
    where: { discogs_user_id: discogsUserId },
    select: {
      email: true,
      username: true,
      welcome_email_sent: true,
      login_count: true,
      created_at: true,
    },
  });

  if (user == null || !isWelcomeSignupEmailEligibleAccount(user)) {
    return;
  }

  const trimmedEmail = user.email?.trim() ?? "";

  const claimed = await prisma.user.updateMany({
    where: buildWelcomeSignupEmailClaimWhere(discogsUserId),
    data: {
      welcome_email_sent: true,
    },
  });

  if (claimed.count === 0) {
    return;
  }

  const { subject, text, html } = await renderWelcomeSignupEmail({
    username: user.username,
  });

  try {
    await resend.emails.send({
      from,
      to: trimmedEmail,
      subject,
      text,
      html,
    });
  } catch (error) {
    await prisma.user.update({
      where: { discogs_user_id: discogsUserId },
      data: { welcome_email_sent: false },
    });
    throw error;
  }
};
