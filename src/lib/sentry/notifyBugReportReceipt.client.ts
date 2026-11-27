"use client";

import { api } from "src/api/urls";
import type { SentryUserFeedbackFormValues } from "src/lib/validation/sentryUserFeedback.schemas";
import type { UserBugReportNotificationBody } from "src/lib/validation/userBugReportNotification.schemas";
import { definedProps } from "src/utils/definedProps";

export const notifyBugReportReceiptAfterSubmit = async (
  values: SentryUserFeedbackFormValues,
  feedbackSourceTag?: string,
): Promise<void> => {
  const name = values.name.trim();
  const email = values.email.trim();

  try {
    const payload: UserBugReportNotificationBody = {
      message: values.message.trim(),
      ...definedProps({
        feedbackSourceTag:
          feedbackSourceTag as UserBugReportNotificationBody["feedbackSourceTag"],
        name: name.length > 0 ? name : undefined,
        email: email.length > 0 ? email : undefined,
      }),
    };

    await api.notifyBugReportReceipt(payload);
  } catch {
    return;
  }
};
