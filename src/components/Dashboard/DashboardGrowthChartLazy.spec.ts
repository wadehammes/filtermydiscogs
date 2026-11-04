import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "@jest/globals";

const dashboardClientPath = join(
  __dirname,
  "DashboardClient.component.tsx",
);

describe("DashboardGrowthChartLazy", () => {
  it("when dashboard loads growth analytics, uses the lazy wrapper instead of a static GrowthChart import", () => {
    const source = readFileSync(dashboardClientPath, "utf8");

    expect(source).toContain("DashboardGrowthChartLazy");
    expect(source).not.toContain('from "./GrowthChart.component"');
  });
});
