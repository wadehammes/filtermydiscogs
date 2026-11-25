import {
  SETTINGS_EMAIL_PENDING_STATUS,
  SETTINGS_EMAIL_STATUS_PENDING_LABEL,
  SETTINGS_EMAIL_STATUS_UNVERIFIED_LABEL,
  SETTINGS_EMAIL_STATUS_VERIFIED_LABEL,
  SETTINGS_EMAIL_UNVERIFIED_STATUS,
} from "src/constants/settingsCopy.constants";
import type { UserContact } from "src/types/userContact.types";
import { canResendEmailVerification } from "src/utils/userContact.helpers";

export type EmailVerificationIcon =
  | "verified"
  | "pending"
  | "unverified"
  | null;

export type EmailVerificationUiState = {
  emailStatusMessage: string | null;
  icon: EmailVerificationIcon;
  iconTitle: string | null;
  showResendVerification: boolean;
};

export const getEmailVerificationUiState = (
  contact: UserContact,
): EmailVerificationUiState => {
  const { email, pendingEmail, emailVerified } = contact;
  const pendingTrimmed = pendingEmail?.trim() ?? "";
  const savedTrimmed = email?.trim() ?? "";

  if (pendingTrimmed !== "") {
    return {
      emailStatusMessage: SETTINGS_EMAIL_PENDING_STATUS(pendingTrimmed),
      icon: "pending",
      iconTitle: SETTINGS_EMAIL_STATUS_PENDING_LABEL,
      showResendVerification: canResendEmailVerification(contact),
    };
  }

  if (savedTrimmed !== "" && emailVerified) {
    return {
      emailStatusMessage: null,
      icon: "verified",
      iconTitle: SETTINGS_EMAIL_STATUS_VERIFIED_LABEL,
      showResendVerification: false,
    };
  }

  if (savedTrimmed !== "" && !emailVerified) {
    return {
      emailStatusMessage: SETTINGS_EMAIL_UNVERIFIED_STATUS(savedTrimmed),
      icon: "unverified",
      iconTitle: SETTINGS_EMAIL_STATUS_UNVERIFIED_LABEL,
      showResendVerification: canResendEmailVerification(contact),
    };
  }

  return {
    emailStatusMessage: null,
    icon: null,
    iconTitle: null,
    showResendVerification: false,
  };
};
