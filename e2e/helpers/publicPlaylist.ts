import { expect, type Page } from "@playwright/test";
import { PUBLIC_SHARED_PLAYLIST_MAIN_LABEL } from "src/constants/accessibilityLabels.constants";
import {
  LOGIN_DEMO_PUBLIC_PLAYLIST_PATH,
  LOGIN_DEMO_PUBLIC_PLAYLIST_TITLE,
} from "src/constants/publicPlaylist.constants";
import { locateVisibleByTestId } from "./locateVisibleByTestId";

export const gotoPublicDemoPlaylist = async (page: Page) => {
  await page.goto(LOGIN_DEMO_PUBLIC_PLAYLIST_PATH, {
    waitUntil: "load",
  });

  await expect(page).toHaveURL(new RegExp(LOGIN_DEMO_PUBLIC_PLAYLIST_PATH));
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: LOGIN_DEMO_PUBLIC_PLAYLIST_TITLE,
    }),
  ).toBeVisible({
    timeout: 15_000,
  });

  const publicPlaylistMain = locateVisibleByTestId(page, "fmdPublicPlaylist");
  await expect(publicPlaylistMain).toBeVisible({
    timeout: 15_000,
  });
  await expect(publicPlaylistMain).toHaveAttribute(
    "aria-label",
    PUBLIC_SHARED_PLAYLIST_MAIN_LABEL,
  );
};
