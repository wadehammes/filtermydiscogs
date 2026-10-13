type OpenPlaybackSkipHelpDialog = () => void;

let openPlaybackSkipHelpDialogImpl: OpenPlaybackSkipHelpDialog | null = null;

export const registerPlaybackSkipHelpDialogOpen = (
  onOpen: OpenPlaybackSkipHelpDialog,
) => {
  openPlaybackSkipHelpDialogImpl = onOpen;

  return () => {
    openPlaybackSkipHelpDialogImpl = null;
  };
};

export const openPlaybackSkipHelpDialog = (): void => {
  openPlaybackSkipHelpDialogImpl?.();
};
