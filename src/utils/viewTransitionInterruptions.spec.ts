import { describe, expect, it } from "@jest/globals";
import { isViewTransitionInterruptionError } from "src/utils/viewTransitionInterruptions";

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
