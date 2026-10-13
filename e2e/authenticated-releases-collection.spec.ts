import {
  E2E_ALBUM_ONE,
  E2E_ALBUM_THREE,
  E2E_ALBUM_TWO,
} from "src/tests/msw/e2eSession.constants";
import {
  E2E_TAG_DESKTOP_ONLY,
  E2E_TAG_MOBILE_ONLY,
} from "./e2eProjectTags.constants";
import { expect, test } from "./fixtures/msw.fixture";
import { e2eReleaseCards } from "./helpers/authenticatedExpectations";
import { selectGenreStyleFilter } from "./helpers/filtersBar";
import {
  closeMobileFiltersDrawer,
  expectCardGridVisible,
  expectDefaultE2eCollectionSummary,
  expectListTableVisible,
  expectShowingReleaseCount,
  searchReleasesCollection,
  switchCollectionView,
} from "./helpers/releasesCollection";
import { gotoReleasesWorkspace } from "./helpers/releasesWorkspace";

test.describe("authenticated releases collection interactions (MSW)", () => {
  test.beforeEach(async ({ page }) => {
    await gotoReleasesWorkspace(page);
  });

  test("desktop search narrows the visible release count", {
    tag: E2E_TAG_DESKTOP_ONLY,
  }, async ({ page }) => {
    await expectDefaultE2eCollectionSummary(page);
    await searchReleasesCollection(page, E2E_ALBUM_ONE);
    await expectShowingReleaseCount(page, 1);
    await expect(
      e2eReleaseCards(page).filter({ hasText: E2E_ALBUM_ONE }),
    ).toBeVisible();
    await expect(
      e2eReleaseCards(page).filter({ hasText: E2E_ALBUM_TWO }),
    ).toHaveCount(0);
  });

  test("mobile genre filter in the filters drawer narrows the collection", {
    tag: E2E_TAG_MOBILE_ONLY,
  }, async ({ page }) => {
    await expectDefaultE2eCollectionSummary(page);
    await page.getByRole("button", { name: "Open filters" }).click();
    await expect(page.getByRole("dialog", { name: "Filters" })).toBeVisible();
    await selectGenreStyleFilter(page, "Jazz");
    await closeMobileFiltersDrawer(page);
    await expectShowingReleaseCount(page, 1);
    await expect(
      e2eReleaseCards(page).filter({ hasText: E2E_ALBUM_THREE }),
    ).toBeVisible();
  });

  test("mobile search in the filters drawer narrows the visible release count", {
    tag: E2E_TAG_MOBILE_ONLY,
  }, async ({ page }) => {
    await expectDefaultE2eCollectionSummary(page);
    await searchReleasesCollection(page, E2E_ALBUM_TWO);
    await expectShowingReleaseCount(page, 1);
    await expect(
      e2eReleaseCards(page).filter({ hasText: E2E_ALBUM_TWO }),
    ).toBeVisible();
    await closeMobileFiltersDrawer(page);
  });

  test("desktop genre filter narrows the collection", {
    tag: E2E_TAG_DESKTOP_ONLY,
  }, async ({ page }) => {
    await expectDefaultE2eCollectionSummary(page);
    await selectGenreStyleFilter(page, "Indie Rock");
    await expectShowingReleaseCount(page, 1);
    await expect(
      e2eReleaseCards(page).filter({ hasText: E2E_ALBUM_ONE }),
    ).toBeVisible();
    await expect(
      e2eReleaseCards(page).filter({ hasText: E2E_ALBUM_THREE }),
    ).toHaveCount(0);
  });

  test("view toggle switches between card grid and list table", {
    tag: E2E_TAG_DESKTOP_ONLY,
  }, async ({ page }) => {
    await expectCardGridVisible(page);
    await switchCollectionView(page, "list");
    await expectListTableVisible(page);
    await switchCollectionView(page, "card");
    await expectCardGridVisible(page);
  });
});
