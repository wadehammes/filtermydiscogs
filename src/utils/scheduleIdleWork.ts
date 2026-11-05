export const scheduleIdleWork = (work: () => void): void => {
  if (typeof globalThis.requestIdleCallback === "function") {
    globalThis.requestIdleCallback(work);
    return;
  }

  setTimeout(work, 0);
};
