import { expect, test } from "./fixtures/msw.fixture";
import {
  expectLoginLanding,
  expectNotOnLogin,
} from "./helpers/authenticatedExpectations";
import { gotoReleasesWorkspace } from "./helpers/releasesWorkspace";
import { logoutFromUserMenu } from "./helpers/userMenu";
import { isDesktopAppNavViewport } from "./helpers/viewportLayout";

test.describe("authenticated logout and clear data (MSW)", () => {
  test("user menu logout returns to the landing page", async ({ page }) => {
    test.skip(
      !isDesktopAppNavViewport(page.viewportSize()),
      "desktop user menu exposes username trigger",
    );

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
    await page.getByRole("button", { name: "Clear data" }).click();

    await expect(page).toHaveURL(/\//);
    await expectLoginLanding(page);
  });
});
