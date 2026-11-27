import type { CollectionCommandSentryFeedbackContext } from "src/utils/buildCollectionCommandSentryFeedbackMessage";

export type SentryUserFeedbackDialogOpenRequest = {
  defaultMessage?: string;
  feedbackSourceTag?: string;
  collectionCommandContext?: CollectionCommandSentryFeedbackContext;
};

type OpenSentryUserFeedbackDialog = (
  request: SentryUserFeedbackDialogOpenRequest,
) => void;

let openSentryUserFeedbackDialogImpl: OpenSentryUserFeedbackDialog | null =
  null;

export const registerSentryUserFeedbackDialogOpen = (
  onOpen: OpenSentryUserFeedbackDialog,
) => {
  openSentryUserFeedbackDialogImpl = onOpen;

  return () => {
    openSentryUserFeedbackDialogImpl = null;
  };
};

export const openSentryUserFeedbackDialog = (
  request: SentryUserFeedbackDialogOpenRequest = {},
): void => {
  openSentryUserFeedbackDialogImpl?.(request);
};
