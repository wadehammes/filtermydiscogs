export type UserContact = {
  email: string | null;
  pendingEmail: string | null;
  emailVerified: boolean;
  marketingEmailsOptIn: boolean;
};

export type UserContactPatch = {
  email?: string | null;
  marketingEmailsOptIn?: boolean;
  resendEmailVerification?: true;
};

export type UserContactDbRow = {
  email: string | null;
  email_verified_at: Date | null;
  email_pending: string | null;
  marketing_emails_opt_in: boolean;
};
