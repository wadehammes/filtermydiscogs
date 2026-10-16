import { afterEach, describe, expect, it } from "@jest/globals";
import {
  installViewTransitionRecoverableErrorFilter,
  isViewTransitionInterruptionError,
} from "src/utils/viewTransitionInterruptions";

describe("isViewTransitionInterruptionError", () => {
  it("matches hidden-document InvalidStateError messages", () => {
    const error = new DOMException(
      "Transition was aborted because of invalid state. Document hidden",
      "InvalidStateError",
    );

    expect(isViewTransitionInterruptionError(error)).toBe(true);
  });

  it("matches wrapped interruption errors via cause", () => {
    const error = new Error("A ViewTransition could not start.", {
      cause: new DOMException(
        "Transition was aborted because of invalid state",
        "InvalidStateError",
      ),
    });

    expect(isViewTransitionInterruptionError(error)).toBe(true);
  });

  it("ignores unrelated errors", () => {
    expect(isViewTransitionInterruptionError(new Error("Network failed"))).toBe(
      false,
    );
  });
});

describe("installViewTransitionRecoverableErrorFilter", () => {
  const patchedKey = "__fmdViewTransitionReportErrorPatched";

  afterEach(() => {
    delete (globalThis as { [patchedKey]?: boolean })[patchedKey];
  });

  it("when scheduler termination is reported, does not forward to the original reportError", () => {
    const reported: unknown[] = [];
    const priorReportError =
      typeof globalThis.reportError === "function"
        ? globalThis.reportError.bind(globalThis)
        : (error: unknown) => {
            throw error;
          };

    globalThis.reportError = (error: unknown) => {
      reported.push(error);
    };

    installViewTransitionRecoverableErrorFilter();

    globalThis.reportError(
      new Error("callback `timer callback` was terminated"),
    );

    expect(reported).toHaveLength(0);

    globalThis.reportError = priorReportError;
  });
});
