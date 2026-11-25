export const SETTINGS_CONTACT_SAVED_MESSAGE = "Account settings saved";
export const SETTINGS_CONTACT_SAVE_ERROR_MESSAGE =
  "Failed to save account settings";

export const SETTINGS_EMAIL_VERIFICATION_SENT_MESSAGE =
  "Verification email sent. Check your inbox to confirm this address.";

export const SETTINGS_EMAIL_RESEND_NOT_AVAILABLE_MESSAGE =
  "No email address is waiting for verification.";

export const SETTINGS_EMAIL_STATUS_VERIFIED_LABEL = "Email verified";

export const SETTINGS_EMAIL_STATUS_PENDING_LABEL =
  "Waiting for email confirmation";

export const SETTINGS_EMAIL_STATUS_UNVERIFIED_LABEL = "Email not verified";

export const SETTINGS_EMAIL_RESEND_VERIFICATION_LABEL = "Resend verification";

export const SETTINGS_EMAIL_VERIFIED_TOAST_MESSAGE = "Email verified.";

export const SETTINGS_EMAIL_VERIFICATION_EXPIRED_MESSAGE =
  "That verification link expired. Save your email again to get a new link.";

export const SETTINGS_EMAIL_VERIFICATION_INVALID_MESSAGE =
  "That verification link is invalid. Save your email again to get a new link.";

export const SETTINGS_EMAIL_FIELD_LABEL = "Email";

export const SETTINGS_EMAIL_SAVE_LABEL = "Save email";

export const SETTINGS_EMAIL_FIELD_DESCRIPTION =
  "Optional address for product and marketing email. We may fill this from your Discogs account email on login when empty; edit the address and choose Save email before opting in to marketing mail.";

export const SETTINGS_EMAIL_PENDING_STATUS = (pendingEmail: string): string =>
  `Waiting for you to confirm ${pendingEmail}. Check your inbox for the verification link.`;

export const SETTINGS_EMAIL_UNVERIFIED_STATUS = (email: string): string =>
  `Confirm ${email} before marketing mail can be enabled. Save the address again if you need a new verification email.`;

export const SETTINGS_MARKETING_EMAILS_LABEL = "Marketing emails";

export const SETTINGS_MARKETING_EMAILS_DESCRIPTION =
  "When enabled, we may send occasional email about the app and your collection. You can turn this off anytime.";

export const SETTINGS_DATA_SECTION_NAV_DESCRIPTION = "Cookies and analytics";

export const SETTINGS_DATA_PANEL_LEAD =
  "Control optional analytics cookies on this device.";

export const SETTINGS_SUPPORT_PANEL_DESCRIPTION =
  "Optional one-time donations cover hosting and ongoing development.";

export const SETTINGS_COMPLETE_LOGOUT_PANEL_DESCRIPTION =
  "Sign out and revoke stored OAuth tokens on this browser. Your crates, playlists, and preferences stay saved. You can sign in again with Discogs when you are ready.";

export const SETTINGS_COMPLETE_LOGOUT_DIALOG_MESSAGE =
  "This signs you out and revokes stored OAuth tokens on this browser. Your crates, playlists, and local preferences stay saved. You can sign in again with Discogs when you are ready.";
