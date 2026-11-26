import { describe, expect, it } from "@jest/globals";
import {
  contrastRatio,
  meetsContrast,
  parseCssColorToRgb,
  WCAG_AA_NORMAL_TEXT,
} from "./wcagContrast";

describe("wcagContrast", () => {
  it("parses hex and rgb colors", () => {
    expect(parseCssColorToRgb("#ffffff")).toEqual([255, 255, 255]);
    expect(parseCssColorToRgb("rgb(0, 0, 0)")).toEqual([0, 0, 0]);
    expect(parseCssColorToRgb("color(srgb 0.5 0.5 0.5)")).toEqual([
      128, 128, 128,
    ]);
  });

  it("computes black on white at 21:1", () => {
    const ratio = contrastRatio([0, 0, 0], [255, 255, 255]);
    expect(ratio).toBeCloseTo(21, 0);
    expect(meetsContrast(ratio, WCAG_AA_NORMAL_TEXT)).toBe(true);
  });
});
