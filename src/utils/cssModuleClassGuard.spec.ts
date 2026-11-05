import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "@jest/globals";
import {
  findUnusedCssModuleClasses,
  listCssModuleClassNames,
} from "src/utils/cssModuleClassGuard";

describe("cssModuleClassGuard", () => {
  it("lists top-level class selectors from a CSS module", () => {
    const css = `
.chartContainer {
  display: block;
}

.chartTitle {
  color: red;
}
`;

    expect(listCssModuleClassNames(css)).toEqual([
      "chartContainer",
      "chartTitle",
    ]);
  });

  it("when a class is not referenced via styles.* in TSX, reports it as unused", () => {
    const css = `
.used {
  display: block;
}

.unused {
  display: none;
}
`;
    const tsx = `export const X = () => <div className={styles.used} />;`;

    expect(findUnusedCssModuleClasses(css, tsx)).toEqual(["unused"]);
  });

  it("when dashboard GrowthChart styles are paired, every CSS module class is referenced", () => {
    const css = readFileSync(
      join(__dirname, "../components/Dashboard/GrowthChart.module.css"),
      "utf8",
    );
    const tsx = readFileSync(
      join(__dirname, "../components/Dashboard/GrowthChart.component.tsx"),
      "utf8",
    );

    expect(findUnusedCssModuleClasses(css, tsx)).toEqual([]);
  });

  it("when dashboard TopTracks styles are paired, every CSS module class is referenced", () => {
    const css = readFileSync(
      join(__dirname, "../components/Dashboard/TopTracks.module.css"),
      "utf8",
    );
    const tsx = readFileSync(
      join(__dirname, "../components/Dashboard/TopTracks.component.tsx"),
      "utf8",
    );

    expect(findUnusedCssModuleClasses(css, tsx)).toEqual([]);
  });
});
