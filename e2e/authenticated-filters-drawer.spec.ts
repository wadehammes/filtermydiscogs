import { E2E_ALBUM_THREE } from "src/tests/msw/e2eSession.constants";
import { expect, test } from "./fixtures/msw.fixture";
import { e2eReleaseCards } from "./helpers/authenticatedExpectations";
import { selectGenreStyleFilter } from "./helpers/filtersBar";
import {
  closeMobileFiltersDrawer,
  expectShowingReleaseCount,
} from "./helpers/releasesCollection";
import { gotoReleasesWorkspace } from "./helpers/releasesWorkspace";
import { isDesktopAppNavViewport } from "./helpers/viewportLayout";

test.describe("authenticated mobile filters drawer (MSW)", () => {
  test("genre combobox options stay visible above the bottom drawer", async ({
    page,
  }) => {
    test.skip(
      isDesktopAppNavViewport(page.viewportSize()),
      "mobile filters drawer stacking",
    );

    await gotoReleasesWorkspace(page);
    await page.getByRole("button", { name: "Open filters" }).click();
    await expect(page.getByRole("dialog", { name: "Filters" })).toBeVisible();

    await selectGenreStyleFilter(page, "Jazz");
    await closeMobileFiltersDrawer(page);

    await expectShowingReleaseCount(page, 1);
    await expect(
      e2eReleaseCards(page).filter({ hasText: E2E_ALBUM_THREE }),
    ).toBeVisible();
  });
});
