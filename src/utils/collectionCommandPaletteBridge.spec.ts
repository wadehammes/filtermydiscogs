import { describe, expect, it, jest } from "@jest/globals";
import {
  openCollectionCommandPalette,
  registerCollectionCommandPaletteOpen,
} from "src/utils/collectionCommandPaletteBridge";

describe("collectionCommandPaletteBridge", () => {
  it("openCollectionCommandPalette calls the registered handler", () => {
    const onOpen = jest.fn();
    const unregister = registerCollectionCommandPaletteOpen(onOpen);

    openCollectionCommandPalette();

    expect(onOpen).toHaveBeenCalledTimes(1);
    unregister();
    openCollectionCommandPalette();
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
