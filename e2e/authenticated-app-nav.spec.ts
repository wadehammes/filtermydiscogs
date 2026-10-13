import { E2E_TAG_MOBILE_ONLY } from "./e2eProjectTags.constants";
import { expect, test } from "./fixtures/msw.fixture";
import { clickAppNavLink } from "./helpers/appNavigation";
import { expectNotOnLogin } from "./helpers/authenticatedExpectations";

test.describe("authenticated app navigation (MSW)", () => {
  test("mobile menu reaches mosaic and crates", {
    tag: E2E_TAG_MOBILE_ONLY,
  }, async ({ page }) => {
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
