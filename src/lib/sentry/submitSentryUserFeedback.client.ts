"use client";

import type { Attachment } from "@sentry/core";
import { captureFeedback } from "@sentry/react";
import {
  SENTRY_USER_FEEDBACK_SOURCE_TAG,
  SENTRY_USER_FEEDBACK_SUCCESS_TOAST_MESSAGE,
} from "src/constants/sentryUserFeedbackForm.constants";
import { resolveSentryEnabled } from "src/lib/sentry/sentryInitOptions";
import type { SentryUserFeedbackFormValues } from "src/lib/validation/sentryUserFeedback.schemas";
import { definedProps } from "src/utils/definedProps";
import { toast } from "src/utils/toast";

const toOptionalField = (value: string): string | undefined => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const submitSentryUserFeedback = (
  values: SentryUserFeedbackFormValues,
  screenshot?: Attachment,
): void => {
  if (!resolveSentryEnabled()) {
    return;
  }

  const name = toOptionalField(values.name);
  const email = toOptionalField(values.email);

  captureFeedback(
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
    {
      includeReplay: true,
      ...definedProps({
        attachments: screenshot ? [screenshot] : undefined,
      }),
    },
  );

  toast.success(SENTRY_USER_FEEDBACK_SUCCESS_TOAST_MESSAGE);
};
