import { beforeEach, describe, expect, it } from "@jest/globals";
import {
  applyVideoPanelLayoutToElement,
  clampVideoPanelPosition,
  clampVideoPanelScale,
} from "src/utils/videoPanelDragLayout";

describe("videoPanelDragLayout", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 800,
    });
  });

  describe("clampVideoPanelPosition", () => {
    it("keeps the panel inside the viewport", () => {
      expect(
        clampVideoPanelPosition({
          x: -10,
          y: 900,
          width: 200,
          height: 150,
        }),
      ).toEqual({ x: 0, y: 650 });
    });
  });

  describe("clampVideoPanelScale", () => {
    it("clamps scale between min and max", () => {
      expect(
        clampVideoPanelScale({ scale: 2, minScale: 0.5, maxScale: 1.25 }),
      ).toBe(1.25);
      expect(
        clampVideoPanelScale({ scale: 0.1, minScale: 0.5, maxScale: 1.25 }),
      ).toBe(0.5);
    });
  });

  describe("applyVideoPanelLayoutToElement", () => {
    it("sets docked layout when position is null", () => {
      const panel = document.createElement("div");

      applyVideoPanelLayoutToElement(panel, {
        position: null,
        scale: 0.75,
      });

      expect(panel.style.getPropertyValue("--panel-scale")).toBe("0.75");
      expect(panel.style.left).toBe("");
      expect(panel.style.top).toBe("");
    });

    it("positions the panel when a float position is set", () => {
      const panel = document.createElement("div");

      applyVideoPanelLayoutToElement(panel, {
        position: { x: 12, y: 34 },
        scale: 1,
      });

      expect(panel.style.left).toBe("12px");
      expect(panel.style.top).toBe("34px");
      expect(panel.style.right).toBe("auto");
    });
  });
});
