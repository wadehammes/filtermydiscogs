import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "@jest/globals";

const MINI_PLAYER_CSS_PATH = join(
  process.cwd(),
  "src/components/ReleaseMiniPlayer/ReleaseMiniPlayer.module.css",
);
const QUEUE_DRAWER_CSS_PATH = join(
  process.cwd(),
  "src/components/PlaybackQueueDrawer/PlaybackQueueDrawer.module.css",
);

describe("ReleaseMiniPlayer queue and video stacking", () => {
  it("lowers the expanded video panel when the queue opens over it", () => {
    const css = readFileSync(MINI_PLAYER_CSS_PATH, "utf8");

    expect(css).toContain(
      ".miniPlayerShell[data-queue-over-video] > #release-playback-video-panel",
    );
    expect(css).toContain("z-index: 1");
  });

  it("raises the transport bar when the queue is open", () => {
    const css = readFileSync(MINI_PLAYER_CSS_PATH, "utf8");

    expect(css).toContain(
      ".miniPlayerShell[data-playback-queue-shell-open] .miniPlayerBar",
    );
    expect(css).toContain("z-index: 3");
  });

  it("elevates the inline queue drawer above the video panel", () => {
    const css = readFileSync(QUEUE_DRAWER_CSS_PATH, "utf8");

    expect(css).toContain(
      ".queueDrawerOverVideo.queueDrawerShell.queueLayer.queueElevated",
    );
    expect(css).toContain("z-index: 2");
  });
});
