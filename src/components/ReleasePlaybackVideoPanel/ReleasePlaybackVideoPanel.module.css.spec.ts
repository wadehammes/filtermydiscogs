import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "@jest/globals";

const VIDEO_PANEL_CSS_PATH = join(
  process.cwd(),
  "src/components/ReleasePlaybackVideoPanel/ReleasePlaybackVideoPanel.module.css",
);
const PLAYBACK_DOCK_CSS_PATH = join(
  process.cwd(),
  "src/styles/modules/playback-dock.module.css",
);

describe("ReleasePlaybackVideoPanel.module.css", () => {
  it("defaults the desktop floating panel to the bottom-right above the dock", () => {
    const css = readFileSync(VIDEO_PANEL_CSS_PATH, "utf8");

    expect(css).toContain(
      "right: var(--release-video-panel-inset-right, var(--space-5))",
    );
    expect(css).toContain("left: auto");
  });
});

describe("playback-dock.module.css", () => {
  it("keeps the default video panel inset on the bottom-right when the crate sidebar is open", () => {
    const css = readFileSync(PLAYBACK_DOCK_CSS_PATH, "utf8");

    expect(css).toContain("--release-video-panel-inset-right: var(--space-5)");
    expect(css).not.toContain('[data-crate-sidebar-open="true"]');
  });
});
