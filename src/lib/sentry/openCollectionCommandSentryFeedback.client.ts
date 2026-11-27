"use client";

import { SENTRY_COLLECTION_COMMAND_FEEDBACK_SOURCE_TAG } from "src/constants/sentryUserFeedbackForm.constants";
import type { CollectionCommandSentryFeedbackContext } from "src/utils/buildCollectionCommandSentryFeedbackMessage";
import { openSentryUserFeedbackDialog } from "src/utils/sentryUserFeedbackDialogBridge";

export const openCollectionCommandSentryFeedback = (
  context: CollectionCommandSentryFeedbackContext,
): void => {
  openSentryUserFeedbackDialog({
    collectionCommandContext: context,
    feedbackSourceTag: SENTRY_COLLECTION_COMMAND_FEEDBACK_SOURCE_TAG,
  });
};
