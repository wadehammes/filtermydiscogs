import { describe, expect, it } from "@jest/globals";
import { fireEvent } from "@testing-library/react";
import { usePlaybackDockMobileScrollPassthrough } from "src/hooks/usePlaybackDockMobileScrollPassthrough.hook";
import { act, renderHook } from "test-utils";

const dispatchDockTouchStart = (target: HTMLElement) => {
  fireEvent.touchStart(target, {
    touches: [{ clientX: 0, clientY: 0 }],
  });
};

describe("usePlaybackDockMobileScrollPassthrough", () => {
  it("when disabled, does not blur focused controls inside the dock on touchstart", () => {
    const dockShell = document.createElement("section");
    dockShell.setAttribute("data-testid", "fmdReleaseMiniPlayer");
    const button = document.createElement("button");
    button.type = "button";
    dockShell.append(button);
    document.body.append(dockShell);
    button.focus();

    renderHook(() =>
      usePlaybackDockMobileScrollPassthrough({
        enabled: false,
        dockShellNode: dockShell,
      }),
    );

    act(() => {
      dispatchDockTouchStart(dockShell);
    });

    expect(document.activeElement).toBe(button);
    dockShell.remove();
  });

  it("when enabled, blurs focused controls inside the dock on touchstart", () => {
    const dockShell = document.createElement("section");
    dockShell.setAttribute("data-testid", "fmdReleaseMiniPlayer");
    const button = document.createElement("button");
    button.type = "button";
    dockShell.append(button);
    document.body.append(dockShell);
    button.focus();

    renderHook(() =>
      usePlaybackDockMobileScrollPassthrough({
        enabled: true,
        dockShellNode: dockShell,
      }),
    );

    act(() => {
      dispatchDockTouchStart(dockShell);
    });

    expect(document.activeElement).not.toBe(button);
    dockShell.remove();
  });

  it("when enabled, focuses the releases scroll root after touchstart", () => {
    const scrollRoot = document.createElement("main");
    scrollRoot.setAttribute("data-releases-scroll-root", "");
    scrollRoot.tabIndex = -1;
    const dockShell = document.createElement("section");
    dockShell.setAttribute("data-testid", "fmdReleaseMiniPlayer");
    document.body.append(scrollRoot, dockShell);

    renderHook(() =>
      usePlaybackDockMobileScrollPassthrough({
        enabled: true,
        dockShellNode: dockShell,
      }),
    );

    act(() => {
      dispatchDockTouchStart(dockShell);
    });

    expect(document.activeElement).toBe(scrollRoot);
    scrollRoot.remove();
    dockShell.remove();
  });
});
