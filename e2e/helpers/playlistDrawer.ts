import { expect, type Page } from "@playwright/test";
import { E2E_PLAYLIST_NAME } from "src/tests/msw/e2ePlaylist.constants";
import { e2eTrackTitle } from "src/tests/msw/e2eReleaseDetailData";
import { E2E_ALBUM_ONE } from "src/tests/msw/e2eSession.constants";

export const openDesktopPlaylistDrawer = async (page: Page) => {
  await page
    .getByTestId("fmdCollectionSidePanelToggle")
    .getByRole("button", { name: "Open playlists panel" })
    .click();

  await expect(page.getByTestId("fmdPlaylistDrawer")).toBeVisible({
    timeout: 15_000,
  });
};

export const selectE2ePlaylistInDrawer = async (page: Page) => {
  const selector = page.getByTestId("fmdPlaylistSelector");
  await expect(selector).toBeVisible({ timeout: 15_000 });
  await selector.getByRole("combobox").click();
  await page.getByRole("option", { name: `${E2E_PLAYLIST_NAME} (1)` }).click();
};

export const playE2ePlaylistFromDrawerFooter = async (page: Page) => {
  await page
    .getByTestId("fmdPlaylistDrawerFooter")
    .getByRole("button", { name: "Play" })
    .click();
};

export const expectActivePlaylistTrackShowsPausedIndicator = async (
  page: Page,
) => {
  const trackTitle = e2eTrackTitle(E2E_ALBUM_ONE);
  const activeRow = page.getByTestId("fmdPlaylistDrawerTrackItem").filter({
    has: page.getByRole("button", { name: `Now playing ${trackTitle}` }),
  });

  await expect(activeRow).toBeVisible({ timeout: 15_000 });
  await expect(activeRow.getByTestId("fmdPlayingIndicator")).toHaveAttribute(
    "data-playback-state",
    "paused",
    { timeout: 15_000 },
  );
};
