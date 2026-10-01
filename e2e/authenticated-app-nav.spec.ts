import { expect, test } from "./fixtures/msw.fixture";
import { clickAppNavLink } from "./helpers/appNavigation";
import { expectNotOnLogin } from "./helpers/authenticatedExpectations";
import { isDesktopAppNavViewport } from "./helpers/viewportLayout";

test.describe("authenticated app navigation (MSW)", () => {
  test("mobile menu reaches mosaic and crates", async ({ page }) => {
    test.skip(
      isDesktopAppNavViewport(page.viewportSize()),
      "mobile menu navigation",
    );

    await page.goto("/releases");
    await expectNotOnLogin(page);

    await clickAppNavLink(page, "Mosaic");
    await expect(page).toHaveURL(/\/mosaic/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Album Mosaic" }),
    ).toBeVisible({ timeout: 30_000 });

    await clickAppNavLink(page, "Crates");
    await expect(page).toHaveURL(/\/crates$/);
    await expect(page.getByRole("main", { name: "Crates" })).toBeVisible({
      timeout: 30_000,
    });
  });
});
