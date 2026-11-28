import { describe, expect, it } from "@jest/globals";
import { parsePlaybackDockBarCollapsed } from "src/utils/playbackDockBarCollapsedStorage";

describe("playbackDockBarCollapsedStorage", () => {
  it("when stored value is null, returns false", () => {
    expect(parsePlaybackDockBarCollapsed(null)).toBe(false);
  });

  it("when stored value is JSON true, returns true", () => {
    expect(parsePlaybackDockBarCollapsed("true")).toBe(true);
  });

  it("when stored value is invalid JSON, returns false", () => {
    expect(parsePlaybackDockBarCollapsed("not-json")).toBe(false);
  });

  it("when stored value is JSON false, returns false", () => {
    expect(parsePlaybackDockBarCollapsed("false")).toBe(false);
  });
});
