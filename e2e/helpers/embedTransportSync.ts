import { expect, type Page } from "@playwright/test";
import { NOW_PLAYING_REGION_LABEL } from "src/constants/accessibilityLabels.constants";
import { EMBED_TRACK_SWITCH_PAUSE_GRACE_MS } from "src/utils/youtubeIframeEvents";

export const expectE2eNowPlayingShowsPauseControl = async (page: Page) => {
  const nowPlaying = page.getByRole("region", {
    name: NOW_PLAYING_REGION_LABEL,
  });

  await expect(nowPlaying).toBeVisible({ timeout: 15_000 });
  await expect(nowPlaying.getByRole("button", { name: "Pause" })).toBeVisible({
    timeout: 15_000,
  });
};

export const expectE2eNowPlayingShowsPlayControl = async (page: Page) => {
  const nowPlaying = page.getByRole("region", {
    name: NOW_PLAYING_REGION_LABEL,
  });

  await expect(nowPlaying).toBeVisible({ timeout: 15_000 });
  await expect(nowPlaying.getByRole("button", { name: "Pause" })).toBeHidden({
    timeout: 15_000,
  });
  await expect(
    nowPlaying.getByRole("button", { name: "Play", exact: true }),
  ).toBeVisible({
    timeout: 15_000,
  });
};

const postE2eYoutubeMockPause = async (page: Page) => {
  await page.evaluate(() => {
    const iframe = document.querySelector(
      '[data-testid="fmdPersistentYoutubeIframe"]',
    );

    if (!(iframe instanceof HTMLIFrameElement && iframe.contentWindow)) {
      throw new Error("E2E YouTube mock iframe is not attached");
    }

    iframe.contentWindow.postMessage(
      JSON.stringify({ event: "command", func: "pauseVideo" }),
      "*",
    );

    const pauseButton = iframe.contentDocument?.getElementById(
      "e2eSimulateYoutubePause",
    );

    if (pauseButton instanceof HTMLButtonElement) {
      pauseButton.click();
    }
  });
};

export const simulateE2eYoutubeChromePause = async (page: Page) => {
  const iframe = page.getByTestId("fmdPersistentYoutubeIframe");
  await expect(iframe).toBeAttached({
    timeout: 15_000,
  });
  await expect(iframe).toHaveAttribute(
    "src",
    /\/e2e\/youtube-embed-mock\.html/,
    {
      timeout: 15_000,
    },
  );

  const nowPlaying = page.getByRole("region", {
    name: NOW_PLAYING_REGION_LABEL,
  });
  const pauseButton = nowPlaying.getByRole("button", { name: "Pause" });

  const maxAttempts = 3;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await postE2eYoutubeMockPause(page);

    if (attempt < maxAttempts - 1) {
      try {
        await expect(pauseButton).toBeHidden({ timeout: 2_000 });
        return;
      } catch {
        await page.waitForTimeout(EMBED_TRACK_SWITCH_PAUSE_GRACE_MS + 250);
        continue;
      }
    }

    await expect(pauseButton).toBeHidden({ timeout: 15_000 });
  }
};
