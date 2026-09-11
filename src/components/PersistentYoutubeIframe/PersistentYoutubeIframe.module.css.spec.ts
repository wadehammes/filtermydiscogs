import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "@jest/globals";

const IFRAME_CSS_PATH = join(
  process.cwd(),
  "src/components/PersistentYoutubeIframe/PersistentYoutubeIframe.module.css",
);
const VIDEO_PANEL_CSS_PATH = join(
  process.cwd(),
  "src/components/ReleasePlaybackVideoPanel/ReleasePlaybackVideoPanel.module.css",
);

describe("PersistentYoutubeIframe.module.css", () => {
  it("keeps a 640×360 player box for both hidden and visible variants", () => {
    const css = readFileSync(IFRAME_CSS_PATH, "utf8");

    expect(css).toMatch(/--youtube-iframe-width:\s*640px/);
    expect(css).toMatch(/--youtube-iframe-height:\s*360px/);
    expect(css).toMatch(
      /\.iframeHidden,\s*\.iframeVisible[\s\S]*width:\s*var\(--youtube-iframe-width\)/,
    );
    expect(css).toMatch(
      /\.iframeHidden,\s*\.iframeVisible[\s\S]*height:\s*var\(--youtube-iframe-height\)/,
    );
    expect(css).not.toMatch(/\.iframeVisible[\s\S]*width:\s*100%/);
    expect(css).not.toMatch(/\.iframeVisible[\s\S]*height:\s*100%/);
  });

  it("scales the visible player to the panel with transform instead of resizing the iframe", () => {
    const css = readFileSync(IFRAME_CSS_PATH, "utf8");

    expect(css).toMatch(
      /\.iframeVisible[\s\S]*transform:\s*scale\(calc\(100cqw\s*\/\s*var\(--youtube-iframe-width\)\)\)/,
    );
    expect(css).toMatch(/\.iframeVisible[\s\S]*transform-origin:\s*0\s*0/);
  });
});

describe("ReleasePlaybackVideoPanel videoContent sizing", () => {
  it("exposes container size queries so the iframe can scale to the panel", () => {
    const css = readFileSync(VIDEO_PANEL_CSS_PATH, "utf8");

    expect(css).toMatch(/\.videoContent[\s\S]*container-type:\s*size/);
  });
});
