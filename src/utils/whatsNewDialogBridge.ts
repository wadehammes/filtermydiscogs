type OpenWhatsNewDialog = () => void;

let openWhatsNewDialogImpl: OpenWhatsNewDialog | null = null;

export const registerWhatsNewDialogOpen = (onOpen: OpenWhatsNewDialog) => {
  openWhatsNewDialogImpl = onOpen;

  return () => {
    openWhatsNewDialogImpl = null;
  };
};

export const openWhatsNewDialog = (): void => {
  openWhatsNewDialogImpl?.();
};
