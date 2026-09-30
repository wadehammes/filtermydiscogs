import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "@jest/globals";

const CSS_PATH = join(
  process.cwd(),
  "src/components/ReleaseTracklist/ReleaseTracklist.module.css",
);

describe("ReleaseTracklist.module.css", () => {
  it("caps tracklist scroll height using available viewport height", () => {
    const css = readFileSync(CSS_PATH, "utf8");

    expect(css).toContain("var(--available-height, 100dvh)");
    expect(css).toContain("max-height: min(");
  });
});
