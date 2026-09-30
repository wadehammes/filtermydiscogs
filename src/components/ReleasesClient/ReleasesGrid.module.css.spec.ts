import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "@jest/globals";

const CSS_PATH = join(
  process.cwd(),
  "src/components/ReleasesClient/ReleasesGrid.module.css",
);

describe("ReleasesGrid.module.css", () => {
  it("uses container queries on the releases main column for multi-column grid", () => {
    const css = readFileSync(CSS_PATH, "utf8");

    expect(css).toContain("@container releases-main (min-width: 620px)");
    expect(css).toContain(
      "grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))",
    );
    expect(css).toContain("&[data-fixed-lanes]");
    expect(css).toContain("var(--grid-lane-count)");
    expect(css).toContain("minmax(0, 20rem)");
  });

  it("caps a lone grid item width when the main column is wide enough", () => {
    const css = readFileSync(CSS_PATH, "utf8");

    expect(css).toContain("&:only-child");
    expect(css).toContain("max-width: 20rem");
  });
});
