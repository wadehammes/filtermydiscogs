import { describe, expect, it } from "@jest/globals";
import { getReleaseGridColumnCount } from "src/hooks/useVirtualizedReleaseGrid.hook";

describe("getReleaseGridColumnCount", () => {
  it("returns one column on mobile widths", () => {
    expect(getReleaseGridColumnCount(360, true)).toBe(1);
    expect(getReleaseGridColumnCount(1024, true)).toBe(1);
  });

  it("returns one column below the desktop breakpoint", () => {
    expect(getReleaseGridColumnCount(768, false)).toBe(1);
  });

  it("matches auto-fit minmax(280px, 1fr) column counts on desktop", () => {
    expect(getReleaseGridColumnCount(900, false)).toBe(2);
    expect(getReleaseGridColumnCount(1200, false)).toBe(4);
    expect(getReleaseGridColumnCount(1600, false)).toBe(5);
  });
});
