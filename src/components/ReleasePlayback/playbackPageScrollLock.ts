interface ScrollLockSnapshot {
  overflow: string;
  overflowY: string;
  touchAction: string;
  scrollTop: number;
}

export const lockPlaybackPageScrollElement = (
  element: HTMLElement,
): ScrollLockSnapshot => ({
  overflow: element.style.overflow,
  overflowY: element.style.overflowY,
  touchAction: element.style.touchAction,
  scrollTop: element.scrollTop,
});

export const applyPlaybackPageScrollLock = (element: HTMLElement): void => {
  element.style.overflow = "hidden";
  element.style.overflowY = "hidden";
  element.style.touchAction = "none";
};

export const restorePlaybackPageScrollElement = (
  element: HTMLElement,
  snapshot: ScrollLockSnapshot,
): void => {
  element.style.overflow = snapshot.overflow;
  element.style.overflowY = snapshot.overflowY;
  element.style.touchAction = snapshot.touchAction;
  element.scrollTop = snapshot.scrollTop;
};
