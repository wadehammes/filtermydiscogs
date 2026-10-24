import { expect, type Page } from "@playwright/test";
import { NOW_PLAYING_REGION_LABEL } from "src/constants/accessibilityLabels.constants";

export const E2E_SIMULATE_YOUTUBE_PAUSE_LABEL = "E2E simulate YouTube pause";

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

  const frame = page.frameLocator('[data-testid="fmdPersistentYoutubeIframe"]');
  await frame
    .getByRole("button", { name: E2E_SIMULATE_YOUTUBE_PAUSE_LABEL })
    .click({ timeout: 15_000 });
};
