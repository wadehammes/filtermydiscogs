import { describe, expect, it } from "@jest/globals";
import {
  buildDashboardDrilldownAriaLabel,
  buildDashboardDrilldownTooltip,
} from "src/utils/dashboardDrilldownCopy";

describe("buildDashboardDrilldownTooltip", () => {
  it("when given a filter label, explains collection navigation", () => {
    expect(buildDashboardDrilldownTooltip("House")).toBe(
      "Open your collection filtered by House",
    );
  });
});

describe("buildDashboardDrilldownAriaLabel", () => {
  it("when given a filter label, matches tooltip copy", () => {
    expect(buildDashboardDrilldownAriaLabel("Techno")).toBe(
      buildDashboardDrilldownTooltip("Techno"),
    );
  });
});
