import { describe, expect, it } from "@jest/globals";
import { resolveBetaBannerVisible } from "src/lib/sentry/resolveBetaBannerVisible";

describe("resolveBetaBannerVisible", () => {
  it("returns true when a test callback is provided", () => {
    expect(resolveBetaBannerVisible(() => {})).toBe(true);
  });
});
