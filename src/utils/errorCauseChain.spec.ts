import { describe, expect, it } from "@jest/globals";
import { someErrorInCauseChain } from "src/utils/errorCauseChain";

describe("someErrorInCauseChain", () => {
  it("when a nested cause matches, returns true", () => {
    const root = new Error("outer");
    root.cause = new Error("inner match");

    expect(
      someErrorInCauseChain(root, (error) => error.message === "inner match"),
    ).toBe(true);
  });

  it("when no cause matches, returns false", () => {
    expect(
      someErrorInCauseChain(new Error("solo"), (error) =>
        error.message.includes("missing"),
      ),
    ).toBe(false);
  });
});
