import { expect, type Page } from "@playwright/test";
import { NOW_PLAYING_REGION_LABEL } from "src/constants/accessibilityLabels.constants";
import { PLAYBACK_DOCK_VOLUME_STORAGE_KEY } from "src/constants/storageKeys";
import { PLAYBACK_DOCK_SEEK_SKIP_SECONDS } from "src/utils/playbackEmbedProgress";

const nowPlayingRegion = (page: Page) =>
  page.getByRole("region", {
    name: NOW_PLAYING_REGION_LABEL,
  });

export const expectE2ePlaybackDockDigControlsVisible = async (page: Page) => {
  const nowPlaying = nowPlayingRegion(page);

  await expect(nowPlaying).toBeVisible({ timeout: 15_000 });
  await expect(
    nowPlaying.getByTestId("fmdReleaseMiniPlayerDigScrub"),
  ).toBeVisible({
    timeout: 15_000,
  });
  await expect(
    nowPlaying.getByRole("button", { name: "Playback volume" }),
  ).toBeVisible({
    timeout: 15_000,
  });
};

export const skipE2ePlaybackDockForward = async (page: Page) => {
  const nowPlaying = nowPlayingRegion(page);

  await nowPlaying
    .getByRole("button", {
      name: `+${PLAYBACK_DOCK_SEEK_SKIP_SECONDS}s`,
      exact: true,
    })
    .click();
};

export const expectE2ePlaybackDockElapsedTime = async (
  page: Page,
  elapsedLabel: string,
) => {
  const timeLabel = nowPlayingRegion(page).getByTestId(
    "fmdPlaybackDockTimeLabel",
  );

  await expect(timeLabel.getByText(elapsedLabel, { exact: true })).toBeVisible({
    timeout: 15_000,
  });
};

export const openE2ePlaybackVolumePopover = async (page: Page) => {
  const nowPlaying = nowPlayingRegion(page);

  await nowPlaying
    .getByRole("button", { name: "Playback volume" })
    .click({ timeout: 15_000 });

  await expect(
    page.getByTestId("fmdReleaseMiniPlayerVolumePopover"),
  ).toBeVisible({
    timeout: 15_000,
  });
};

export const commitE2ePlaybackDockLowVolume = async (page: Page) => {
  const slider = page.getByTestId("fmdPlaybackDockVolumeSlider");
  const box = await slider.boundingBox();

  if (!box) {
    throw new Error("Playback dock volume slider is not visible");
  }

  await page.mouse.click(box.x + box.width / 2, box.y + box.height - 2);
};

export const expectE2ePlaybackDockVolumePersistedBelowDefault = async (
  page: Page,
) => {
  await expect
    .poll(
      async () => {
        const stored = await page.evaluate(
          (key) => localStorage.getItem(key),
          PLAYBACK_DOCK_VOLUME_STORAGE_KEY,
        );

        return stored === null ? null : Number(stored);
      },
      { timeout: 15_000 },
    )
    .toBeLessThan(100);
};
