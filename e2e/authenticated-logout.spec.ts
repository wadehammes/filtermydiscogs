import { CLEAR_ALL_DATA_CONFIRM_PHRASE } from "src/constants/clearData.constants";
import { E2E_TAG_DESKTOP_ONLY } from "./e2eProjectTags.constants";
import { expect, test } from "./fixtures/msw.fixture";
import {
  expectLoginLanding,
  expectNotOnLogin,
} from "./helpers/authenticatedExpectations";
import { gotoReleasesWorkspace } from "./helpers/releasesWorkspace";
import { logoutFromUserMenu } from "./helpers/userMenu";

test.describe("authenticated logout and clear data (MSW)", () => {
  test("user menu logout returns to the landing page", {
    tag: E2E_TAG_DESKTOP_ONLY,
  }, async ({ page }) => {
    await gotoReleasesWorkspace(page);
    await expectNotOnLogin(page);
    await logoutFromUserMenu(page);

    await expect(page).toHaveURL(/\//);
    await expectLoginLanding(page);
  });

  test("settings clear all stored data signs out and returns home", async ({
    page,
  }) => {
    await gotoReleasesWorkspace(page);
    await expectNotOnLogin(page);

    await page.goto("/settings?section=data");
    await page.getByRole("button", { name: "Clear all stored data" }).click();
    await expect(
      page.getByRole("heading", { level: 2, name: "Clear all stored data" }),
    ).toBeVisible();
    await page
      .getByRole("textbox", {
        name: new RegExp(`type ${CLEAR_ALL_DATA_CONFIRM_PHRASE}`, "i"),
      })
      .fill(CLEAR_ALL_DATA_CONFIRM_PHRASE);
    await page.getByRole("button", { name: "Clear all data" }).click();

    await expect(page).toHaveURL(/\//);
    await expectLoginLanding(page);
  });
});
