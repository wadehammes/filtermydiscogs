import { describe, expect, it } from "@jest/globals";
import { resolveVisualViewportBottomInset } from "src/utils/resolveVisualViewportBottomInset";

describe("resolveVisualViewportBottomInset", () => {
  it("when visualViewport is null, returns 0", () => {
    expect(resolveVisualViewportBottomInset(800, null)).toBe(0);
  });

  it("when the visual viewport fills the layout viewport, returns 0", () => {
    expect(
      resolveVisualViewportBottomInset(800, {
        height: 800,
        offsetTop: 0,
      }),
    ).toBe(0);
  });

  it("when the keyboard shrinks the visual viewport, returns the bottom inset", () => {
    expect(
      resolveVisualViewportBottomInset(800, {
        height: 500,
        offsetTop: 100,
      }),
    ).toBe(200);
  });

  it("when the visual viewport height recovers after keyboard dismiss, returns 0 even if offsetTop is stale", () => {
    expect(
      resolveVisualViewportBottomInset(800, {
        height: 790,
        offsetTop: 120,
      }),
    ).toBe(0);
  });
});
