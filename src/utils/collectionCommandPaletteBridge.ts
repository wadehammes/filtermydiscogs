type OpenCollectionCommandPalette = () => void;

let openCollectionCommandPaletteImpl: OpenCollectionCommandPalette | null =
  null;

export const registerCollectionCommandPaletteOpen = (
  onOpen: OpenCollectionCommandPalette,
) => {
  openCollectionCommandPaletteImpl = onOpen;

  return () => {
    openCollectionCommandPaletteImpl = null;
  };
};

export const openCollectionCommandPalette = (): void => {
  openCollectionCommandPaletteImpl?.();
};
