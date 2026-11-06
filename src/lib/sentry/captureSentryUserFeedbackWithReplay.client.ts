"use client";

import type { Attachment } from "@sentry/core";
import { captureFeedback } from "@sentry/react";
import { definedProps } from "src/utils/definedProps";

type SentryFeedbackParams = Parameters<typeof captureFeedback>[0];

export const captureSentryUserFeedbackWithReplay = (
  feedback: SentryFeedbackParams,
  options?: { attachments?: Attachment[] },
): void => {
  const attachments = options?.attachments;

  captureFeedback(feedback, {
    includeReplay: true,
    ...definedProps({
      attachments:
        attachments && attachments.length > 0 ? attachments : undefined,
    }),
  });
};
