"use client";

import type { Attachment } from "@sentry/core";
import {
  SENTRY_CLIENT_DELIVERY_FAILED_TOAST_MESSAGE,
  SENTRY_USER_FEEDBACK_SOURCE_TAG,
  SENTRY_USER_FEEDBACK_SUCCESS_TOAST_MESSAGE,
} from "src/constants/sentryUserFeedbackForm.constants";
import { captureSentryUserFeedbackWithReplay } from "src/lib/sentry/captureSentryUserFeedbackWithReplay.client";
import { deliverSentryClientCapture } from "src/lib/sentry/deliverSentryClientCapture.client";
import type { SentryUserFeedbackFormValues } from "src/lib/validation/sentryUserFeedback.schemas";
import { definedProps } from "src/utils/definedProps";
import { toast } from "src/utils/toast";

const toOptionalField = (value: string): string | undefined => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const submitSentryUserFeedback = async (
  values: SentryUserFeedbackFormValues,
  screenshot?: Attachment,
): Promise<boolean> => {
  const name = toOptionalField(values.name);
  const email = toOptionalField(values.email);

  const delivered = await deliverSentryClientCapture(() => {
    captureSentryUserFeedbackWithReplay(
      {
        message: values.message.trim(),
        tags: {
          feedback_source: SENTRY_USER_FEEDBACK_SOURCE_TAG,
        },
        ...definedProps({
          name,
          email,
        }),
      },
      screenshot
        ? definedProps({
            attachments: [screenshot],
          })
        : undefined,
    );
  });

  if (delivered) {
    toast.success(SENTRY_USER_FEEDBACK_SUCCESS_TOAST_MESSAGE);
    return true;
  }

  toast.error(SENTRY_CLIENT_DELIVERY_FAILED_TOAST_MESSAGE);
  return false;
};
