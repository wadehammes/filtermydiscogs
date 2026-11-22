import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "@jest/globals";

describe("PlaybackQueueDrawer.module.css", () => {
  it("centers the drag handle in the leading gutter", () => {
    const css = readFileSync(
      join(__dirname, "PlaybackQueueDrawer.module.css"),
      "utf8",
    );

    expect(css).toContain("--queue-leading-inset");
    expect(css).toMatch(
      /inset-inline-start:\s*calc\(var\(--queue-leading-inset\) \/ 2\)/,
    );
    expect(css).toMatch(/translate:\s*-50% -50%/);
    expect(css).not.toMatch(/grid-template-columns:\s*auto 1fr auto/);
  });
});
