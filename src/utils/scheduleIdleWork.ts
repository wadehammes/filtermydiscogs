export const scheduleIdleWork = (work: () => void): void => {
  if (typeof globalThis.requestIdleCallback === "function") {
    globalThis.requestIdleCallback(work);
    return;
  }

  setTimeout(work, 0);
};

export const scheduleAfterNextPaint = (work: () => void): (() => void) => {
  let innerFrameId = 0;
  const outerFrameId = requestAnimationFrame(() => {
    innerFrameId = requestAnimationFrame(work);
  });

  return () => {
    cancelAnimationFrame(outerFrameId);
    if (innerFrameId) {
      cancelAnimationFrame(innerFrameId);
    }
  };
};
