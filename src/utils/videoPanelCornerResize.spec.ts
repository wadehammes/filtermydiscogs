import { describe, expect, it } from "@jest/globals";
import {
  getVideoPanelHeightForWidth,
  getVideoPanelPositionAfterResize,
  getVideoPanelResizeDelta,
} from "./videoPanelCornerResize";

describe("getVideoPanelResizeDelta", () => {
  it("grows from the bottom-right when dragging down-right", () => {
    expect(getVideoPanelResizeDelta("se", 20, 10)).toBe(20);
  });

  it("grows from the top-left when dragging up-left", () => {
    expect(getVideoPanelResizeDelta("nw", -15, -30)).toBe(30);
  });

  it("grows from the top-right when dragging up-right", () => {
    expect(getVideoPanelResizeDelta("ne", 25, -10)).toBe(25);
  });

  it("grows from the bottom-left when dragging down-left", () => {
    expect(getVideoPanelResizeDelta("sw", -12, 18)).toBe(18);
  });
});

describe("getVideoPanelHeightForWidth", () => {
  it("scales only the video area, not the fixed chrome row", () => {
    expect(
      getVideoPanelHeightForWidth({
        startWidth: 320,
        startHeight: 200,
        nextWidth: 400,
        chromeHeight: 28,
      }),
    ).toBe(28 + (200 - 28) * (400 / 320));
  });
});

describe("getVideoPanelPositionAfterResize", () => {
  const start = { x: 100, y: 80 };

  it("keeps the top-left fixed when resizing from the bottom-right", () => {
    expect(
      getVideoPanelPositionAfterResize({
        corner: "se",
        startPosition: start,
        startWidth: 320,
        startHeight: 200,
        nextWidth: 400,
        nextHeight: 250,
      }),
    ).toEqual(start);
  });

  it("anchors the bottom-right when resizing from the top-left", () => {
    expect(
      getVideoPanelPositionAfterResize({
        corner: "nw",
        startPosition: start,
        startWidth: 320,
        startHeight: 200,
        nextWidth: 400,
        nextHeight: 250,
      }),
    ).toEqual({ x: 20, y: 30 });
  });
});
