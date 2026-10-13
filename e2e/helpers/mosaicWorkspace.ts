import { expect, type Page } from "@playwright/test";
import { E2E_ALBUM_ONE } from "src/tests/msw/e2eSession.constants";
import { expectNotOnLogin } from "./authenticatedExpectations";

export const gotoMosaicWorkspace = async (page: Page) => {
  await page.goto("/mosaic", { waitUntil: "load" });
  await expect(page).toHaveURL(/\/mosaic/, { timeout: 60_000 });
  await expectNotOnLogin(page);
  await expect(
    page.getByRole("button", {
      name: `Open release details for ${E2E_ALBUM_ONE}`,
    }),
  ).toBeVisible({
    timeout: 60_000,
  });
};
