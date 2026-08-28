export interface HorizontalScrollWheelInput {
  clientWidth: number;
  deltaX: number;
  deltaY: number;
  scrollLeft: number;
  scrollWidth: number;
  shiftKey: boolean;
}

export interface HorizontalScrollWheelResult {
  horizontalDelta: number;
  nextScrollLeft: number;
}

export const resolveHorizontalScrollWheel = (
  input: HorizontalScrollWheelInput,
): HorizontalScrollWheelResult | null => {
  const { clientWidth, deltaX, deltaY, scrollLeft, scrollWidth, shiftKey } =
    input;

  if (scrollWidth <= clientWidth + 1) {
    return null;
  }

  const absDeltaX = Math.abs(deltaX);
  const absDeltaY = Math.abs(deltaY);

  const horizontalDelta =
    absDeltaX > absDeltaY ? deltaX : shiftKey && absDeltaY > 0 ? deltaY : 0;

  if (horizontalDelta === 0) {
    return null;
  }

  const maxScrollLeft = scrollWidth - clientWidth;
  const atStart = scrollLeft <= 0;
  const atEnd = scrollLeft >= maxScrollLeft - 1;

  if ((horizontalDelta < 0 && atStart) || (horizontalDelta > 0 && atEnd)) {
    return null;
  }

  return {
    horizontalDelta,
    nextScrollLeft: scrollLeft + horizontalDelta,
  };
};
