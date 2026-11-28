import { describe, expect, it } from "@jest/globals";
import {
  blurFocusWithinPlaybackDock,
  PLAYBACK_MINI_PLAYER_SELECTOR,
  prepareCollectionScrollFromPlaybackDockTouch,
} from "src/utils/playbackDockFocus";

describe("playbackDockFocus", () => {
  it("blurs the active element when focus is inside the playback mini player", () => {
    const shell = document.createElement("section");
    shell.setAttribute("data-testid", "fmdReleaseMiniPlayer");

    const button = document.createElement("button");
    button.type = "button";
    shell.append(button);
    document.body.append(shell);
    button.focus();

    blurFocusWithinPlaybackDock();

    expect(document.activeElement).not.toBe(button);
    expect(PLAYBACK_MINI_PLAYER_SELECTOR).toBe(
      '[data-testid="fmdReleaseMiniPlayer"]',
    );

    shell.remove();
  });

  it("does not blur focus that lives outside the playback mini player", () => {
    const outsideButton = document.createElement("button");
    outsideButton.type = "button";
    document.body.append(outsideButton);
    outsideButton.focus();

    blurFocusWithinPlaybackDock();

    expect(document.activeElement).toBe(outsideButton);

    outsideButton.remove();
  });

  it("prepareCollectionScrollFromPlaybackDockTouch focuses the releases scroll root when present", () => {
    const scrollRoot = document.createElement("main");
    scrollRoot.setAttribute("data-releases-scroll-root", "");
    scrollRoot.tabIndex = -1;
    const shell = document.createElement("section");
    shell.setAttribute("data-testid", "fmdReleaseMiniPlayer");
    const button = document.createElement("button");
    button.type = "button";
    shell.append(button);
    document.body.append(scrollRoot, shell);
    button.focus();

    prepareCollectionScrollFromPlaybackDockTouch();

    expect(document.activeElement).toBe(scrollRoot);
    expect(document.activeElement).not.toBe(button);

    scrollRoot.remove();
    shell.remove();
  });
});
