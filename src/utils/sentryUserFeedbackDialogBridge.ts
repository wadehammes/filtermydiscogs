type OpenSentryUserFeedbackDialog = () => void;

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

export const openSentryUserFeedbackDialog = (): void => {
  openSentryUserFeedbackDialogImpl?.();
};
