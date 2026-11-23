export const WELCOME_EMAIL_NEW_ACCOUNT_MIN_CREATED_AT = new Date(
  "2026-11-22T17:00:00.000Z",
);

export const welcomeSignupEmailEligibilityWhere = {
  welcome_email_sent: false,
  created_at: { gte: WELCOME_EMAIL_NEW_ACCOUNT_MIN_CREATED_AT },
} as const;

export const hasTrimmedUserEmail = (
  email: string | null | undefined,
): boolean => (email?.trim() ?? "") !== "";

export const isWelcomeSignupEmailEligibleAccount = (user: {
  created_at: Date;
  welcome_email_sent: boolean;
  email: string | null;
}): boolean => {
  if (user.welcome_email_sent) {
    return false;
  }

  if (!hasTrimmedUserEmail(user.email)) {
    return false;
  }

  return user.created_at >= WELCOME_EMAIL_NEW_ACCOUNT_MIN_CREATED_AT;
};

export const buildWelcomeSignupEmailClaimWhere = (discogsUserId: number) => ({
  discogs_user_id: discogsUserId,
  ...welcomeSignupEmailEligibilityWhere,
  email: { not: null },
});
