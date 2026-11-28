export type VisualViewportSnapshot = {
  height: number;
  offsetTop: number;
};

const KEYBOARD_DISMISSED_HEIGHT_RATIO = 0.85;

export const resolveVisualViewportBottomInset = (
  innerHeight: number,
  viewport: VisualViewportSnapshot | null,
): number => {
  if (!viewport || innerHeight <= 0) {
    return 0;
  }

  if (viewport.height >= innerHeight * KEYBOARD_DISMISSED_HEIGHT_RATIO) {
    return 0;
  }

  const inset = innerHeight - viewport.offsetTop - viewport.height;

  return Math.max(0, Math.round(inset));
};
