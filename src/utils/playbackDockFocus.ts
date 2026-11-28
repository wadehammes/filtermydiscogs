export const PLAYBACK_MINI_PLAYER_SELECTOR =
  '[data-testid="fmdReleaseMiniPlayer"]';

export const RELEASES_SCROLL_ROOT_SELECTOR = "[data-releases-scroll-root]";

export const blurFocusWithinPlaybackDock = (): void => {
  const active = document.activeElement;

  if (!(active instanceof HTMLElement)) {
    return;
  }

  if (!active.closest(PLAYBACK_MINI_PLAYER_SELECTOR)) {
    return;
  }

  active.blur();
};

export const prepareCollectionScrollFromPlaybackDockTouch = (): void => {
  blurFocusWithinPlaybackDock();

  const scrollRoot = document.querySelector<HTMLElement>(
    RELEASES_SCROLL_ROOT_SELECTOR,
  );

  if (!scrollRoot) {
    return;
  }

  if (scrollRoot === document.activeElement) {
    return;
  }

  scrollRoot.focus({ preventScroll: true });
};
