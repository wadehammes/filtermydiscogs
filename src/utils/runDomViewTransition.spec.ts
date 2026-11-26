import { describe, expect, it } from "@jest/globals";
import { runDomViewTransition } from "./runDomViewTransition";

describe("runDomViewTransition", () => {
  it("runs the update callback immediately when startViewTransition is missing", () => {
    const original = document.startViewTransition;
    Object.defineProperty(document, "startViewTransition", {
      configurable: true,
      value: undefined,
    });

    const update = jest.fn();
    runDomViewTransition(update);

    expect(update).toHaveBeenCalledTimes(1);

    Object.defineProperty(document, "startViewTransition", {
      configurable: true,
      value: original,
    });
  });
});
