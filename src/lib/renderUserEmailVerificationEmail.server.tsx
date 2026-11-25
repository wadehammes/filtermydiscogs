import "server-only";

import { UserEmailVerificationEmailTemplate } from "src/components/Email/UserEmailVerificationEmailTemplate.component";
import { USER_EMAIL_VERIFICATION_SUBJECT } from "src/constants/userEmailVerificationCopy.constants";
import { getEmailBaseUrl } from "src/lib/emailConstants";
import { renderTransactionalEmail } from "src/lib/renderTransactionalEmail.server";
import { getResendReplyTo } from "src/lib/resend.server";
import { definedProps } from "src/utils/definedProps";

export type RenderedUserEmailVerificationEmail = {
  subject: string;
  html: string;
  text: string;
};

export const renderUserEmailVerificationEmail = async ({
  confirmUrl,
}: {
  confirmUrl: string;
}): Promise<RenderedUserEmailVerificationEmail> => {
  const baseUrl = getEmailBaseUrl();
  const replyTo = getResendReplyTo();

  return renderTransactionalEmail(
    USER_EMAIL_VERIFICATION_SUBJECT,
    <UserEmailVerificationEmailTemplate
      {...definedProps({
        baseUrl,
        confirmUrl,
        ...(replyTo ? { contactEmail: replyTo } : {}),
      })}
    />,
  );
};
