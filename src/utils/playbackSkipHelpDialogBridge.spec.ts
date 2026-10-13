import { afterEach, describe, expect, it, jest } from "@jest/globals";
import {
  openPlaybackSkipHelpDialog,
  registerPlaybackSkipHelpDialogOpen,
} from "src/utils/playbackSkipHelpDialogBridge";

describe("playbackSkipHelpDialogBridge", () => {
  let unregisterOpen: (() => void) | undefined;

  afterEach(() => {
    unregisterOpen?.();
    unregisterOpen = undefined;
  });

  it("when open handler is registered, forwards the open request", () => {
    const onOpen = jest.fn();
    unregisterOpen = registerPlaybackSkipHelpDialogOpen(onOpen);

    openPlaybackSkipHelpDialog();

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("when open handler is not registered, open is a no-op", () => {
    expect(() => {
      openPlaybackSkipHelpDialog();
    }).not.toThrow();
  });
});
