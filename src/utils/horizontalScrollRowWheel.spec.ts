import { describe, expect, it } from "@jest/globals";
import { resolveHorizontalScrollWheel } from "src/utils/horizontalScrollRowWheel";

const overflowRow = {
  clientWidth: 100,
  scrollWidth: 300,
  scrollLeft: 50,
};

describe("resolveHorizontalScrollWheel", () => {
  it("returns null when the row does not overflow", () => {
    expect(
      resolveHorizontalScrollWheel({
        ...overflowRow,
        clientWidth: 300,
        scrollWidth: 300,
        deltaX: 10,
        deltaY: 0,
        shiftKey: false,
      }),
    ).toBeNull();
  });

  it("returns null for vertical-dominant wheel so page scroll is not trapped", () => {
    expect(
      resolveHorizontalScrollWheel({
        ...overflowRow,
        deltaX: 2,
        deltaY: 40,
        shiftKey: false,
      }),
    ).toBeNull();
  });

  it("scrolls horizontally when deltaX dominates", () => {
    expect(
      resolveHorizontalScrollWheel({
        ...overflowRow,
        deltaX: 24,
        deltaY: 4,
        shiftKey: false,
      }),
    ).toEqual({
      horizontalDelta: 24,
      nextScrollLeft: 74,
    });
  });

  it("maps shift+wheel to horizontal scroll", () => {
    expect(
      resolveHorizontalScrollWheel({
        ...overflowRow,
        deltaX: 0,
        deltaY: 18,
        shiftKey: true,
      }),
    ).toEqual({
      horizontalDelta: 18,
      nextScrollLeft: 68,
    });
  });

  it("returns null at the start edge when scrolling further left", () => {
    expect(
      resolveHorizontalScrollWheel({
        ...overflowRow,
        scrollLeft: 0,
        deltaX: -20,
        deltaY: 0,
        shiftKey: false,
      }),
    ).toBeNull();
  });

  it("returns null at the end edge when scrolling further right", () => {
    expect(
      resolveHorizontalScrollWheel({
        ...overflowRow,
        scrollLeft: 200,
        deltaX: 20,
        deltaY: 0,
        shiftKey: false,
      }),
    ).toBeNull();
  });
});
