import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "@jest/globals";

const CSS_PATH = join(
  process.cwd(),
  "src/components/AppDialog/AppDialog.module.css",
);

describe("AppDialog.module.css", () => {
  it("caps workspace-portaled modals to the overlay portal height, not full viewport svh", () => {
    const css = readFileSync(CSS_PATH, "utf8");

    expect(css).toContain(".popupModalShell");
    expect(css).toMatch(
      /\.popupModalShell[\s\S]*max-height:\s*min\([\s\S]*calc\(100% - var\(--space-8\)\)/,
    );
    expect(css).not.toMatch(/\.popupModalShell[\s\S]*max-height:[\s\S]*90svh/);
  });
});
