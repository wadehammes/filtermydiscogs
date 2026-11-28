export const PLAYBACK_MINI_PLAYER_SELECTOR =
  '[data-testid="fmdReleaseMiniPlayer"]';

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
