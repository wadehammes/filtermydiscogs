const VIEW_TRANSITION_INTERRUPTION_MESSAGES = [
  "Transition was aborted because of invalid state",
  "View transition was skipped because document visibility state is hidden.",
  "Skipping view transition because document visibility state has become hidden.",
  "Skipping view transition because viewport size changed.",
  "Old view transition aborted",
] as const;

export const isViewTransitionInterruptionError = (error: unknown): boolean => {
  let current: unknown = error;

  while (current instanceof Error) {
    const error = current;

    if (error.name === "InvalidStateError" || error.name === "AbortError") {
      if (
        VIEW_TRANSITION_INTERRUPTION_MESSAGES.some((prefix) =>
          error.message.startsWith(prefix),
        )
      ) {
        return true;
      }
    }

    current = error.cause;
  }

  return false;
};

const createSkippedViewTransition = (): ViewTransition => {
  const settled = Promise.resolve();

  return {
    finished: settled,
    ready: settled,
    updateCallbackDone: settled,
    skipTransition: () => undefined,
    types: new Set<string>(),
  };
};

const ignoreViewTransitionInterruption = (promise: Promise<unknown>) => {
  void promise.catch((error) => {
    if (!isViewTransitionInterruptionError(error)) {
      console.error(error);
    }
  });
};

export const installViewTransitionRecoverableErrorFilter = (): void => {
  if (
    typeof globalThis.reportError !== "function" ||
    (globalThis as { __fmdViewTransitionReportErrorPatched?: boolean })
      .__fmdViewTransitionReportErrorPatched
  ) {
    return;
  }

  const originalReportError = globalThis.reportError.bind(globalThis);

  globalThis.reportError = (error: unknown) => {
    if (isViewTransitionInterruptionError(error)) {
      return;
    }

    originalReportError(error);
  };

  (
    globalThis as { __fmdViewTransitionReportErrorPatched?: boolean }
  ).__fmdViewTransitionReportErrorPatched = true;
};

let viewTransitionDocumentGuardInstalled = false;

export const installViewTransitionDocumentGuard = (): void => {
  if (viewTransitionDocumentGuardInstalled || typeof document === "undefined") {
    return;
  }

  if (!document.startViewTransition) {
    return;
  }

  const startViewTransition = document.startViewTransition.bind(document) as (
    updateCallback: ViewTransitionUpdateCallback,
  ) => ViewTransition;

  viewTransitionDocumentGuardInstalled = true;

  const guardedStartViewTransition = (
    updateCallback: ViewTransitionUpdateCallback,
  ) => {
    if (document.hidden) {
      updateCallback();
      return createSkippedViewTransition();
    }

    try {
      const transition = startViewTransition(updateCallback);

      ignoreViewTransitionInterruption(transition.ready);
      ignoreViewTransitionInterruption(transition.finished);
      ignoreViewTransitionInterruption(transition.updateCallbackDone);

      return transition;
    } catch (error) {
      if (isViewTransitionInterruptionError(error)) {
        updateCallback();
        return createSkippedViewTransition();
      }

      throw error;
    }
  };

  document.startViewTransition =
    guardedStartViewTransition as typeof document.startViewTransition;
};
