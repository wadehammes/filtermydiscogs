import {
  E2E_ALBUM_ONE,
  E2E_ALBUM_THREE,
  E2E_ALBUM_TWO,
} from "src/tests/msw/e2eSession.constants";
import { expect, test } from "./fixtures/msw.fixture";
import { expectAppNavLinkReachable } from "./helpers/appNavigation";
import {
  e2eReleaseCards,
  expectE2eCollectionLoaded,
  expectNotOnLogin,
} from "./helpers/authenticatedExpectations";
import { isDesktopAppNavViewport } from "./helpers/viewportLayout";

test.describe("authenticated releases (MSW)", () => {
  test("renders releases workspace after collection loads", async ({
    page,
  }) => {
    await page.goto("/releases");

    await expect(page).toHaveURL(/\/releases/);
    await expectNotOnLogin(page);
    await expectAppNavLinkReachable(page, "Releases");
    await expectE2eCollectionLoaded(page);
    if (isDesktopAppNavViewport(page.viewportSize())) {
      await expect(
        page.getByRole("group", { name: "Collection view mode" }),
      ).toBeVisible();
    }
    await expect(
      e2eReleaseCards(page).filter({ hasText: E2E_ALBUM_ONE }),
    ).toBeVisible();
    await expect(
      e2eReleaseCards(page).filter({ hasText: E2E_ALBUM_TWO }),
    ).toBeVisible();
    await expect(
      e2eReleaseCards(page).filter({ hasText: E2E_ALBUM_THREE }),
    ).toBeVisible();
    if (isDesktopAppNavViewport(page.viewportSize())) {
      await expect(
        page.getByRole("combobox", { name: "Select crate" }),
      ).toBeVisible();
    } else {
      await expect(
        page.getByRole("button", { name: /Open crate with/i }),
      ).toBeVisible();
    }
  });
});
